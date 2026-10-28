import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { initializeAivenContactSchema } from '../src/services/contactSchemaService.js'

const schemaSql = readFileSync(new URL('../database/contact-schema.sql', import.meta.url), 'utf8')
const columnRows = [
  ['id', 'bigint unsigned', 'NO', null, 'auto_increment', null],
  ['name', 'varchar(120)', 'NO', null, '', 'utf8mb4_unicode_ci'],
  ['email', 'varchar(254)', 'NO', null, '', 'utf8mb4_unicode_ci'],
  ['subject', 'varchar(200)', 'YES', null, '', 'utf8mb4_unicode_ci'],
  ['message', 'text', 'NO', null, '', 'utf8mb4_unicode_ci'],
  ['status', "enum('new','read','archived')", 'NO', 'new', '', 'utf8mb4_unicode_ci'],
  ['created_at', 'datetime(3)', 'NO', 'CURRENT_TIMESTAMP(3)', 'DEFAULT_GENERATED', null],
  [
    'updated_at',
    'datetime(3)',
    'NO',
    'CURRENT_TIMESTAMP(3)',
    'DEFAULT_GENERATED on update CURRENT_TIMESTAMP(3)',
    null,
  ],
].map(([name, type, nullable, default_value, extra, collation]) => ({
  name,
  type,
  nullable,
  default_value,
  extra,
  collation,
}))
const indexRows = [
  ['idx_contact_messages_created', 1, 1, 'created_at'],
  ['idx_contact_messages_created', 1, 2, 'id'],
  ['idx_contact_messages_status_created', 1, 1, 'status'],
  ['idx_contact_messages_status_created', 1, 2, 'created_at'],
  ['idx_contact_messages_status_created', 1, 3, 'id'],
  ['PRIMARY', 0, 1, 'id'],
].map(([name, non_unique, position, column_name]) => ({
  name,
  non_unique,
  position,
  column_name,
  prefix_length: null,
  expression: null,
  type: 'BTREE',
  visible: 'YES',
  direction: 'A',
}))
const checkRows = ['email', 'message', 'name'].map((name) => ({
  name: `chk_contact_messages_${name}`,
  enforced: 'YES',
  expression: `(char_length(trim(\`${name}\`)) > 0)`,
}))

function schemaDatabase({
  exists = false,
  rowCount = '0',
  change,
  warningStatus = 0,
  fail,
  encrypted = true,
  authorized = true,
  releaseFailure = false,
} = {}) {
  const calls = []
  let present = exists
  const metadata = {
    tables: [{ table_type: 'BASE TABLE', engine: 'InnoDB', collation: 'utf8mb4_unicode_ci' }],
    columns: structuredClone(columnRows),
    indexes: structuredClone(indexRows),
    checks: structuredClone(checkRows),
    foreignKeys: [],
    triggers: [],
  }
  change?.(metadata)
  const connection = {
    connection: { stream: { encrypted, authorized } },
    async execute(statement, parameters) {
      calls.push({ statement, parameters })
      if (fail) throw new Error('private-password mysql://private-host/private-schema CA-CONTENTS')
      if (statement.includes('information_schema.TABLES')) return [present ? metadata.tables : []]
      if (statement.includes('information_schema.COLUMNS')) return [metadata.columns]
      if (statement.includes('information_schema.STATISTICS')) return [metadata.indexes]
      if (statement.includes('information_schema.CHECK_CONSTRAINTS')) return [metadata.checks]
      if (statement.includes('information_schema.TABLE_CONSTRAINTS')) return [metadata.foreignKeys]
      if (statement.includes('information_schema.TRIGGERS')) return [metadata.triggers]
      if (statement.startsWith('SELECT CAST(COUNT(*)')) return [[{ total: rowCount }]]
      throw new Error('Unexpected query in test')
    },
    async query(statement) {
      calls.push({ statement })
      present = true
      return [{ warningStatus }]
    },
    release() {
      calls.push({ release: true })
      if (releaseFailure) throw new Error('private release details')
    },
  }
  return {
    calls,
    pool: {
      getConnection: async () => {
        calls.push({ acquire: true })
        return connection
      },
    },
  }
}

const initialize = (database, sql = schemaSql) =>
  initializeAivenContactSchema({ databasePool: database.pool, schemaSql: sql })
const ddlCalls = (database) => database.calls.filter((call) => call.statement?.startsWith('CREATE'))

test('absent Contact schema is inspected before one reviewed CREATE and validated afterward without data writes', async () => {
  const database = schemaDatabase()
  assert.deepEqual(await initialize(database), {
    created: true,
    schemaVerified: true,
    rowCount: '0',
  })
  assert.equal(ddlCalls(database).length, 1)
  const createIndex = database.calls.findIndex((call) => call.statement?.startsWith('CREATE'))
  assert.ok(
    database.calls
      .slice(0, createIndex)
      .some((call) => call.statement?.includes('information_schema.TABLES')),
  )
  assert.ok(
    database.calls
      .slice(createIndex + 1)
      .some((call) => call.statement?.includes('information_schema.COLUMNS')),
  )
  assert.ok(
    database.calls
      .filter((call) => call.statement)
      .every((call) =>
        /^(SELECT|CREATE TABLE IF NOT EXISTS contact_messages)/.test(call.statement),
      ),
  )
  assert.ok(
    database.calls
      .filter((call) => call.parameters)
      .every((call) => call.parameters.length === 1 && call.parameters[0] === 'contact_messages'),
  )
  assert.deepEqual(database.calls.at(-1), { release: true })
})

