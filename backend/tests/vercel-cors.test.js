import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createApp } from '../src/app.js'
import { readApiConfig } from '../src/config/environment.js'

const production = 'https://portfolio.example.test'
const preview = 'portfolio-build-123.example.vercel.app'
const branch = 'portfolio-git-feature.example.vercel.app'
const platformEnvironment = {
  FRONTEND_ORIGIN: production,
  VERCEL: '1',
  VERCEL_URL: preview,
  VERCEL_BRANCH_URL: branch,
}

async function startServer(t, configuration = readApiConfig(platformEnvironment)) {
  const server = createServer(createApp(configuration))
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

test('non-Vercel configuration ignores deployment-origin variables and keeps the original shape', () => {
  for (const VERCEL of [undefined, '0', 'true', true]) {
    assert.deepEqual(
      readApiConfig({
        FRONTEND_ORIGIN: production,
        VERCEL,
        VERCEL_URL: 'https://attacker.example',
      }),
      {
        port: 3001,
        frontendOrigin: production,
      },
    )
  }
})

test('trusted Vercel configuration adds only exact HTTPS deployment and branch origins', () => {
  assert.deepEqual(readApiConfig(platformEnvironment), {
    port: 3001,
    frontendOrigin: production,
    additionalOrigins: [`https://${preview}`, `https://${branch}`],
  })
  assert.deepEqual(
    readApiConfig({ ...platformEnvironment, VERCEL_BRANCH_URL: preview.toUpperCase() })
      .additionalOrigins,
    [`https://${preview}`],
  )
  assert.deepEqual(
    readApiConfig({ FRONTEND_ORIGIN: `https://${preview}`, VERCEL: '1', VERCEL_URL: preview }),
    {
      port: 3001,
      frontendOrigin: `https://${preview}`,
    },
  )
  assert.deepEqual(readApiConfig({ VERCEL: '1' }), {
    port: 3001,
    frontendOrigin: 'http://127.0.0.1:5173',
  })
})

test('malformed platform hostnames fail closed without echoing their contents', () => {
  const invalidHosts = [
    '',
    'https://private-user:private-password@example.test',
    'https://portfolio.example.test',
    'portfolio.example.test/path',
    'portfolio.example.test?token=private-marker',
    'portfolio.example.test#private-marker',
    'portfolio.example.test:443',
    '*.vercel.app',
    '127.0.0.1',
    '::1',
    ' portfolio.example.test',
    'portfolio.example.test ',
    'portfolio..example.test',
    'portfolio.example.test.',
    'bad_host.example.test',
    `${'a'.repeat(64)}.example.test`,
    'a'.repeat(254),
    null,
    true,
  ]
  for (const name of ['VERCEL_URL', 'VERCEL_BRANCH_URL']) {
    for (const value of invalidHosts) {
      assert.throws(
        () => readApiConfig({ ...platformEnvironment, [name]: value }),
        (error) => {
          assert.equal(error.message, `Invalid backend setting: ${name}.`)
          assert.equal(error.stack.includes('private-password'), false)
          assert.equal(error.stack.includes('private-marker'), false)
          return true
        },
      )
    }
  }
})

test('production, current preview, and branch origins receive exact CORS permission without credentials', async (t) => {
  const address = await startServer(t)
  for (const origin of [production, `https://${preview}`, `https://${branch}`]) {
    const response = await fetch(`${address}/api/health`, { headers: { Origin: origin } })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('access-control-allow-origin'), origin)
    assert.equal(response.headers.get('access-control-allow-credentials'), null)
    assert.equal((await response.json()).status, 'ok')
  }
})

test('other deployments, origin suffix attacks, and forged Host/forwarded headers remain rejected', async (t) => {
  const address = await startServer(t)
  for (const origin of [
    'https://other-project.vercel.app',
    `https://${preview}.attacker.test`,
    'http://' + preview,
    'null',
  ]) {
    const response = await fetch(`${address}/api/health`, {
      headers: {
        Origin: origin,
        Host: preview,
        'X-Forwarded-Host': preview,
        'X-Forwarded-Proto': 'https',
      },
    })
    assert.equal(response.status, 403)
    assert.equal(response.headers.get('access-control-allow-origin'), null)
    assert.deepEqual(await response.json(), {
      error: { code: 'ORIGIN_NOT_PERMITTED', message: 'Origin not permitted.' },
    })
  }
})

test('a valid Preview Contact preflight preserves the original API prefix and POST permissions', async (t) => {
  const address = await startServer(t)
  const origin = `https://${preview}`
  const response = await fetch(`${address}/api/contact`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type',
    },
  })
  assert.equal(response.status, 204)
  assert.equal(response.headers.get('access-control-allow-origin'), origin)
  assert.ok(response.headers.get('access-control-allow-methods').split(',').includes('POST'))
  assert.equal(response.headers.get('access-control-allow-credentials'), null)
  await response.arrayBuffer()
})

test('requests without Origin remain usable without adding wildcard CORS headers', async (t) => {
  const address = await startServer(t)
  const response = await fetch(`${address}/api/health`)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('access-control-allow-origin'), null)
  assert.equal((await response.json()).status, 'ok')
})
