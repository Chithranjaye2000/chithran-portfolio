import test from 'node:test'
import assert from 'node:assert/strict'
import { rootCertificates } from 'node:tls'
import { checkAivenConnection } from '../src/services/aivenConnectionCheck.js'

const environment = {
  NODE_ENV: 'production',
  DB_SSL_ENABLED: 'true',
  DB_HOST: 'mysql.example.test',
  DB_PORT: '12345',
  DB_NAME: 'unit_test_database',
  DB_USER: 'unit_test_user',
  DB_PASSWORD: 'fake-aiven-unit-password',
  DB_SSL_CA: rootCertificates[0],
}
const privateDetails = 'mysql://private-user:private-password@private-host/db CERTIFICATE-CONTENTS'

function mockedPool({
  stream = { encrypted: true, authorized: true },
  acquireError,
  queryError,
  releaseError,
  endError,
} = {}) {
  const events = []
  let receivedConfiguration
  const connection = {
    connection: { stream },
    async execute(statement) {
      events.push(statement)
      if (queryError) throw queryError
      return [[{ connection_ok: 1 }], []]
    },
    release() {
      events.push('release')
      if (releaseError) throw releaseError
    },
  }
  return {
    events,
    get configuration() {
      return receivedConfiguration
    },
    createPool(configuration) {
      receivedConfiguration = configuration
      events.push('create')
      return {
        async getConnection() {
          events.push('acquire')
          if (acquireError) throw acquireError
          return connection
        },
        async end() {
          events.push('end')
          if (endError) throw endError
        },
      }
    },
  }
}

test('the isolated check verifies TLS, runs only the existing SELECT 1, releases and closes', async () => {
  const mock = mockedPool()
  assert.deepEqual(await checkAivenConnection(environment, mock), {
    status: 'ok',
    tlsVerified: true,
  })
  assert.deepEqual(mock.events, [
    'create',
    'acquire',
    'SELECT 1 AS connection_ok',
    'release',
    'end',
  ])
  assert.equal(mock.configuration.host, environment.DB_HOST)
  assert.equal(mock.configuration.port, 12345)
  assert.equal(mock.configuration.ssl.rejectUnauthorized, true)
  assert.equal(mock.configuration.ssl.verifyIdentity, true)
})

test('local/non-SSL settings are rejected before creating a pool', async () => {
  for (const settings of [
    { NODE_ENV: 'development' },
    { DB_SSL_ENABLED: 'false' },
    { DB_SSL_ENABLED: undefined },
  ]) {
    const mock = mockedPool()
    await assert.rejects(checkAivenConnection({ ...environment, ...settings }, mock), {
      code: 'AIVEN_CONFIGURATION_ERROR',
    })
    assert.deepEqual(mock.events, [])
  }
})

test('missing isolated credentials or port never fall back to inherited/local environment settings', async () => {
  for (const key of ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
    const previous = process.env[key]
    try {
      process.env[key] = environment[key]
      const mock = mockedPool()
      await assert.rejects(checkAivenConnection({ ...environment, [key]: undefined }, mock), {
        code: 'AIVEN_CONFIGURATION_ERROR',
      })
      assert.deepEqual(mock.events, [])
    } finally {
      if (previous === undefined) delete process.env[key]
      else process.env[key] = previous
    }
  }
})

test('invalid configuration and CA material are sanitized before any network access', async () => {
  for (const settings of [
    { DB_SSL_CA: privateDetails },
    { DB_PORT: privateDetails },
    { DB_HOST: '127.0.0.1' },
    { DB_SSL_CA: '' },
    { DB_SSL_CA_PATH: privateDetails },
  ]) {
    const mock = mockedPool()
    await assert.rejects(checkAivenConnection({ ...environment, ...settings }, mock), (error) => {
      assert.equal(error.code, 'AIVEN_CONFIGURATION_ERROR')
      assert.equal(error.stack.includes(privateDetails), false)
      assert.equal(error.cause, undefined)
      return true
    })
    assert.deepEqual(mock.events, [])
  }
})

