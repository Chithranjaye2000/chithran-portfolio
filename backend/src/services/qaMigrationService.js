import { readFile } from 'node:fs/promises'
import { getDatabasePool } from '../config/database.js'

const approvalColumns = ['summary_approved', 'source_reviewed', 'public_report_approved']

export const qaMigrationColumns = [
  'slug',
  'title',
  'category',
  'primary_tool',
  'context',
  'summary',
  'scope',
  'recorded_result',
  'technologies',
  'implementation',
  'limitations',
  'source_note',
  'report_url',
  'display_order',
  'is_published',
  ...approvalColumns,
]

const columnsStatement = `SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type, IS_NULLABLE AS nullable,
  COLUMN_DEFAULT AS default_value FROM information_schema.columns
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'qa_evidence'`
const constraintsStatement = `SELECT CONSTRAINT_NAME AS name FROM information_schema.table_constraints
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'qa_evidence' AND CONSTRAINT_TYPE = 'CHECK'`
const existingStatement = `SELECT ${qaMigrationColumns.join(', ')} FROM qa_evidence WHERE slug = ? LIMIT 1`
const insertStatement = `INSERT INTO qa_evidence (${qaMigrationColumns.join(', ')}) VALUES (${qaMigrationColumns.map(() => '?').join(', ')})`

function text(value, limit, optional = false) {
  if (optional && (value === null || value === undefined)) return null
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    [...value].length > limit ||
    value.includes('\0')
  ) {
    throw new Error('QA source data requires review before migration.')
  }
  return value
}

function textArray(value) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error('QA source data requires review before migration.')
  }
  return JSON.stringify(value)
}

function publicReportUrl(report) {
  if (!report.publicReportApproved || report.reportUrl === null || report.reportUrl === undefined) {
    return null
  }
  const value = text(report.reportUrl, 2048)
  if (report.sourceReviewed && /^\/documents\/qa-reports\/[a-z0-9-]+\.pdf$/.test(value)) {
    return value
  }
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && !url.username && !url.password) return value
  } catch {
    // Only an approved public HTTPS or reviewed public-document path may be imported.
  }
  throw new Error('QA report link requires public-sharing review.')
}

export function mapQaReportForMigration(report, displayOrder) {
  if (
    !report ||
    typeof report !== 'object' ||
    !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(report.id ?? '') ||
    report.summaryApproved !== true ||
    typeof report.sourceReviewed !== 'boolean' ||
    typeof report.publicReportApproved !== 'boolean'
  ) {
    throw new Error('QA source data requires public-sharing review before migration.')
  }
  return {
    slug: text(report.id, 120),
    title: text(report.title, 255),
    category: text(report.category, 80),
    primary_tool: text(report.primaryTool, 100),
    context: text(report.context, 255, true),
    summary: text(report.summary, 65_535),
    scope: text(report.scope, 65_535, true),
    recorded_result: text(report.result, 65_535, true),
    technologies: textArray(report.technologies),
    implementation: textArray(report.implementation),
    limitations: text(report.limitations, 65_535, true),
    source_note: text(report.sourceNote, 65_535, true),
    report_url: publicReportUrl(report),
    display_order: displayOrder,
    is_published: true,
    summary_approved: true,
    source_reviewed: report.sourceReviewed,
    public_report_approved: report.publicReportApproved,
  }
}

