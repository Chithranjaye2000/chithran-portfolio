import { projects } from '../../src/data/portfolio.js'
import { closeDatabasePool } from '../src/config/database.js'
import { migrateProjects } from '../src/services/projectMigrationService.js'

try {
  const result = await migrateProjects(projects)
  console.log(JSON.stringify({ projectMigration: 'complete', ...result }))
  if (result.preserved) {
    console.log('Existing rows were preserved, including their content and publication settings.')
  }
} catch {
  console.error(
    'Project migration failed. Check local database configuration, schema, and privileges.',
  )
  process.exitCode = 1
} finally {
  try {
    await closeDatabasePool()
  } catch {
    console.error('Database connection pool could not close cleanly.')
    process.exitCode = 1
  }
}
