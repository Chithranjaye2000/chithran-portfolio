import { qaReports } from '../../src/data/qaReports.js'
import { closeDatabasePool } from '../src/config/database.js'
import { migrateQaEvidence } from '../src/services/qaMigrationService.js'

try {
  const result = await migrateQaEvidence(qaReports)
  console.log(JSON.stringify({ qaMigration: 'complete', ...result }))
  if (result.reviewSlugs.length) {
    console.log('Existing differing or unpublished rows were preserved and require owner review.')
  }
} catch {
  console.error(
    'QA migration failed. Check local database configuration, schema, and public approvals.',
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
