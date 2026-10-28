import test from 'node:test'
import assert from 'node:assert/strict'
import { readApiConfig, readDatabaseConfig } from '../src/config/environment.js'
import { verifyDatabaseConnection } from '../src/services/databaseService.js'

const databaseEnvironment = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_NAME: 'portfolio_test',
  DB_USER: 'test_user',
  DB_PASSWORD: 'fake-password-for-unit-tests-only',
}

test('API defaults support local startup independently of database configuration', () => {
  assert.deepEqual(readApiConfig({}), {
    port: 3001,
    frontendOrigin: 'http://127.0.0.1:5173',
  })
})

test('API configuration accepts a single origin and normalizes its optional trailing slash', () => {
  assert.deepEqual(readApiConfig({ PORT: '4567', FRONTEND_ORIGIN: 'https://portfolio.example/' }), {
    port: 4567,
    frontendOrigin: 'https://portfolio.example',
  })
})

test('CORS configuration rejects wildcards, multiple origins, credentials, and URL paths', () => {
  for (const origin of [
    '',
    '*',
    'https://one.example,https://two.example',
    'https://user:fake-password@portfolio.example',
    'https://portfolio.example/contact',
    'https://portfolio.example?private=fake-secret',
    'https://portfolio.example#contact',
    'file:///portfolio',
    'ws://portfolio.example',
  ]) {
    assert.throws(
      () => readApiConfig({ FRONTEND_ORIGIN: origin }),
      { message: 'FRONTEND_ORIGIN must be a single HTTP or HTTPS origin.' },
      origin,
    )
  }
})

test('API and database ports must be integer TCP ports within range', () => {
  for (const invalidPort of ['', '0', '-1', '65536', '3001x', '1.5']) {
    assert.throws(() => readApiConfig({ PORT: invalidPort }), /Invalid backend setting: PORT/)
    assert.throws(
      () => readDatabaseConfig({ ...databaseEnvironment, DB_PORT: invalidPort }),
      /Invalid backend setting: DB_PORT/,
    )
  }
})

test('database configuration reads only server-side settings and preserves the password exactly', () => {
  const environment = {
    ...databaseEnvironment,
    DB_PORT: undefined,
    DB_HOST: ' 127.0.0.1 ',
    DB_USER: ' test_user ',
    DB_PASSWORD: ' fake password with intentional spaces ',
  }
  assert.deepEqual(readDatabaseConfig(environment), {
    host: '127.0.0.1',
    port: 3306,
    database: 'portfolio_test',
    user: 'test_user',
    password: environment.DB_PASSWORD,
  })
})

test('missing database settings and invalid database names fail without exposing other values', () => {
  for (const missing of ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
    const environment = { ...databaseEnvironment }
    delete environment[missing]
    assert.throws(
      () => readDatabaseConfig(environment),
      (error) => {
        assert.match(error.message, new RegExp(`Missing required backend setting: ${missing}`))
        assert.equal(error.message.includes(databaseEnvironment.DB_PASSWORD), false)
        return true
      },
    )
  }
  for (const DB_NAME of ['portfolio; DROP TABLE projects', 'portfolio-db', 'private/database']) {
    assert.throws(() => readDatabaseConfig({ ...databaseEnvironment, DB_NAME }), {
      message: 'Invalid backend setting: DB_NAME.',
    })
  }
})

test('database verification uses a harmless Promise query and accepts its expected result', async () => {
  const statements = []
  const pool = {
    async execute(statement) {
      statements.push(statement)
      return [[{ connection_ok: 1 }], []]
    },
  }
  assert.deepEqual(await verifyDatabaseConnection(pool), { status: 'ok' })
  assert.deepEqual(statements, ['SELECT 1 AS connection_ok'])
})

test('database driver failures are replaced with a safe error without credentials or a cause', async () => {
  const privateDetails = 'fake-password mysql://private-user:fake-password@private-host/private-db'
  const pool = {
    async execute() {
      throw new Error(privateDetails)
    },
  }
  await assert.rejects(verifyDatabaseConnection(pool), (error) => {
    assert.equal(
      error.message,
      'Database connection check failed. Check your local MySQL settings and service.',
    )
    assert.equal(error.message.includes(privateDetails), false)
    assert.equal(error.stack.includes('fake-password'), false)
    assert.equal(error.cause, undefined)
    return true
  })
})

test('an unexpected database response is not reported as a successful connection check', async () => {
  for (const rows of [[], [{ connection_ok: 0 }], [{}]]) {
    await assert.rejects(
      verifyDatabaseConnection({ execute: async () => [rows, []] }),
      /Database connection check failed/,
    )
  }
})
