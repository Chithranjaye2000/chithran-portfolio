import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { rootCertificates } from 'node:tls'
import { fileURLToPath } from 'node:url'
import { readDatabaseConfig } from '../src/config/environment.js'
import { createDatabasePool } from '../src/config/database.js'

const local = {
  NODE_ENV: 'development',
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_NAME: 'portfolio_test',
  DB_USER: 'unit_test_user',
  DB_PASSWORD: 'fake-password-unit-tests-only',
}
// Public roots bundled with Node are test material, not an Aiven service certificate.
const ca = rootCertificates[0].trim()
const secure = { ...local, DB_HOST: 'mysql.example.test', DB_SSL_ENABLED: 'true', DB_SSL_CA: ca }

test('local MySQL remains non-SSL by default and with an explicit false setting', () => {
  for (const settings of [
    local,
    { ...local, DB_SSL_ENABLED: 'false', DB_SSL_CA: '', DB_SSL_CA_PATH: '' },
  ]) {
    assert.equal('ssl' in readDatabaseConfig(settings), false)
  }
})

test('SSL verifies both the CA chain and DNS identity with TLS 1.2 or newer', () => {
  assert.deepEqual(readDatabaseConfig(secure).ssl, {
    ca,
    rejectUnauthorized: true,
    verifyIdentity: true,
    minVersion: 'TLSv1.2',
  })
})

test('inline CA supports real or escaped newlines and multi-certificate rotation bundles', () => {
  assert.equal(readDatabaseConfig({ ...secure, DB_SSL_CA: ca.replace(/\n/g, '\\n') }).ssl.ca, ca)
  const bundle = `${ca}\n${rootCertificates[1].trim()}`
  assert.equal(readDatabaseConfig({ ...secure, DB_SSL_CA: bundle }).ssl.ca, bundle)
  assert.equal(readDatabaseConfig({ ...secure, DB_SSL_CA: ca.replace(/\n/g, '\r\n') }).ssl.ca, ca)
})

test('production defaults to verified SSL and cannot explicitly disable it', () => {
  const production = { ...secure, NODE_ENV: 'production', DB_SSL_ENABLED: undefined }
  assert.equal(readDatabaseConfig(production).ssl.verifyIdentity, true)
  assert.throws(() => readDatabaseConfig({ ...production, DB_SSL_ENABLED: 'false' }), {
    message: 'Database SSL is required in production.',
  })
  assert.throws(() => readDatabaseConfig({ ...production, DB_SSL_CA: undefined }), /exactly one/)
})

test('SSL booleans reject ambiguous or non-string configuration', () => {
  for (const DB_SSL_ENABLED of ['', 'yes', '1', 'TRUE', 'false ', true, false, null]) {
    assert.throws(() => readDatabaseConfig({ ...secure, DB_SSL_ENABLED }), /DB_SSL_ENABLED/)
  }
})

test('CA settings cannot be silently ignored when SSL is disabled', () => {
  for (const caSetting of [{ DB_SSL_CA: ca }, { DB_SSL_CA_PATH: 'certs/ca.pem' }]) {
    assert.throws(
      () => readDatabaseConfig({ ...local, ...caSetting }),
      /require DB_SSL_ENABLED=true/,
    )
  }
})

test('SSL requires exactly one CA source', () => {
  assert.throws(() => readDatabaseConfig({ ...secure, DB_SSL_CA: '' }), /exactly one/)
  assert.throws(
    () => readDatabaseConfig({ ...secure, DB_SSL_CA_PATH: 'certs/ca.pem' }),
    /exactly one/,
  )
  for (const [key, value] of [
    ['DB_SSL_CA', 123],
    ['DB_SSL_CA_PATH', {}],
  ]) {
    assert.throws(() => readDatabaseConfig({ ...secure, [key]: value }), /Invalid backend setting/)
  }
})

