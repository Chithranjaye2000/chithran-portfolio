import { readFile } from 'node:fs/promises'
import { closeDatabasePool, getDatabasePool } from '../src/config/database.js'

const requiredTables = ['contact_messages', 'projects', 'qa_evidence']

try {
  const source = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8')
  // This reviewed initialization file contains no routines or embedded statement separators.
  const statements = source
    .replace(/^\s*--.*$/gm, '')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
  if (
    statements.length !== 4 ||
    statements[0] !== 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci' ||
    !requiredTables.every((table, index) =>
      statements[index + 1].startsWith(`CREATE TABLE IF NOT EXISTS ${table} (`),
    )
  ) {
    throw new Error('Initialization script requires review.')
  }

  const connection = await getDatabasePool().getConnection()
  try {
    const [existing] = await connection.query('SHOW TABLES')
    console.log(`Existing database tables inspected: ${existing.length}.`)
    for (const statement of statements) await connection.query(statement)
    const metadata = []
    for (const table of requiredTables) {
      const [columns] = await connection.query(`SHOW COLUMNS FROM ${table}`)
      metadata.push({ table, columns: columns.map((column) => column.Field) })
    }
    console.log(JSON.stringify({ schemaReady: true, tables: metadata }))
    console.log('Initialization completed. Existing tables and records were preserved.')
  } finally {
    connection.release()
  }
} catch {
  console.error('Database initialization failed. Check local configuration and schema privileges.')
  process.exitCode = 1
} finally {
  try {
    await closeDatabasePool()
  } catch {
    console.error('Database connection pool could not close cleanly.')
    process.exitCode = 1
  }
}
