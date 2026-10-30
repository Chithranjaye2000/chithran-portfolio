import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import { isIP } from 'node:net'
import { readDatabaseSslConfig } from './databaseSsl.js'

// Resolve against this module, so starting from the repository root cannot load frontend env files.
try {
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)))
} catch (error) {
  if (error.code !== 'ENOENT') throw new Error('Unable to load backend environment configuration.')
}

function requiredText(environment, name) {
  const value = environment[name]?.trim()
  if (!value) throw new Error(`Missing required backend setting: ${name}.`)
  return value
}

function portNumber(value, name, fallback) {
  const text = value ?? String(fallback)
  if (!/^\d+$/.test(text) || Number(text) < 1 || Number(text) > 65535) {
    throw new Error(`Invalid backend setting: ${name}.`)
  }
  return Number(text)
}

function vercelOrigins(environment, frontendOrigin) {
  if (environment.VERCEL !== '1') return []
  const origins = new Set()
  for (const name of ['VERCEL_URL', 'VERCEL_BRANCH_URL']) {
    const host = environment[name]
    if (host === undefined) continue
    if (
      typeof host !== 'string' ||
      !host ||
      host.length > 253 ||
      isIP(host) ||
      !host.split('.').every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))
    ) {
      throw new Error(`Invalid backend setting: ${name}.`)
    }
    const origin = `https://${host.toLowerCase()}`
    if (origin !== frontendOrigin) origins.add(origin)
  }
  return [...origins]
}

export function readApiConfig(environment = process.env) {
  const frontendOrigin = environment.FRONTEND_ORIGIN ?? 'http://127.0.0.1:5173'
  let origin
  try {
    const url = new URL(frontendOrigin)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error()
    }
    origin = url.origin
  } catch {
    throw new Error('FRONTEND_ORIGIN must be a single HTTP or HTTPS origin.')
  }

  const additionalOrigins = vercelOrigins(environment, origin)
  return {
    port: portNumber(environment.PORT, 'PORT', 3001),
    frontendOrigin: origin,
    ...(additionalOrigins.length ? { additionalOrigins } : {}),
  }
}

export function readDatabaseConfig(environment = process.env) {
  const database = requiredText(environment, 'DB_NAME')
  if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error('Invalid backend setting: DB_NAME.')
  if (typeof environment.DB_PASSWORD !== 'string' || !environment.DB_PASSWORD.length) {
    throw new Error('Missing required backend setting: DB_PASSWORD.')
  }
  const host = requiredText(environment, 'DB_HOST')
  const ssl = readDatabaseSslConfig(environment, host)
  return {
    host,
    port: portNumber(environment.DB_PORT, 'DB_PORT', 3306),
    database,
    user: requiredText(environment, 'DB_USER'),
    password: environment.DB_PASSWORD,
    ...(ssl ? { ssl } : {}),
  }
}