test('invalid CA material is rejected without revealing its contents or parser errors', () => {
  for (const value of [
    'private-test-marker',
    '-----BEGIN CERTIFICATE-----\ninvalid\n-----END CERTIFICATE-----',
    ca.slice(0, -15),
    `${ca}\n-----BEGIN PRIVATE KEY-----\nprivate-test-marker\n-----END PRIVATE KEY-----`,
    `${ca}\nprivate-test-marker`,
    ca.repeat(150),
  ]) {
    assert.throws(
      () => readDatabaseConfig({ ...secure, DB_SSL_CA: value }),
      (error) => {
        assert.equal(
          error.message,
          'Invalid database CA certificate. Provide a PEM CA certificate bundle.',
        )
        assert.equal(error.stack.includes('private-test-marker'), false)
        assert.equal(error.cause, undefined)
        return true
      },
    )
  }
})

test('CA files accept absolute and backend-relative paths independently of launch directory', () => {
  const directory = mkdtempSync(join(tmpdir(), 'portfolio-db-ssl-'))
  const filename = join(directory, 'ca.pem')
  try {
    writeFileSync(filename, ca)
    const backendDirectory = fileURLToPath(new URL('../', import.meta.url))
    for (const path of [filename, relative(backendDirectory, filename)]) {
      assert.equal(
        readDatabaseConfig({ ...secure, DB_SSL_CA: undefined, DB_SSL_CA_PATH: path }).ssl.ca,
        ca,
      )
    }
    assert.equal(readFileSync(filename, 'utf8'), ca)
    for (const path of [join(directory, 'private-path-marker.pem'), directory, 'invalid\0path']) {
      assert.throws(
        () => readDatabaseConfig({ ...secure, DB_SSL_CA: undefined, DB_SSL_CA_PATH: path }),
        (error) => {
          assert.equal(
            error.message,
            'Unable to read the database CA certificate. Check DB_SSL_CA_PATH.',
          )
          assert.equal(error.stack.includes(directory), false)
          assert.equal(error.cause, undefined)
          return true
        },
      )
    }
  } finally {
    unlinkSync(filename)
    rmdirSync(directory)
  }
})

test('verified SSL requires a DNS hostname so mysql2 cannot skip identity verification', () => {
  for (const DB_HOST of [
    '127.0.0.1',
    '::1',
    '[::1]',
    'https://mysql.example.test',
    'mysql.example.test:3306',
    'bad host',
  ]) {
    assert.throws(() => readDatabaseConfig({ ...secure, DB_HOST }), /DB_HOST.*DNS hostname/)
  }
})

test('SSL does not relax required credentials or port validation', () => {
  for (const name of ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
    const environment = { ...secure }
    delete environment[name]
    assert.throws(
      () => readDatabaseConfig(environment),
      new RegExp(`Missing required backend setting: ${name}`),
    )
  }
  assert.throws(() => readDatabaseConfig({ ...secure, DB_PORT: '3306;private' }), /DB_PORT/)
})

test('the existing Promise pool preserves limits and receives local/verified SSL without connecting', async () => {
  for (const configuration of [readDatabaseConfig(local), readDatabaseConfig(secure)]) {
    const pool = createDatabasePool(configuration)
    try {
      const options = pool.pool.config
      assert.equal(options.connectionLimit, 5)
      assert.equal(options.maxIdle, 2)
      assert.equal(options.idleTimeout, 60_000)
      assert.equal(options.queueLimit, 20)
      assert.equal(options.waitForConnections, true)
      assert.equal(options.connectionConfig.connectTimeout, 5_000)
      assert.equal(options.connectionConfig.multipleStatements, false)
      assert.equal(options.connectionConfig.timezone, 'Z')
      assert.equal(pool.pool._allConnections.length, 0)
      if (configuration.ssl) assert.deepEqual(options.connectionConfig.ssl, configuration.ssl)
      else assert.equal(options.connectionConfig.ssl, false)
    } finally {
      await pool.end()
    }
  }
})
