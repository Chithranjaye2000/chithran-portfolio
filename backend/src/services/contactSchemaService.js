import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const tableName = 'contact_messages'
// Changing the reviewed single CREATE statement requires an explicit schema review.
const reviewedSchemaDigest = '8f239957364e25f206b959e996755e93895bb08d2347423f5d7c3004b888bdea'
const expectedColumns = [
  ['id', 'bigint unsigned', 'NO', null, 'auto_increment', null],
  ['name', 'varchar(120)', 'NO', null, '', 'utf8mb4_unicode_ci'],
  ['email', 'varchar(254)', 'NO', null, '', 'utf8mb4_unicode_ci'],
  ['subject', 'varchar(200)', 'YES', null, '', 'utf8mb4_unicode_ci'],
  ['message', 'text', 'NO', null, '', 'utf8mb4_unicode_ci'],
  ['status', "enum('new','read','archived')", 'NO', 'new', '', 'utf8mb4_unicode_ci'],
  ['created_at', 'datetime(3)', 'NO', 'current_timestamp(3)', 'default_generated', null],
  [
    'updated_at',
    'datetime(3)',
    'NO',
    'current_timestamp(3)',
    'default_generated on update current_timestamp(3)',
    null,
  ],
]
const expectedIndexes = [
  ['idx_contact_messages_created', 1, 1, 'created_at'],
  ['idx_contact_messages_created', 1, 2, 'id'],
  ['idx_contact_messages_status_created', 1, 1, 'status'],
  ['idx_contact_messages_status_created', 1, 2, 'created_at'],
  ['idx_contact_messages_status_created', 1, 3, 'id'],
  ['PRIMARY', 0, 1, 'id'],
]
const checks = ['email', 'message', 'name']
const tableStatement = `SELECT TABLE_TYPE AS table_type, ENGINE AS engine,
  TABLE_COLLATION AS collation FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`
const columnsStatement = `SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type,
  IS_NULLABLE AS nullable, COLUMN_DEFAULT AS default_value, EXTRA AS extra,
  COLLATION_NAME AS collation FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`
const indexesStatement = `SELECT INDEX_NAME AS name, NON_UNIQUE AS non_unique,
  SEQ_IN_INDEX AS position, COLUMN_NAME AS column_name, SUB_PART AS prefix_length,
  INDEX_TYPE AS type, IS_VISIBLE AS visible, EXPRESSION AS expression,
  COLLATION AS direction FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY INDEX_NAME, SEQ_IN_INDEX`
const checksStatement = `SELECT tc.CONSTRAINT_NAME AS name, tc.ENFORCED AS enforced,
  cc.CHECK_CLAUSE AS expression FROM information_schema.TABLE_CONSTRAINTS tc
  JOIN information_schema.CHECK_CONSTRAINTS cc
    ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
  WHERE tc.TABLE_SCHEMA = DATABASE() AND tc.TABLE_NAME = ?
    AND tc.CONSTRAINT_TYPE = 'CHECK' ORDER BY tc.CONSTRAINT_NAME`
const foreignKeysStatement = `SELECT CONSTRAINT_NAME AS name
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`
const triggersStatement = `SELECT TRIGGER_NAME AS name FROM information_schema.TRIGGERS
  WHERE TRIGGER_SCHEMA = DATABASE() AND EVENT_OBJECT_TABLE = ?`

