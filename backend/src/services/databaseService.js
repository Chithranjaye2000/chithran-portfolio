import { getDatabasePool } from '../config/database.js'

export async function verifyDatabaseConnection(databasePool) {
  try {
    const [rows] = await (databasePool ?? getDatabasePool()).execute('SELECT 1 AS connection_ok')
    if (rows[0]?.connection_ok !== 1) throw new Error()
    return { status: 'ok' }
  } catch {
    // Driver messages can contain hosts, usernames, SQL, and other private configuration.
    throw new Error(
      'Database connection check failed. Check your local MySQL settings and service.',
    )
  }
}
