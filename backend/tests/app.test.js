import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import express from 'express'
import { createApp } from '../src/app.js'
import { readDatabaseConfig } from '../src/config/environment.js'
import { errorHandler } from '../src/middleware/errorHandler.js'

const frontendOrigin = 'http://127.0.0.1:5173'

async function startTestServer(t, app = createApp({ frontendOrigin })) {
  const server = createServer(app)
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve)
        server.closeAllConnections()
      }),
  )
  return `http://127.0.0.1:${server.address().port}`
}

test('health runs without database configuration and returns only public API status', async (t) => {
  assert.throws(() => readDatabaseConfig({}), /Missing required backend setting/)
  const address = await startTestServer(t)
  const response = await fetch(`${address}/api/health`)

  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /^application\/json/)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(response.headers.get('x-powered-by'), null)
  assert.equal(response.headers.get('access-control-allow-origin'), null)
  assert.deepEqual(await response.json(), {
    status: 'ok',
    service: 'chithran-portfolio-api',
    message: 'Portfolio API is running.',
  })
})

test('the configured frontend origin receives CORS permission without credentials', async (t) => {
  const address = await startTestServer(t)
  const response = await fetch(`${address}/api/health`, { headers: { Origin: frontendOrigin } })

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('access-control-allow-origin'), frontendOrigin)
  assert.equal(response.headers.get('access-control-allow-credentials'), null)
  await response.arrayBuffer()
})

test('an unapproved origin gets a safe rejection rather than wildcard CORS', async (t) => {
  const address = await startTestServer(t)
  const response = await fetch(`${address}/api/health`, {
    headers: { Origin: 'https://unapproved.example' },
  })

  assert.equal(response.status, 403)
  assert.equal(response.headers.get('access-control-allow-origin'), null)
  assert.deepEqual(await response.json(), {
    error: { code: 'ORIGIN_NOT_PERMITTED', message: 'Origin not permitted.' },
  })
})

test('approved preflight requests advertise the implemented read and contact methods', async (t) => {
  const address = await startTestServer(t)
  const response = await fetch(`${address}/api/health`, {
    method: 'OPTIONS',
    headers: {
      Origin: frontendOrigin,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type',
    },
  })

  assert.equal(response.status, 204)
  assert.equal(response.headers.get('access-control-allow-origin'), frontendOrigin)
  assert.deepEqual(response.headers.get('access-control-allow-methods').split(','), [
    'GET',
    'HEAD',
    'OPTIONS',
    'POST',
  ])
  assert.match(response.headers.get('access-control-allow-headers'), /content-type/i)
  assert.equal(await response.text(), '')
})

test('unknown routes and unsupported methods remain absent', async (t) => {
  const address = await startTestServer(t)
  for (const [path, method] of [
    ['/api/not-found', 'GET'],
    ['/api/contact', 'GET'],
    ['/api/projects', 'POST'],
    ['/api/qa-evidence', 'POST'],
    ['/api/health', 'POST'],
  ]) {
    const response = await fetch(`${address}${path}`, { method })
    assert.equal(response.status, 404, `${method} ${path}`)
    assert.deepEqual(await response.json(), {
      error: { code: 'NOT_FOUND', message: 'API route not found.' },
    })
  }
})

test('malformed JSON produces a sanitized 400 response without reflecting its contents', async (t) => {
  const address = await startTestServer(t)
  const secret = 'fake-body-password-that-must-not-be-reflected'
  const response = await fetch(`${address}/api/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: `{"password":"${secret}",`,
  })

  assert.equal(response.status, 400)
  const text = await response.text()
  assert.equal(text.includes(secret), false)
  assert.deepEqual(JSON.parse(text), {
    error: { code: 'INVALID_JSON', message: 'Request body must contain valid JSON.' },
  })
})

test('oversized JSON is rejected before routing with a safe 413 response', async (t) => {
  const address = await startTestServer(t)
  const response = await fetch(`${address}/api/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: 'x'.repeat(33 * 1024) }),
  })

  assert.equal(response.status, 413)
  assert.deepEqual(await response.json(), {
    error: { code: 'BODY_TOO_LARGE', message: 'Request body exceeds the permitted size.' },
  })
})

test('async internal errors expose neither credentials nor driver details in responses or logs', async (t) => {
  const privateDetails = [
    'fake-password-should-never-escape',
    'mysql://private-user:fake-password-should-never-escape@private-db.example/portfolio',
    'SELECT private_data FROM private_table',
  ]
  const logged = []
  t.mock.method(console, 'error', (...args) => logged.push(args.join(' ')))
  const app = express()
  app.get('/fault', async () => {
    await Promise.resolve()
    throw new Error(privateDetails.join(' '))
  })
  app.use(errorHandler)
  const address = await startTestServer(t, app)
  const response = await fetch(`${address}/fault`)
  const text = await response.text()

  assert.equal(response.status, 500)
  assert.deepEqual(JSON.parse(text), {
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected API error occurred.' },
  })
  assert.equal(logged.length, 1)
  for (const detail of privateDetails) {
    assert.equal(text.includes(detail), false)
    assert.equal(logged.join(' ').includes(detail), false)
  }
  assert.equal(text.includes('stack'), false)
})

test('errors after response headers are sent are delegated without a second response', () => {
  const original = new Error('fake-private-driver-error')
  let delegated
  errorHandler(original, {}, { headersSent: true }, (error) => {
    delegated = error
  })
  assert.equal(delegated, original)
})