test('an existing compatible Contact table and records are preserved without any DDL', async () => {
  const database = schemaDatabase({ exists: true, rowCount: '7' })
  assert.deepEqual(await initialize(database), {
    created: false,
    schemaVerified: true,
    rowCount: '7',
  })
  assert.equal(ddlCalls(database).length, 0)
})

test('existing incompatible columns, defaults, engine, or collation require review instead of repair', async () => {
  for (const change of [
    (metadata) => {
      metadata.tables[0].table_type = 'VIEW'
    },
    (metadata) => {
      metadata.tables[0].engine = 'MyISAM'
    },
    (metadata) => {
      metadata.tables[0].collation = 'utf8mb4_0900_ai_ci'
    },
    (metadata) => {
      metadata.columns[1].type = 'varchar(40)'
    },
    (metadata) => {
      metadata.columns[3].nullable = 'NO'
    },
    (metadata) => {
      metadata.columns[5].default_value = 'read'
    },
    (metadata) => {
      metadata.columns[7].extra = ''
    },
    (metadata) => {
      metadata.columns.push({ name: 'unreviewed' })
    },
  ]) {
    const database = schemaDatabase({ exists: true, change })
    await assert.rejects(initialize(database), /Contact-only setup failed/)
    assert.equal(ddlCalls(database).length, 0)
    assert.deepEqual(database.calls.at(-1), { release: true })
  }
})

test('index shapes, checks/enforcement, foreign keys, and triggers must match the reviewed schema', async () => {
  for (const change of [
    (metadata) => {
      metadata.indexes.pop()
    },
    (metadata) => {
      metadata.indexes[0].column_name = 'email'
    },
    (metadata) => {
      metadata.indexes[0].prefix_length = 5
    },
    (metadata) => {
      metadata.indexes[0].visible = 'NO'
    },
    (metadata) => {
      metadata.indexes[0].direction = 'D'
    },
    (metadata) => {
      metadata.checks[0].enforced = 'NO'
    },
    (metadata) => {
      metadata.checks[0].expression = '(char_length(trim(`email`)) >= 0)'
    },
    (metadata) => {
      metadata.checks[0].expression = 'char_length(trim(`email`) > 0)'
    },
    (metadata) => {
      metadata.checks.push({ name: 'unreviewed' })
    },
    (metadata) => {
      metadata.foreignKeys.push({ name: 'unreviewed' })
    },
    (metadata) => {
      metadata.triggers.push({ name: 'unreviewed' })
    },
  ]) {
    const database = schemaDatabase({ exists: true, change })
    await assert.rejects(initialize(database), /Contact-only setup failed/)
    assert.equal(ddlCalls(database).length, 0)
  }
})

test('only the exact reviewed single CREATE statement is allowed before acquiring a connection', async () => {
  for (const sql of [
    `${schemaSql}\nINSERT INTO contact_messages (name) VALUES ('unsafe');`,
    schemaSql.replace('VARCHAR(120)', 'VARCHAR(121)'),
    schemaSql.replace('contact_messages', 'projects'),
    'DROP TABLE contact_messages;',
  ]) {
    const database = schemaDatabase()
    await assert.rejects(initialize(database, sql), /Contact-only setup failed/)
    assert.deepEqual(database.calls, [])
  }
  const database = schemaDatabase()
  assert.equal(
    (await initialize(database, `-- another comment\n${schemaSql.replace(/\n/g, '\n  ')}`))
      .schemaVerified,
    true,
  )
})

test('unencrypted or unauthorized connections cannot inspect or create the target schema', async () => {
  for (const settings of [{ encrypted: false }, { authorized: false }]) {
    const database = schemaDatabase(settings)
    await assert.rejects(initialize(database), /Contact-only setup failed/)
    assert.deepEqual(database.calls, [{ acquire: true }, { release: true }])
  }
})

test('driver and release failures expose no raw credentials, paths, certificate content, or cause', async () => {
  for (const settings of [{ fail: true }, { exists: true, releaseFailure: true }]) {
    const database = schemaDatabase(settings)
    await assert.rejects(initialize(database), (error) => {
      assert.match(error.message, /^Contact-only setup failed/)
      assert.doesNotMatch(
        error.stack,
        /private-password|mysql:\/\/|CA-CONTENTS|private release details/,
      )
      assert.equal(error.cause, undefined)
      return true
    })
    assert.deepEqual(database.calls.at(-1), { release: true })
  }
})

test('a concurrently created compatible table is revalidated without overwriting it', async () => {
  const database = schemaDatabase({ warningStatus: 1, rowCount: '1' })
  assert.deepEqual(await initialize(database), {
    created: false,
    schemaVerified: true,
    rowCount: '1',
  })
  assert.equal(ddlCalls(database).length, 1)
})

test('failed post-create validation never attempts ALTER, DROP, or record imports', async () => {
  const database = schemaDatabase({
    change: (metadata) => {
      metadata.columns[0].type = 'bigint'
    },
  })
  await assert.rejects(initialize(database), /Contact-only setup failed/)
  assert.equal(ddlCalls(database).length, 1)
  assert.ok(
    database.calls
      .filter((call) => call.statement)
      .every((call) => !/^(ALTER|DROP|TRUNCATE|INSERT|UPDATE|DELETE)/.test(call.statement)),
  )
})
