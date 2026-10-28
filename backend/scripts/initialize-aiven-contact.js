import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { createDatabasePool } from '../src/config/database.js'
import { readDatabaseConfig } from '../src/config/environment.js'
import { initializeAivenContactSchema } from '../src/services/contactSchemaService.js'

let pool
try {
  const environment = parseEnv(readFileSync(new URL('../.env.aiven', import.meta.url), 'utf8'))
  if (environment.NODE_ENV !== 'production' || environment.DB_SSL_ENABLED !== 'true')
    throw new Error()
  if (['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].some((key) => !environment[key]))
    throw new Error()
  const configuration = readDatabaseConfig(environment)
  pool = createDatabasePool(configuration)
  const result = await initializeAivenContactSchema({ databasePool: pool })
  console.log(JSON.stringify({ contactSetup: 'complete', ...result }))
  console.log(
    'Only the Aiven contact_messages schema was prepared. No records were imported or changed.',
  )
} catch {
  console.error(
    'Aiven Contact setup failed. Check the private Aiven configuration, verified CA, existing Contact schema, and setup privileges. No automatic repair or data migration was attempted.',
  )
  process.exitCode = 1
} finally {
  try {
    await pool?.end()
  } catch {
    console.error('Aiven Contact setup pool could not close cleanly.')
    process.exitCode = 1
  }
}
