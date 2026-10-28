import { getDatabasePool } from '../config/database.js'
import { ApiError } from '../middleware/apiError.js'
import {
  safeExternalUrl,
  safePublicImageUrl,
  stringArray,
} from '../validators/catalogueValidation.js'

const publicColumns = `CAST(id AS CHAR) AS api_id, slug, title, short_title, tagline,
  date_label, category, context, summary, overview, technologies, contributions,
  note, image_url, repository_url, demo_url, display_order`

export function projectToPublicDto(row) {
  return {
    id: row.api_id,
    slug: row.slug,
    number: String(Number(row.display_order) + 1).padStart(2, '0'),
    title: row.tagline ?? '',
    fullTitle: row.title,
    label: row.short_title ?? row.title,
    date: row.date_label ?? '',
    category: row.category,
    context: row.context ?? '',
    image: safePublicImageUrl(row.image_url),
    summary: row.summary,
    technologies: stringArray(row.technologies),
    overview: row.overview ?? '',
    contributions: stringArray(row.contributions),
    note: row.note ?? '',
    repositoryUrl: safeExternalUrl(row.repository_url),
    demoUrl: safeExternalUrl(row.demo_url),
  }
}

function databaseUnavailable() {
  return new ApiError(
    503,
    'DATABASE_UNAVAILABLE',
    'Projects could not be loaded right now. Please try again later.',
  )
}

export async function listProjects({ category, page, pageSize }, { databasePool } = {}) {
  try {
    const pool = databasePool ?? getDatabasePool()
    const where = category ? 'is_published = 1 AND category = ?' : 'is_published = 1'
    const bindings = category ? [category] : []
    const [[count]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM projects WHERE ${where}`,
      bindings,
    )
    const total = Number(count.total)
    if (!Number.isSafeInteger(total) || total < 0) throw new Error()
    const [rows] = await pool.execute(
      `SELECT ${publicColumns} FROM projects WHERE ${where} ORDER BY display_order, id LIMIT ? OFFSET ?`,
      [...bindings, String(pageSize), String((page - 1) * pageSize)],
    )
    return {
      data: rows.map(projectToPublicDto),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }
  } catch {
    throw databaseUnavailable()
  }
}

export async function getProjectById(id, { databasePool } = {}) {
  try {
    const [rows] = await (databasePool ?? getDatabasePool()).execute(
      `SELECT ${publicColumns} FROM projects WHERE id = ? AND is_published = 1 LIMIT 1`,
      [id],
    )
    return rows.length ? projectToPublicDto(rows[0]) : null
  } catch {
    throw databaseUnavailable()
  }
}
