import { createDatabasePool } from '../config/database.js'
import { readDatabaseConfig } from '../config/environment.js'
import { verifyDatabaseConnection } from './databaseService.js'

function failure(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function connectionFailure(error) {
  const code = error?.code
  if (['ENOTFOUND', 'EAI_AGAIN'].includes(code)) {
    return failure(
      'AIVEN_DNS_ERROR',
      'Aiven DNS lookup failed. Check DB_HOST and your network DNS.',
    )
  }
  if (['ER_ACCESS_DENIED_ERROR', 'ER_DBACCESS_DENIED_ERROR'].includes(code)) {
    return failure(
      'AIVEN_AUTH_ERROR',
      'Aiven access was denied. Check the service user, password, and database permissions.',
    )
  }
  if (code === 'ER_BAD_DB_ERROR') {
    return failure(
      'AIVEN_DATABASE_ERROR',
      'The configured Aiven database was not found. Check DB_NAME; no database was created.',
    )
  }
  if (
    [
      'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
      'UNABLE_TO_GET_ISSUER_CERT',
      'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
      'SELF_SIGNED_CERT_IN_CHAIN',
      'DEPTH_ZERO_SELF_SIGNED_CERT',
      'CERT_HAS_EXPIRED',
      'CERT_NOT_YET_VALID',
      'ERR_TLS_CERT_ALTNAME_INVALID',
      'HANDSHAKE_SSL_ERROR',
      'HANDSHAKE_NO_SSL_SUPPORT',
    ].includes(code)
  ) {
    return failure(
      'AIVEN_CERTIFICATE_ERROR',
      'Aiven SSL verification failed. Check the current service CA, exact DNS hostname, and system clock. Keep verification enabled.',
    )
  }
  if (
    [
      'ETIMEDOUT',
      'ECONNREFUSED',
      'ENETUNREACH',
      'EHOSTUNREACH',
      'ECONNRESET',
      'PROTOCOL_CONNECTION_LOST',
    ].includes(code)
  ) {
    return failure(
      'AIVEN_NETWORK_ERROR',
      'Aiven could not be reached. Check the service status, DB_HOST/DB_PORT, network access rules, and local firewall.',
    )
  }
  return failure(
    'AIVEN_CONNECTION_ERROR',
    'Aiven connection failed. Check the service connection settings, CA, and network access; no private driver details are shown.',
  )
}

export async function checkAivenConnection(environment, { createPool = createDatabasePool } = {}) {
  if (environment.NODE_ENV !== 'production' || environment.DB_SSL_ENABLED !== 'true') {
    throw failure(
      'AIVEN_CONFIGURATION_ERROR',
      'The isolated Aiven check requires NODE_ENV=production and DB_SSL_ENABLED=true.',
    )
  }
  if (
    ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].some((key) => !environment[key])
  ) {
    throw failure(
      'AIVEN_CONFIGURATION_ERROR',
      'Aiven settings are incomplete. Fill DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD in backend/.env.aiven.',
    )
  }
  let configuration
  try {
    configuration = readDatabaseConfig(environment)
  } catch {
    throw failure(
      'AIVEN_CONFIGURATION_ERROR',
      'Aiven settings are invalid. Check database values and exactly one valid CA source (DB_SSL_CA or DB_SSL_CA_PATH).',
    )
  }

  let pool
  let connection
  let error
  try {
    pool = createPool(configuration)
    connection = await pool.getConnection()
    // mysql2 exposes the established TLSSocket on the underlying Promise connection.
    const stream = connection.connection?.stream
    if (stream?.encrypted !== true || stream.authorized !== true) {
      error = failure(
        'AIVEN_TLS_ERROR',
        'An encrypted, certificate-verified Aiven connection was not established. Keep SSL verification enabled.',
      )
    } else {
      try {
        await verifyDatabaseConnection(connection)
      } catch {
        error = failure(
          'AIVEN_QUERY_ERROR',
          'The Aiven SELECT 1 check failed. Check service availability and account access; no data was changed.',
        )
      }
    }
  } catch (cause) {
    error = connectionFailure(cause)
  } finally {
    try {
      connection?.release()
    } catch {
      error ??= failure(
        'AIVEN_CLEANUP_ERROR',
        'The Aiven connection could not be released cleanly.',
      )
    }
    try {
      await pool?.end()
    } catch {
      error ??= failure('AIVEN_CLEANUP_ERROR', 'The Aiven connection pool could not close cleanly.')
    }
  }
  if (error) throw error
  return { status: 'ok', tlsVerified: true }
}