function migrationPlan(sql) {
  const statements = sql
    .replace(/^\s*--.*$/gm, '')
    .split(';')
    .map((statement) => statement.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
  const expected = approvalColumns.flatMap((column) => [
    {
      kind: 'column',
      name: column,
      statement: `ALTER TABLE qa_evidence ADD COLUMN ${column} BOOLEAN NOT NULL DEFAULT FALSE`,
    },
    {
      kind: 'constraint',
      name: `chk_qa_evidence_${column}`,
      statement: `ALTER TABLE qa_evidence ADD CONSTRAINT chk_qa_evidence_${column} CHECK (${column} IN (0, 1))`,
    },
  ])
  if (
    statements.length !== expected.length ||
    new Set(statements).size !== expected.length ||
    expected.some((step) => !statements.includes(step.statement))
  ) {
    throw new Error('QA approval migration requires review.')
  }
  return statements.map((statement) => expected.find((step) => step.statement === statement))
}

function compatibleApprovalColumn(column) {
  return (
    /^tinyint(?:\(1\))?$/.test(column.type) &&
    column.nullable === 'NO' &&
    String(column.default_value) === '0'
  )
}

async function ensureApprovalSchema(connection, sql) {
  const plan = migrationPlan(sql)
  const [columns] = await connection.query(columnsStatement)
  const available = new Map(columns.map((column) => [column.name, column]))
  const requiredBase = qaMigrationColumns.filter((column) => !approvalColumns.includes(column))
  if (!requiredBase.every((column) => available.has(column))) {
    throw new Error('QA schema requires initialization or review.')
  }
  for (const column of approvalColumns) {
    if (available.has(column) && !compatibleApprovalColumn(available.get(column))) {
      throw new Error('Existing QA approval column requires review.')
    }
  }
  const [indexes] = await connection.query('SHOW INDEX FROM qa_evidence')
  if (!indexes.some((index) => index.Column_name === 'slug' && index.Non_unique === 0)) {
    throw new Error('QA identifiers require a unique index.')
  }
  const [constraints] = await connection.query(constraintsStatement)
  const knownConstraints = new Set(constraints.map((constraint) => constraint.name))
  let changes = 0
  for (const step of plan) {
    const exists =
      step.kind === 'column' ? available.has(step.name) : knownConstraints.has(step.name)
    if (exists) continue
    await connection.query(step.statement)
    changes += 1
  }
  return changes
}

function sameRecord(existing, expected) {
  return qaMigrationColumns.every((column) => {
    if (['technologies', 'implementation'].includes(column)) {
      try {
        const value =
          typeof existing[column] === 'string' ? JSON.parse(existing[column]) : existing[column]
        return JSON.stringify(value) === expected[column]
      } catch {
        return false
      }
    }
    if (['is_published', ...approvalColumns].includes(column)) {
      return Number(existing[column]) === Number(expected[column])
    }
    return existing[column] === expected[column]
  })
}

export async function migrateQaEvidence(sourceReports, { databasePool, migrationSql } = {}) {
  if (!Array.isArray(sourceReports)) throw new Error('QA source data requires review.')
  const approved = sourceReports.filter((report) => report?.summaryApproved === true)
  const records = approved.map(mapQaReportForMigration)
  if (new Set(records.map((record) => record.slug)).size !== records.length) {
    throw new Error('QA source data contains duplicate identifiers.')
  }
  let connection
  let transactionStarted = false
  try {
    const sql =
      migrationSql ??
      (await readFile(
        new URL('../../database/migrations/005-qa-approval.sql', import.meta.url),
        'utf8',
      ))
    connection = await (databasePool ?? getDatabasePool()).getConnection()
    // MySQL DDL commits implicitly; all additive changes finish before the data transaction.
    const schemaChanges = await ensureApprovalSchema(connection, sql)
    await connection.beginTransaction()
    transactionStarted = true
    let inserted = 0
    const preservedSlugs = []
    const reviewSlugs = []
    function preserve(record, existing) {
      preservedSlugs.push(record.slug)
      if (!existing || !sameRecord(existing, record)) reviewSlugs.push(record.slug)
    }
    for (const record of records) {
      const [existing] = await connection.execute(existingStatement, [record.slug])
      if (existing.length) {
        preserve(record, existing[0])
        continue
      }
      try {
        const [result] = await connection.execute(
          insertStatement,
          qaMigrationColumns.map((column) => record[column]),
        )
        if (result.affectedRows !== 1) throw new Error('Unexpected insertion result.')
        inserted += 1
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') throw error
        // A locking read sees the row committed by a concurrent importer.
        const [latest] = await connection.execute(`${existingStatement} FOR UPDATE`, [record.slug])
        preserve(record, latest[0])
      }
    }
    await connection.commit()
    transactionStarted = false
    return {
      schemaChanges,
      inserted,
      preserved: preservedSlugs.length,
      skippedUnapproved: sourceReports.length - records.length,
      total: records.length,
      preservedSlugs,
      reviewSlugs,
    }
  } catch {
    if (transactionStarted) {
      try {
        await connection.rollback()
      } catch {
        // Preserve a safe diagnostic even if the failed connection cannot roll back explicitly.
      }
    }
    throw new Error(
      'QA migration failed. Check database configuration, schema privileges, and approvals.',
    )
  } finally {
    connection?.release()
  }
}
