import test from 'node:test'
import assert from 'node:assert/strict'
import { projects } from '../../src/data/portfolio.js'
import {
  mapProjectForMigration,
  migrateProjects,
  projectMigrationColumns,
} from '../src/services/projectMigrationService.js'

function migrationDatabase({
  existing = [],
  failAt,
  duplicateAt,
  columns = projectMigrationColumns,
} = {}) {
  const calls = []
  const inserted = []
  const connection = {
    async query(statement) {
      calls.push(statement)
      return statement === 'SHOW COLUMNS FROM projects'
        ? [columns.map((Field) => ({ Field }))]
        : [[{ Column_name: 'slug', Non_unique: 0 }]]
    },
    async beginTransaction() {
      calls.push('begin')
    },
    async execute(statement, values) {
      calls.push({ statement, values })
      if (statement.startsWith('SELECT')) return [existing.includes(values[0]) ? [{ id: 99 }] : []]
      if (values[0] === failAt) throw new Error('fake-password mysql://private-user@private-host')
      if (values[0] === duplicateAt) {
        const error = new Error('private duplicate-key details')
        error.code = 'ER_DUP_ENTRY'
        throw error
      }
      inserted.push(values)
      return [{ affectedRows: 1 }]
    },
    async commit() {
      calls.push('commit')
    },
    async rollback() {
      calls.push('rollback')
    },
    release() {
      calls.push('release')
    },
  }
  return { calls, inserted, pool: { getConnection: async () => connection } }
}

test('source mapping preserves every original project field, including notes, arrays, and asset paths', () => {
  for (const [index, source] of projects.entries()) {
    const record = mapProjectForMigration(source, index)
    assert.equal(record.slug, source.id)
    assert.equal(record.title, source.fullTitle)
    assert.equal(record.short_title, source.label)
    assert.equal(record.tagline, source.title)
    assert.equal(record.date_label, source.date)
    assert.equal(record.category, source.category)
    assert.equal(record.context, source.context)
    assert.equal(record.summary, source.summary)
    assert.equal(record.overview, source.overview)
    assert.equal(record.note, source.note)
    assert.equal(record.image_url, source.image)
    assert.equal(record.repository_url, source.repositoryUrl)
    assert.equal(record.demo_url, source.demoUrl)
    assert.deepEqual(JSON.parse(record.technologies), source.technologies)
    assert.deepEqual(JSON.parse(record.contributions), source.contributions)
    assert.equal(String(record.display_order + 1).padStart(2, '0'), source.number)
    assert.equal(record.is_published, true)
  }
})

test('all source projects are inserted through parameterized SQL in one transaction', async () => {
  const database = migrationDatabase()
  const result = await migrateProjects(projects, { databasePool: database.pool })
  assert.deepEqual(result, { inserted: 4, preserved: 0, total: 4, preservedSlugs: [] })
  assert.equal(database.inserted.length, 4)
  assert.equal(database.calls.filter((call) => call === 'begin').length, 1)
  assert.deepEqual(database.calls.slice(-2), ['commit', 'release'])
  for (const call of database.calls.filter((call) => call.statement?.startsWith('INSERT'))) {
    assert.equal((call.statement.match(/\?/g) ?? []).length, projectMigrationColumns.length)
    assert.equal(call.statement.includes(projects[0].summary), false)
  }
})

test('existing project rows are not updated or republished on a repeated import', async () => {
  const existing = projects.map((project) => project.id)
  const database = migrationDatabase({ existing })
  const result = await migrateProjects(projects, { databasePool: database.pool })
  assert.deepEqual(result, { inserted: 0, preserved: 4, total: 4, preservedSlugs: existing })
  assert.equal(database.inserted.length, 0)
  assert.ok(database.calls.every((call) => !call.statement?.startsWith('UPDATE')))
})

test('concurrent unique-slug insertion is preserved without a destructive update', async () => {
  const database = migrationDatabase({ duplicateAt: 'quickjob' })
  const result = await migrateProjects(projects, { databasePool: database.pool })
  assert.equal(result.inserted, 3)
  assert.deepEqual(result.preservedSlugs, ['quickjob'])
  assert.deepEqual(database.calls.slice(-2), ['commit', 'release'])
})

test('a failed multi-record migration rolls back and does not expose private driver details', async () => {
  const database = migrationDatabase({ failAt: 'quickjob' })
  await assert.rejects(migrateProjects(projects, { databasePool: database.pool }), (error) => {
    assert.equal(error.message.includes('fake-password'), false)
    assert.equal(error.message.includes('private-user'), false)
    assert.equal(error.cause, undefined)
    return /Project migration failed/.test(error.message)
  })
  assert.equal(database.calls.includes('commit'), false)
  assert.deepEqual(database.calls.slice(-2), ['rollback', 'release'])
})

test('incompatible schemas are rejected before any transaction writes', async () => {
  const database = migrationDatabase({ columns: ['id', 'slug', 'title'] })
  await assert.rejects(
    migrateProjects(projects, { databasePool: database.pool }),
    /Project migration failed/,
  )
  assert.equal(database.calls.includes('begin'), false)
  assert.equal(database.inserted.length, 0)
  assert.equal(database.calls.at(-1), 'release')
})

test('duplicate or inconsistent source identities are rejected before accessing the database', async () => {
  let accessed = false
  const databasePool = {
    getConnection: async () => {
      accessed = true
    },
  }
  await assert.rejects(
    migrateProjects([projects[0], { ...projects[0], number: '02' }], { databasePool }),
    /duplicate identifiers/,
  )
  await assert.rejects(
    migrateProjects([{ ...projects[0], number: '99' }], { databasePool }),
    /source data requires review/,
  )
  assert.equal(accessed, false)
})
