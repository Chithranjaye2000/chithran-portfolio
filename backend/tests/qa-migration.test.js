import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { qaReports } from '../../src/data/qaReports.js'
import {
  mapQaReportForMigration,
  migrateQaEvidence,
  qaMigrationColumns,
} from '../src/services/qaMigrationService.js'

const migrationSql = readFileSync(
  new URL('../database/migrations/005-qa-approval.sql', import.meta.url),
  'utf8',
)
const flags = ['summary_approved', 'source_reviewed', 'public_report_approved']
const baseColumns = qaMigrationColumns.filter((column) => !flags.includes(column))
const fullColumns = qaMigrationColumns.map((name) => ({
  name,
  type: flags.includes(name) ? 'tinyint(1)' : 'text',
  nullable: flags.includes(name) ? 'NO' : 'YES',
  default_value: flags.includes(name) ? '0' : null,
}))

function migrationDatabase({
  existing = [],
  schemaComplete = false,
  partial = false,
  failAt,
  duplicateAt,
  incompatible = false,
} = {}) {
  const calls = []
  const inserted = []
  const columns = fullColumns.filter((column) =>
    schemaComplete
      ? true
      : baseColumns.includes(column.name) || (partial && column.name === 'summary_approved'),
  )
  if (incompatible)
    columns.splice(
      columns.findIndex((column) => column.name === 'recorded_result'),
      1,
    )
  const constraints = new Set(
    schemaComplete
      ? flags.map((column) => `chk_qa_evidence_${column}`)
      : partial
        ? ['chk_qa_evidence_summary_approved']
        : [],
  )
  const records = new Map(existing.map((record) => [record.slug, record]))
  const connection = {
    async query(statement) {
      calls.push(statement)
      if (statement.includes('information_schema.columns')) return [columns]
      if (statement.includes('information_schema.table_constraints')) {
        return [[...constraints].map((name) => ({ name }))]
      }
      if (statement === 'SHOW INDEX FROM qa_evidence')
        return [[{ Column_name: 'slug', Non_unique: 0 }]]
      return [{ affectedRows: 0 }]
    },
    async beginTransaction() {
      calls.push('begin')
    },
    async execute(statement, parameters) {
      calls.push({ statement, parameters })
      if (statement.startsWith('SELECT')) {
        const record = records.get(parameters[0])
        return [record ? [record] : []]
      }
      const slug = parameters[0]
      if (slug === failAt)
        throw new Error('fake-password mysql://private-user@private-db/private-schema')
      if (slug === duplicateAt) {
        records.set(
          slug,
          mapQaReportForMigration(
            qaReports.find((report) => report.id === slug),
            qaReports.findIndex((report) => report.id === slug),
          ),
        )
        const error = new Error('private unique-key details')
        error.code = 'ER_DUP_ENTRY'
        throw error
      }
      inserted.push(parameters)
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

function migrate(database, reports = qaReports, options = {}) {
  return migrateQaEvidence(reports, { databasePool: database.pool, migrationSql, ...options })
}

test('QA mapping preserves all approved descriptions, evidence, links, and distinct review states', () => {
  for (const [index, source] of qaReports.entries()) {
    const record = mapQaReportForMigration(source, index)
    assert.equal(record.slug, source.id)
    assert.equal(record.title, source.title)
    assert.equal(record.category, source.category)
    assert.equal(record.primary_tool, source.primaryTool)
    assert.equal(record.context, source.context)
    assert.equal(record.summary, source.summary)
    assert.equal(record.scope, source.scope)
    assert.equal(record.recorded_result, source.result)
    assert.equal(record.limitations, source.limitations)
    assert.equal(record.source_note, source.sourceNote)
    assert.equal(record.report_url, source.reportUrl)
    assert.deepEqual(JSON.parse(record.technologies), source.technologies)
    assert.deepEqual(JSON.parse(record.implementation), source.implementation)
    assert.equal(record.source_reviewed, index >= 7)
    assert.equal(record.summary_approved, true)
    assert.equal(record.public_report_approved, true)
    assert.equal(record.is_published, true)
    assert.equal(record.display_order, index)
  }
})

test('additive schema statements finish before the one parameterized data transaction', async () => {
  const database = migrationDatabase()
  const result = await migrate(database)
  assert.equal(result.schemaChanges, 6)
  assert.equal(result.inserted, 9)
  assert.equal(result.preserved, 0)
  const ddl = database.calls.filter(
    (call) => typeof call === 'string' && call.startsWith('ALTER TABLE'),
  )
  assert.equal(ddl.length, 6)
  assert.ok(
    ddl.every((statement) => database.calls.indexOf(statement) < database.calls.indexOf('begin')),
  )
  assert.equal(database.inserted.length, 9)
  assert.deepEqual(database.calls.slice(-2), ['commit', 'release'])
  for (const call of database.calls.filter((call) => call.statement?.startsWith('INSERT'))) {
    assert.equal((call.statement.match(/\?/g) ?? []).length, qaMigrationColumns.length)
    assert.equal(call.statement.includes(qaReports[0].summary), false)
  }
})

test('a partially applied approval migration adds only its missing columns and constraints', async () => {
  const database = migrationDatabase({ partial: true })
  const result = await migrate(database)
  assert.equal(result.schemaChanges, 4)
  const ddl = database.calls.filter(
    (call) => typeof call === 'string' && call.startsWith('ALTER TABLE'),
  )
  assert.ok(ddl.every((statement) => !statement.includes('summary_approved')))
})

test('repeated imports preserve identical rows and do not repeat completed DDL', async () => {
  const database = migrationDatabase({
    existing: qaReports.map(mapQaReportForMigration),
    schemaComplete: true,
  })
  const result = await migrate(database)
  assert.equal(result.schemaChanges, 0)
  assert.equal(result.inserted, 0)
  assert.equal(result.preserved, 9)
  assert.deepEqual(result.reviewSlugs, [])
  assert.equal(database.inserted.length, 0)
  assert.ok(
    database.calls.every((call) => typeof call !== 'string' || !call.startsWith('ALTER TABLE')),
  )
})

test('existing drafts, unapproved rows, and edited content require review instead of being overwritten', async () => {
  const first = {
    ...mapQaReportForMigration(qaReports[0], 0),
    is_published: false,
    summary_approved: false,
  }
  const second = {
    ...mapQaReportForMigration(qaReports[1], 1),
    summary: 'An existing owner-edited summary.',
  }
  const database = migrationDatabase({ existing: [first, second], schemaComplete: true })
  const result = await migrate(database)
  assert.equal(result.inserted, 7)
  assert.deepEqual(result.reviewSlugs, [qaReports[0].id, qaReports[1].id])
  assert.ok(database.calls.every((call) => !call.statement?.startsWith('UPDATE')))
})

test('unapproved summaries are excluded and unapproved report URLs are not imported', async () => {
  const reports = [
    { ...qaReports[0], summaryApproved: false },
    { ...qaReports[1], publicReportApproved: false, reportUrl: 'file:///private/report.pdf' },
  ]
  const database = migrationDatabase()
  const result = await migrate(database, reports)
  assert.equal(result.skippedUnapproved, 1)
  assert.equal(result.inserted, 1)
  const values = database.inserted[0]
  assert.equal(values[qaMigrationColumns.indexOf('report_url')], null)
  assert.equal(values[qaMigrationColumns.indexOf('public_report_approved')], false)
})

test('concurrent unique-slug conflicts preserve the latest existing row without overwriting it', async () => {
  const database = migrationDatabase({ duplicateAt: qaReports[0].id })
  const result = await migrate(database)
  assert.equal(result.inserted, 8)
  assert.equal(result.preserved, 1)
  assert.deepEqual(result.reviewSlugs, [])
  assert.ok(database.calls.some((call) => call.statement?.endsWith('FOR UPDATE')))
})

test('data failures roll back without exposing private errors, while completed DDL stays separate', async () => {
  const database = migrationDatabase({ failAt: qaReports[1].id })
  await assert.rejects(migrate(database), (error) => {
    assert.equal(error.message.includes('fake-password'), false)
    assert.equal(error.message.includes('private-user'), false)
    assert.equal(error.cause, undefined)
    return /QA migration failed/.test(error.message)
  })
  assert.equal(database.calls.includes('commit'), false)
  assert.deepEqual(database.calls.slice(-2), ['rollback', 'release'])
})

test('missing base schema and unexpected migration SQL are rejected before DDL or data writes', async () => {
  const incompatible = migrationDatabase({ incompatible: true })
  await assert.rejects(migrate(incompatible), /QA migration failed/)
  assert.equal(incompatible.calls.includes('begin'), false)
  assert.ok(
    incompatible.calls.every((call) => typeof call !== 'string' || !call.startsWith('ALTER TABLE')),
  )
  const unsafe = migrationDatabase()
  await assert.rejects(
    migrate(unsafe, qaReports, { migrationSql: `${migrationSql}\nDROP TABLE qa_evidence;` }),
    /QA migration failed/,
  )
  assert.deepEqual(unsafe.calls, ['release'])
})

test('private report paths and inconsistent source identifiers fail before accessing the database', async () => {
  let accessed = false
  const databasePool = {
    getConnection: async () => {
      accessed = true
    },
  }
  await assert.rejects(
    migrateQaEvidence([{ ...qaReports[0], reportUrl: 'C:/private/report.pdf' }], { databasePool }),
    /report link requires public-sharing review/,
  )
  await assert.rejects(
    migrateQaEvidence([qaReports[0], qaReports[0]], { databasePool }),
    /duplicate identifiers/,
  )
  assert.equal(accessed, false)
})