function normalizedCheck(expression) {
  let text = String(expression).toLowerCase().replace(/`|\s/g, '')
  // MySQL adds outer parentheses when returning CHECK_CLAUSE.
  while (text.startsWith('(') && text.endsWith(')')) {
    let depth = 0
    let wrapsAll = true
    for (let index = 0; index < text.length - 1; index++) {
      if (text[index] === '(') depth++
      else if (text[index] === ')') depth--
      if (depth === 0) {
        wrapsAll = false
        break
      }
    }
    if (!wrapsAll) break
    text = text.slice(1, -1)
  }
  return text
}

function reviewedStatement(sql) {
  const statement = sql
    .replace(/^\s*--.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/;$/, '')
  if (createHash('sha256').update(statement).digest('hex') !== reviewedSchemaDigest) {
    throw new Error('Contact schema file requires review.')
  }
  return statement
}

async function inspectTable(connection) {
  const [tables] = await connection.execute(tableStatement, [tableName])
  return tables
}

async function validateTable(connection, tables) {
  if (
    tables.length !== 1 ||
    tables[0].table_type !== 'BASE TABLE' ||
    tables[0].engine !== 'InnoDB' ||
    tables[0].collation !== 'utf8mb4_unicode_ci'
  ) {
    throw new Error('Contact table definition differs from the reviewed schema.')
  }
  const [columns] = await connection.execute(columnsStatement, [tableName])
  const actualColumns = columns.map((column) => [
    column.name,
    column.type.toLowerCase(),
    column.nullable,
    typeof column.default_value === 'string' &&
    column.default_value.toLowerCase().startsWith('current_timestamp')
      ? column.default_value.toLowerCase()
      : column.default_value,
    column.extra.toLowerCase().replace(/\s+/g, ' ').trim(),
    column.collation,
  ])
  if (JSON.stringify(actualColumns) !== JSON.stringify(expectedColumns))
    throw new Error('Contact columns differ from the reviewed schema.')

  const [indexes] = await connection.execute(indexesStatement, [tableName])
  const actualIndexes = indexes.map((index) => [
    index.name,
    index.non_unique,
    index.position,
    index.column_name,
  ])
  if (
    JSON.stringify(actualIndexes) !== JSON.stringify(expectedIndexes) ||
    indexes.some(
      (index) =>
        index.prefix_length !== null ||
        index.expression !== null ||
        index.type !== 'BTREE' ||
        index.visible !== 'YES' ||
        index.direction !== 'A',
    )
  ) {
    throw new Error('Contact indexes differ from the reviewed schema.')
  }
  const [constraints] = await connection.execute(checksStatement, [tableName])
  if (
    constraints.length !== checks.length ||
    constraints.some(
      (constraint, index) =>
        constraint.name !== `chk_contact_messages_${checks[index]}` ||
        constraint.enforced !== 'YES' ||
        normalizedCheck(constraint.expression) !== `char_length(trim(${checks[index]}))>0`,
    )
  ) {
    throw new Error('Contact CHECK constraints differ from the reviewed schema.')
  }
  const [foreignKeys] = await connection.execute(foreignKeysStatement, [tableName])
  const [triggers] = await connection.execute(triggersStatement, [tableName])
  if (foreignKeys.length || triggers.length)
    throw new Error('Contact table has unreviewed foreign keys or triggers.')
}

export async function initializeAivenContactSchema({ databasePool, schemaSql } = {}) {
  let connection
  let result
  let failed = false
  try {
    const sql = reviewedStatement(
      schemaSql ??
        (await readFile(new URL('../../database/contact-schema.sql', import.meta.url), 'utf8')),
    )
    connection = await databasePool.getConnection()
    const stream = connection.connection?.stream
    if (stream?.encrypted !== true || stream.authorized !== true)
      throw new Error('Verified Aiven TLS is required.')
    let tables = await inspectTable(connection)
    let created = false
    if (!tables.length) {
      const [creation] = await connection.query(sql)
      created = creation.warningStatus === 0
      tables = await inspectTable(connection)
    }
    await validateTable(connection, tables)
    const [[count]] = await connection.execute(
      'SELECT CAST(COUNT(*) AS CHAR) AS total FROM contact_messages',
    )
    result = { created, schemaVerified: true, rowCount: count.total }
  } catch {
    failed = true
  } finally {
    try {
      connection?.release()
    } catch {
      failed = true
    }
  }
  if (failed)
    throw new Error(
      'Contact-only setup failed. Review the existing table schema, SSL settings, and setup privileges; no automatic repair or data migration was attempted.',
    )
  return result
}
