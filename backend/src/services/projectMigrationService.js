import { getDatabasePool } from '../config/database.js'

export const projectMigrationColumns = [
  'slug',
  'title',
  'short_title',
  'tagline',
  'date_label',
  'category',
  'context',
  'summary',
  'overview',
  'technologies',
  'contributions',
  'note',
  'image_url',
  'repository_url',
  'demo_url',
  'display_order',
  'is_published',
]

const insertStatement = `INSERT INTO projects (${projectMigrationColumns.join(', ')}) VALUES (${projectMigrationColumns.map(() => '?').join(', ')})`

function text(value, limit, optional = false) {
  if (optional && (value === null || value === undefined)) return null
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    [...value].length > limit ||
    value.includes('\0')
  ) {
    throw new Error('Project source data requires review before migration.')
  }
  return value
}

function textArray(value) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error('Project source data requires review before migration.')
  }
  return JSON.stringify(value)
}

export function mapProjectForMigration(project, displayOrder) {
  if (
    !project ||
    typeof project !== 'object' ||
    !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(project.id ?? '') ||
    project.number !== String(displayOrder + 1).padStart(2, '0')
  ) {
    throw new Error('Project source data requires review before migration.')
  }
  return {
    slug: text(project.id, 120),
    title: text(project.fullTitle, 255),
    short_title: text(project.label, 120),
    tagline: text(project.title, 255),
    date_label: text(project.date, 80),
    category: text(project.category, 80),
    context: text(project.context, 255),
    summary: text(project.summary, 65_535),
    overview: text(project.overview, 65_535, true),
    technologies: textArray(project.technologies),
    contributions: textArray(project.contributions),
    note: text(project.note, 65_535, true),
    image_url: text(project.image, 2048),
    repository_url: text(project.repositoryUrl, 2048, true),
    demo_url: text(project.demoUrl, 2048, true),
    display_order: displayOrder,
    is_published: true,
  }
}

export async function migrateProjects(sourceProjects, { databasePool } = {}) {
  if (!Array.isArray(sourceProjects)) {
    throw new Error('Project source data requires review before migration.')
  }
  const records = sourceProjects.map(mapProjectForMigration)
  if (new Set(records.map((record) => record.slug)).size !== records.length) {
    throw new Error('Project source data contains duplicate identifiers.')
  }
  let connection
  let transactionStarted = false
  try {
    connection = await (databasePool ?? getDatabasePool()).getConnection()
    const [columns] = await connection.query('SHOW COLUMNS FROM projects')
    const available = new Set(columns.map((column) => column.Field))
    const [indexes] = await connection.query('SHOW INDEX FROM projects')
    const hasUniqueSlug = indexes.some(
      (index) => index.Column_name === 'slug' && index.Non_unique === 0,
    )
    if (!projectMigrationColumns.every((column) => available.has(column)) || !hasUniqueSlug) {
      throw new Error('Project schema requires review.')
    }

    await connection.beginTransaction()
    transactionStarted = true
    let inserted = 0
    const preservedSlugs = []
    for (const record of records) {
      const [existing] = await connection.execute(
        'SELECT id FROM projects WHERE slug = ? LIMIT 1',
        [record.slug],
      )
      if (existing.length) {
        preservedSlugs.push(record.slug)
        continue
      }
      try {
        const [result] = await connection.execute(
          insertStatement,
          projectMigrationColumns.map((column) => record[column]),
        )
        if (result.affectedRows !== 1) throw new Error('Unexpected insertion result.')
        inserted += 1
      } catch (error) {
        // A concurrent import may insert this unique slug after the preceding read.
        if (error.code === 'ER_DUP_ENTRY') preservedSlugs.push(record.slug)
        else throw error
      }
    }
    await connection.commit()
    transactionStarted = false
    return {
      inserted,
      preserved: preservedSlugs.length,
      total: records.length,
      preservedSlugs,
    }
  } catch {
    if (transactionStarted) {
      try {
        await connection.rollback()
      } catch {
        // The command reports a safe failure without exposing either driver error.
      }
    }
    throw new Error('Project migration failed. Check database configuration and schema privileges.')
  } finally {
    connection?.release()
  }
}
