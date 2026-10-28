import test from 'node:test'
import assert from 'node:assert/strict'
import { rootCertificates } from 'node:tls'
import {
  createContactDatabasePool,
  readContactDatabaseConfig,
} from '../src/config/contactDatabase.js'

const aiven = {
  NODE_ENV: 'production',
  DB_HOST: 'mysql.example.test',
  DB_PORT: '12345',
  DB_NAME: 'contact_test',
  DB_USER: 'contact_unit_user',
  DB_PASSWORD: 'fake-aiven-unit-password',
  DB_SSL_ENABLED: 'true',
  DB_SSL_CA: rootCertificates[0],
}
const primaryLocal = {
  NODE_ENV: 'development',
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_NAME: 'local_catalogue',
  DB_USER: 'local_unit_user',
  DB_PASSWORD: 'fake-local-unit-password',
  DB_SSL_ENABLED: 'false',
}
const configurationError =
  'Contact database configuration is unavailable. Check the isolated Aiven settings.'

function productionSettings(overrides = {}) {
  return {
    ...primaryLocal,
    NODE_ENV: 'production',
    ...Object.fromEntries(
      Object.entries(aiven)
        .filter(([name]) => name.startsWith('DB_'))
        .map(([name, value]) => [`CONTACT_${name}`, value]),
    ),
    ...overrides,
  }
}

function environmentText(settings = aiven) {
  return Object.entries(settings)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
    .join('\n')
}

test('local development reads the isolated Aiven settings rather than the local catalogue settings', () => {
  let reads = 0
  const configuration = readContactDatabaseConfig(primaryLocal, {
    readAivenFile() {
      reads++
      return environmentText()
    },
  })
  assert.equal(reads, 1)
  assert.equal(configuration.host, aiven.DB_HOST)
  assert.equal(configuration.port, 12345)
  assert.equal(configuration.database, aiven.DB_NAME)
  assert.equal(configuration.user, aiven.DB_USER)
  assert.equal(configuration.password, aiven.DB_PASSWORD)
  assert.notEqual(configuration.password, primaryLocal.DB_PASSWORD)
  assert.equal(configuration.ssl.rejectUnauthorized, true)
  assert.equal(configuration.ssl.verifyIdentity, true)
  assert.equal(configuration.ssl.minVersion, 'TLSv1.2')
})

test('production uses only CONTACT_DB settings and never reads an Aiven file', () => {
  const configuration = readContactDatabaseConfig(productionSettings(), {
    readAivenFile() {
      assert.fail('Production must not read a private local file.')
    },
  })
  assert.equal(configuration.host, aiven.DB_HOST)
  assert.equal(configuration.database, aiven.DB_NAME)
  assert.equal(configuration.user, aiven.DB_USER)
  assert.equal(configuration.password, aiven.DB_PASSWORD)
  assert.equal(configuration.ssl.verifyIdentity, true)
})

test('partial Contact settings fail closed without falling back to local DB values or a file', () => {
  for (const missing of ['HOST', 'PORT', 'NAME', 'USER', 'PASSWORD', 'SSL_ENABLED', 'SSL_CA']) {
    assert.throws(
      () =>
        readContactDatabaseConfig(productionSettings({ [`CONTACT_DB_${missing}`]: undefined }), {
          readAivenFile: () => assert.fail('Partial production settings must not use a file.'),
        }),
      { message: configurationError },
    )
  }
  for (const settings of [
    { ...primaryLocal, CONTACT_DB_HOST: aiven.DB_HOST },
    { ...primaryLocal, NODE_ENV: 'production' },
  ]) {
    assert.throws(
      () =>
        readContactDatabaseConfig(settings, {
          readAivenFile: () => assert.fail('Explicit Contact settings must not fall back.'),
        }),
      { message: configurationError },
    )
  }
})

test('isolated file settings require explicit production SSL and all credentials', () => {
  for (const overrides of [
    { NODE_ENV: 'development' },
    { DB_SSL_ENABLED: 'false' },
    { DB_SSL_ENABLED: undefined },
    ...['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].map((key) => ({
      [key]: undefined,
    })),
  ]) {
    assert.throws(
      () =>
        readContactDatabaseConfig(primaryLocal, {
          readAivenFile: () => environmentText({ ...aiven, ...overrides }),
        }),
      { message: configurationError },
    )
  }
})

test('invalid Contact SSL, host, port, and CA settings expose no private parser details', () => {
  const privateDetails = 'mysql://private-user:private-password@private-host/db'
  for (const overrides of [
    { CONTACT_DB_SSL_ENABLED: 'false' },
    { CONTACT_DB_HOST: '127.0.0.1' },
    { CONTACT_DB_HOST: '::1' },
    { CONTACT_DB_HOST: privateDetails },
    { CONTACT_DB_PORT: privateDetails },
    { CONTACT_DB_NAME: 'invalid/database' },
    { CONTACT_DB_SSL_CA: privateDetails },
    { CONTACT_DB_SSL_CA: '' },
    { CONTACT_DB_SSL_CA_PATH: 'private-path-marker.pem' },
  ]) {
    assert.throws(
      () => readContactDatabaseConfig(productionSettings(overrides)),
      (error) => {
        assert.equal(error.message, configurationError)
        assert.equal(error.stack.includes(privateDetails), false)
        assert.equal(error.stack.includes('private-path-marker'), false)
        assert.equal(error.cause, undefined)
        return true
      },
    )
  }
})

test('unreadable or malformed isolated settings never cause local configuration fallback', () => {
  for (const readAivenFile of [
    () => {
      throw new Error('private-file-path private-password')
    },
    () => '',
    () => 'DB_HOST=127.0.0.1',
  ]) {
    assert.throws(() => readContactDatabaseConfig(primaryLocal, { readAivenFile }), {
      message: configurationError,
    })
  }
})

test('the Contact pool factory receives only the explicit verified Aiven configuration', () => {
  const expectedPool = {}
  let received
  const result = createContactDatabasePool(primaryLocal, {
    readAivenFile: () => environmentText(),
    createPool(configuration) {
      received = configuration
      return expectedPool
    },
  })
  assert.equal(result, expectedPool)
  assert.deepEqual(
    Object.keys(received).sort(),
    ['host', 'port', 'database', 'user', 'password', 'ssl'].sort(),
  )
  assert.equal(received.host, aiven.DB_HOST)
  assert.equal(received.database, aiven.DB_NAME)
  assert.equal(received.password, aiven.DB_PASSWORD)
  assert.equal(received.ssl.rejectUnauthorized, true)
  assert.equal(received.ssl.verifyIdentity, true)
})

test('invalid Contact configuration does not construct a pool', () => {
  assert.throws(
    () =>
      createContactDatabasePool(productionSettings({ CONTACT_DB_PASSWORD: undefined }), {
        createPool: () => assert.fail('Invalid configuration must not construct a pool.'),
      }),
    { message: configurationError },
  )
})

test('creating the actual Contact Promise pool is lazy and does not acquire a connection', async () => {
  const pool = createContactDatabasePool(productionSettings(), {
    readAivenFile: () => assert.fail('Production must not read a file.'),
  })
  try {
    assert.equal(pool.pool._allConnections.length, 0)
    assert.equal(pool.pool.config.connectionLimit, 5)
    assert.equal(pool.pool.config.connectionConfig.host, aiven.DB_HOST)
    assert.equal(pool.pool.config.connectionConfig.ssl.rejectUnauthorized, true)
    assert.equal(pool.pool.config.connectionConfig.ssl.verifyIdentity, true)
  } finally {
    await pool.end()
  }
})
