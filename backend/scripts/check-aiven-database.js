import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { checkAivenConnection } from '../src/services/aivenConnectionCheck.js'

let environment
try {
  // Parse an explicit object: never merge local .env or inherited DB_* values.
  environment = parseEnv(readFileSync(new URL('../.env.aiven', import.meta.url), 'utf8'))
} catch {
  console.error(
    'Aiven check not run: create a readable, Git-ignored backend/.env.aiven file using the README instructions.',
  )
  process.exitCode = 1
}
if (environment) {
  try {
    await checkAivenConnection(environment)
    console.log(
      'Aiven MySQL SSL verified: encrypted and authorized TLS; SELECT 1 succeeded. No data was changed.',
    )
  } catch (error) {
    // The service returns only fixed, sanitized messages; never log the error object.
    console.error(error.message)
    process.exitCode = 1
  }
}
