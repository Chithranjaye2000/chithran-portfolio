import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const backendDirectory = fileURLToPath(new URL('../', import.meta.url))
const appUrl = new URL('../src/app.js', import.meta.url).href

function probe(mode) {
  // A separate process isolates the module cache and import-time side-effect guards.
  const source = `
    import { createRequire, syncBuiltinESMExports } from 'node:module';
    import { createServer } from 'node:http';
    const require = createRequire(import.meta.url);
    const nodeProcess = require('node:process');
    const net = require('node:net');
    const fs = require('node:fs');
    const mysql = require('mysql2/promise');
    const nodemailer = require('nodemailer');
    const counters = { listens: 0, pools: 0, transports: 0, environmentLoads: 0, privateFileReads: 0 };
    nodeProcess.loadEnvFile = () => { counters.environmentLoads++; };
    const originalRead = fs.readFileSync;
    fs.readFileSync = function(path, ...args) {
      const name = String(path);
      if (/(?:^|[\\\\/])\\.env(?:[.\\\\/]|$)/.test(name) || /\\.(?:pem|crt|key)$/.test(name)) {
        counters.privateFileReads++;
        throw new Error('Private files must not be read by this serverless probe.');
      }
      return originalRead.call(this, path, ...args);
    };
    const originalListen = net.Server.prototype.listen;
    net.Server.prototype.listen = function(...args) {
      counters.listens++;
      if (${JSON.stringify(mode)} === 'import') throw new Error('Import must not start a listener.');
      return originalListen.apply(this, args);
    };
    mysql.createPool = () => { counters.pools++; throw new Error('A real database pool is forbidden in this probe.'); };
    nodemailer.createTransport = () => { counters.transports++; throw new Error('Real SMTP is forbidden in this probe.'); };
    syncBuiltinESMExports();
    const { default: app, createApp } = await import(${JSON.stringify(appUrl)});
    const imported = { callable: typeof app === 'function', ...counters };
    if (${JSON.stringify(mode)} === 'import') {
      process.stdout.write(JSON.stringify({ imported }));
    } else {
      const events = [];
      const configured = createApp({ frontendOrigin: 'https://portfolio.example.test' }, {
        contact: {
          databasePool: { async execute(statement, parameters) {
            events.push({ type: 'save', statement, parameters });
            return [{ affectedRows: 1 }];
          } },
          notify: async () => { events.push({ type: 'notify' }); },
          rateLimiter: (_request, _response, next) => next(),
        },
      });
      const server = createServer(configured);
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
      const address = 'http://127.0.0.1:' + server.address().port;
      const valid = { name: 'Service Test', email: 'service@example.test', subject: 'Routing check', message: 'This is a mocked serverless route check.' };
      const results = {};
      async function request(key, path, body) {
        const response = await fetch(address + path, {
          method: body === undefined ? 'GET' : 'POST',
          headers: { Origin: 'https://portfolio.example.test', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        results[key] = { status: response.status, type: response.headers.get('content-type'), body: await response.json() };
      }
      try {
        await request('health', '/api/health');
        await request('contact', '/api/contact', valid);
        await request('unknown', '/api/not-a-route');
        await request('doubledHealth', '/api/api/health');
        await request('doubledContact', '/api/api/contact', valid);
        await request('invalid', '/api/contact', {});
        process.stdout.write(JSON.stringify({ imported, results, events, counters }));
      } finally {
        await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
      }
    }
  `
  const environment = {
    NODE_ENV: 'production',
    FRONTEND_ORIGIN: 'https://portfolio.example.test',
  }
  for (const key of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP']) {
    if (process.env[key] !== undefined) environment[key] = process.env[key]
  }
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    cwd: backendDirectory,
    env: environment,
    encoding: 'utf8',
    timeout: 15_000,
  })
  assert.equal(result.error, undefined, 'Serverless probe must complete without timing out.')
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout)
}

let routes
function routeResults() {
  routes ??= probe('routes')
  return routes
}

test('Vercel app entry imports as a handler without listeners, pools, SMTP, or private-file reads', () => {
  const { imported } = probe('import')
  assert.equal(imported.callable, true)
  assert.equal(imported.listens, 0)
  assert.equal(imported.pools, 0)
  assert.equal(imported.transports, 0)
  assert.equal(imported.privateFileReads, 0)
})

test('the serverless app serves the existing /api/health JSON route', () => {
  const { imported, results } = routeResults()
  assert.equal(imported.listens, 0)
  assert.equal(results.health.status, 200)
  assert.match(results.health.type, /^application\/json/)
  assert.deepEqual(results.health.body, {
    status: 'ok',
    service: 'chithran-portfolio-api',
    message: 'Portfolio API is running.',
  })
})

test('the original /api/contact path saves through injected dependencies before notification', () => {
  const { results, events, counters } = routeResults()
  assert.equal(results.contact.status, 201)
  assert.deepEqual(results.contact.body.data, { saved: true, notification: 'sent' })
  assert.deepEqual(
    events.map((event) => event.type),
    ['save', 'notify'],
  )
  assert.equal(
    events[0].statement,
    'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
  )
  assert.deepEqual(events[0].parameters, [
    'Service Test',
    'service@example.test',
    'Routing check',
    'This is a mocked serverless route check.',
  ])
  assert.equal(counters.pools, 0)
  assert.equal(counters.transports, 0)
  assert.equal(counters.privateFileReads, 0)
})

test('unknown API routes remain JSON 404 responses rather than a frontend fallback', () => {
  const { results } = routeResults()
  assert.equal(results.unknown.status, 404)
  assert.match(results.unknown.type, /^application\/json/)
  assert.deepEqual(results.unknown.body, {
    error: { code: 'NOT_FOUND', message: 'API route not found.' },
  })
})

test('duplicating the API prefix does not reach health or Contact handlers', () => {
  const { results, events } = routeResults()
  for (const result of [results.doubledHealth, results.doubledContact]) {
    assert.equal(result.status, 404)
    assert.equal(result.body.error.code, 'NOT_FOUND')
  }
  assert.equal(events.filter((event) => event.type === 'save').length, 1)
})

test('serverless Contact validation still rejects missing fields before persistence or email', () => {
  const { results, events } = routeResults()
  assert.equal(results.invalid.status, 422)
  assert.equal(results.invalid.body.error.code, 'VALIDATION_ERROR')
  assert.deepEqual(Object.keys(results.invalid.body.error.fields).sort(), [
    'email',
    'message',
    'name',
  ])
  assert.equal(events.filter((event) => event.type === 'save').length, 1)
  assert.equal(events.filter((event) => event.type === 'notify').length, 1)
})
