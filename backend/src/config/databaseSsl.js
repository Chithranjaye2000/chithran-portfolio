import { X509Certificate } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { isIP } from 'node:net'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const backendDirectory = fileURLToPath(new URL('../../', import.meta.url))

function optionalSetting(environment, name) {
  const value = environment[name]
  if (value === undefined) return ''
  if (typeof value !== 'string') throw new Error(`Invalid backend setting: ${name}.`)
  return value.trim()
}

function certificateBundle(value) {
  const pem = value.replace(/\\n/g, '\n').replace(/\r\n?/g, '\n').trim()
  const certificates = pem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g)
  try {
    if (
      !certificates?.length ||
      Buffer.byteLength(pem, 'utf8') > 131_072 ||
      pem.replace(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g, '').trim()
    ) {
      throw new Error()
    }
    for (const certificate of certificates) {
      if (!new X509Certificate(certificate).ca) throw new Error()
    }
  } catch {
    // Never include certificate contents, filesystem paths, or OpenSSL errors.
    throw new Error('Invalid database CA certificate. Provide a PEM CA certificate bundle.')
  }
  return pem
}

export function readDatabaseSslConfig(environment, host) {
  const production = environment.NODE_ENV === 'production'
  const flag = environment.DB_SSL_ENABLED
  if (flag !== undefined && flag !== 'true' && flag !== 'false') {
    throw new Error('Invalid backend setting: DB_SSL_ENABLED. Use true or false.')
  }
  const enabled = flag === undefined ? production : flag === 'true'
  const inlineCa = optionalSetting(environment, 'DB_SSL_CA')
  const caPath = optionalSetting(environment, 'DB_SSL_CA_PATH')
  if (production && !enabled) throw new Error('Database SSL is required in production.')
  if (!enabled) {
    if (inlineCa || caPath) throw new Error('Database CA settings require DB_SSL_ENABLED=true.')
    return undefined
  }
  // mysql2 skips its hostname check for IP hosts; require a DNS name for verified TLS.
  if (
    isIP(host) ||
    host.length > 253 ||
    !host.split('.').every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))
  ) {
    throw new Error('Invalid backend setting: DB_HOST. SSL requires a DNS hostname.')
  }
  if (Boolean(inlineCa) === Boolean(caPath)) {
    throw new Error('Database SSL requires exactly one of DB_SSL_CA or DB_SSL_CA_PATH.')
  }
  let ca = inlineCa
  if (caPath) {
    try {
      ca = readFileSync(resolve(backendDirectory, caPath), 'utf8')
    } catch {
      throw new Error('Unable to read the database CA certificate. Check DB_SSL_CA_PATH.')
    }
  }
  return {
    ca: certificateBundle(ca),
    rejectUnauthorized: true,
    verifyIdentity: true,
    minVersion: 'TLSv1.2',
  }
}
