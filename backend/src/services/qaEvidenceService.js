import { getDatabasePool } from '../config/database.js'
import { ApiError } from '../middleware/apiError.js'
import { safeExternalUrl, stringArray } from '../validators/catalogueValidation.js'

const publicColumns = `CAST(id AS CHAR) AS api_id, slug, title, category, primary_tool,
  context, summary, scope, recorded_result, technologies, implementation, limitations,
  source_note, report_url, summary_approved, source_reviewed, public_report_approved`

function approved(value) {
  return value === 1 || value === true
}

export function qaEvidenceToPublicDto(row) {
  const publicReportApproved = approved(row.public_report_approved)
  return {
    id: row.api_id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    primaryTool: row.primary_tool,
    technologies: stringArray(row.technologies),
    context: row.context ?? '',
    summary: row.summary,
    scope: row.scope ?? '',
    result: row.recorded_result ?? '',
    implementation: stringArray(row.implementation),
    limitations: row.limitations ?? '',
    sourceNote: row.source_note ?? '',
    summaryApproved: approved(row.summary_approved),
    sourceReviewed: approved(row.source_reviewed),
    publicReportApproved,
    // Current reports have approved HTTPS links. Private/local source paths never leave the API.
    reportUrl: publicReportApproved ? safeExternalUrl(row.report_url) : null,
    reportOnly: false,
  }
}

function databaseUnavailable() {
  return new ApiError(
    503,
    'DATABASE_UNAVAILABLE',
    'QA evidence could not be loaded right now. Please try again later.',
  )
}

function publicFilter({ category, tool, context }) {
  const clauses = ['is_published = 1', 'summary_approved = 1']
  const bindings = []
  if (category) {
    clauses.push('category = ?')
    bindings.push(category)
  }
  if (tool) {
    clauses.push('primary_tool = ?')
    bindings.push(tool)
  }
  if (context) {
    clauses.push('context = ?')
    bindings.push(context)
  }
  return { where: clauses.join(' AND '), bindings }
}

export async function listQaEvidence(query, { databasePool } = {}) {
  try {
    const pool = databasePool ?? getDatabasePool()
    const { where, bindings } = publicFilter(query)
    const [[count]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM qa_evidence WHERE ${where}`,
      bindings,
    )
    const total = Number(count.total)
    if (!Number.isSafeInteger(total) || total < 0) throw new Error()
    const { page, pageSize } = query
    const [rows] = await pool.execute(
      `SELECT ${publicColumns} FROM qa_evidence WHERE ${where} ORDER BY display_order, id LIMIT ? OFFSET ?`,
      [...bindings, String(pageSize), String((page - 1) * pageSize)],
    )
    return {
      data: rows.map(qaEvidenceToPublicDto),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }
  } catch {
    throw databaseUnavailable()
  }
}

export async function getQaEvidenceById(id, { databasePool } = {}) {
  try {
    const [rows] = await (databasePool ?? getDatabasePool()).execute(
      `SELECT ${publicColumns} FROM qa_evidence WHERE id = ? AND is_published = 1 AND summary_approved = 1 LIMIT 1`,
      [id],
    )
    return rows.length ? qaEvidenceToPublicDto(rows[0]) : null
  } catch {
    throw databaseUnavailable()
  }
}