test('an unencrypted or unauthorized socket is never reported as SSL success', async () => {
  for (const stream of [
    undefined,
    {},
    { encrypted: false, authorized: true },
    { encrypted: true, authorized: false },
  ]) {
    const mock = mockedPool({ stream: stream ?? {} })
    await assert.rejects(checkAivenConnection(environment, mock), { code: 'AIVEN_TLS_ERROR' })
    assert.deepEqual(mock.events, ['create', 'acquire', 'release', 'end'])
  }
})

test('connection errors return fixed diagnostics without raw credentials, URIs, or certificate content', async () => {
  for (const [driverCode, expectedCode] of [
    ['ENOTFOUND', 'AIVEN_DNS_ERROR'],
    ['EAI_AGAIN', 'AIVEN_DNS_ERROR'],
    ['ETIMEDOUT', 'AIVEN_NETWORK_ERROR'],
    ['ECONNREFUSED', 'AIVEN_NETWORK_ERROR'],
    ['ER_ACCESS_DENIED_ERROR', 'AIVEN_AUTH_ERROR'],
    ['ER_DBACCESS_DENIED_ERROR', 'AIVEN_AUTH_ERROR'],
    ['ER_BAD_DB_ERROR', 'AIVEN_DATABASE_ERROR'],
    ['SELF_SIGNED_CERT_IN_CHAIN', 'AIVEN_CERTIFICATE_ERROR'],
    ['CERT_HAS_EXPIRED', 'AIVEN_CERTIFICATE_ERROR'],
    ['ERR_TLS_CERT_ALTNAME_INVALID', 'AIVEN_CERTIFICATE_ERROR'],
    ['HANDSHAKE_NO_SSL_SUPPORT', 'AIVEN_CERTIFICATE_ERROR'],
    [privateDetails, 'AIVEN_CONNECTION_ERROR'],
  ]) {
    const acquireError = Object.assign(new Error(privateDetails), { code: driverCode })
    const mock = mockedPool({ acquireError })
    await assert.rejects(checkAivenConnection(environment, mock), (error) => {
      assert.equal(error.code, expectedCode)
      assert.equal(error.stack.includes(privateDetails), false)
      assert.equal(error.cause, undefined)
      return true
    })
    assert.deepEqual(mock.events, ['create', 'acquire', 'end'])
  }
})

test('query errors cannot produce a false success and still close the connection', async () => {
  const mock = mockedPool({ queryError: new Error(privateDetails) })
  await assert.rejects(checkAivenConnection(environment, mock), (error) => {
    assert.equal(error.code, 'AIVEN_QUERY_ERROR')
    assert.equal(error.stack.includes(privateDetails), false)
    return true
  })
  assert.deepEqual(mock.events, [
    'create',
    'acquire',
    'SELECT 1 AS connection_ok',
    'release',
    'end',
  ])
})

test('cleanup errors are sanitized and pool closure is attempted even after a release failure', async () => {
  for (const settings of [
    { releaseError: new Error(privateDetails) },
    { endError: new Error(privateDetails) },
  ]) {
    const mock = mockedPool(settings)
    await assert.rejects(checkAivenConnection(environment, mock), (error) => {
      assert.equal(error.code, 'AIVEN_CLEANUP_ERROR')
      assert.equal(error.stack.includes(privateDetails), false)
      return true
    })
    assert.equal(mock.events.at(-1), 'end')
  }
})

test('pool construction failures are sanitized and cleanup never hides the original failure', async () => {
  await assert.rejects(
    checkAivenConnection(environment, {
      createPool() {
        throw new Error(privateDetails)
      },
    }),
    { code: 'AIVEN_CONNECTION_ERROR' },
  )
  const mock = mockedPool({
    acquireError: Object.assign(new Error(privateDetails), { code: 'ENOTFOUND' }),
    endError: new Error(privateDetails),
  })
  await assert.rejects(checkAivenConnection(environment, mock), { code: 'AIVEN_DNS_ERROR' })
})
