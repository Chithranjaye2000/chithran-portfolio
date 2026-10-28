import { closeDatabasePool } from '../src/config/database.js'
import { verifyDatabaseConnection } from '../src/services/databaseService.js'

try {
  await verifyDatabaseConnection()
  console.log('MySQL connection verified: SELECT 1 succeeded.')
} catch {
  console.error(
    'MySQL connection check failed. Check backend database/SSL settings and service availability.',
  )
  process.exitCode = 1
} finally {
  try {
    await closeDatabasePool()
  } catch {
    console.error('MySQL connection pool could not close cleanly.')
    process.exitCode = 1
  }
}
