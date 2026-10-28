import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { readDatabaseConfig } from './environment.js'
import { createDatabasePool } from './database.js'

let contactPool
const settings = [
  'HOST',
  'PORT',
  'NAME',
  'USER',
  'PASSWORD',
  'SSL_ENABLED',
  'SSL_CA',
  'SSL_CA_PATH',
]

export function readContactDatabaseConfig(
  environment = process.env,
  { readAivenFile = () => readFileSync(new URL('../../.env.aiven', import.meta.url), 'utf8') } = {},
) {
  try {
    const useProductionSettings =
      environment.NODE_ENV === 'production' ||
      settings.some((key) => environment[`CONTACT_DB_${key}`]?.trim())
    const source = useProductionSettings
      ? {
          NODE_ENV: 'production',
          ...Object.fromEntries(
            settings.map((key) => [`DB_${key}`, environment[`CONTACT_DB_${key}`]]),
          ),
        }
      : parseEnv(readAivenFile())
    if (
      source.NODE_ENV !== 'production' ||
      source.DB_SSL_ENABLED !== 'true' ||
      ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].some((key) => !source[key])
    ) {
      throw new Error()
    }
    // Explicit configuration only: Contact never falls back to the catalogue/local pool.
    return readDatabaseConfig(source)
  } catch {
    throw new Error(
      'Contact database configuration is unavailable. Check the isolated Aiven settings.',
    )
  }
}

export function createContactDatabasePool(
  environment = process.env,
  { createPool = createDatabasePool, ...configurationDependencies } = {},
) {
  return createPool(readContactDatabaseConfig(environment, configurationDependencies))
}

export function getContactDatabasePool() {
  contactPool ??= createContactDatabasePool()
  return contactPool
}

export async function closeContactDatabasePool() {
  const current = contactPool
  contactPool = undefined
  if (current) await current.end()
}
