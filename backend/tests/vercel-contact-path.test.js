import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const rootUrl = new URL('../../', import.meta.url)
const configuration = JSON.parse(readFileSync(new URL('vercel.json', rootUrl), 'utf8'))
const backend = configuration.services.backend
const entrypoint = new URL(`${backend.root}/${backend.entrypoint}`, rootUrl).href

function runConfiguredEntrypoint() {
  // Isolate import-time guards and use the entrypoint selected by the real Services configuration.
  const source = `
    import { createRequire, syncBuiltinESMExports } from 'node:module';
    import { createServer } from 'node:http';
    const require = createRequire(import.meta.url);
    const fs = require('node:fs');
    const net = require('node:net');
    const mysql = require('mysql2/promise');
    const nodemailer = require('nodemailer');
    const counters = { pools: 0, transports: 0, privateReads: 0, importListeners: 0 };
    require('node:process').loadEnvFile = () => {};
    const read = fs.readFileSync;
    fs.readFileSync = function(path, ...args) {
      if (/(?:^|[\\\\/])\\.env(?:[.\\\\/]|$)|\\.(?:pem|crt|cer|key)$/i.test(String(path))) {
        counters.privateReads++;
        throw new Error('Private configuration is forbidden in this route probe.');
      }
      return read.call(this, path, ...args);
    };
    mysql.createPool = () => { counters.pools++; throw new Error('Real databases are forbidden.'); };
    nodemailer.createTransport = () => { counters.transports++; throw new Error('Real SMTP is forbidden.'); };
    const listen = net.Server.prototype.listen;
    net.Server.prototype.listen = function() {
      counters.importListeners++;
      throw new Error('Import must not open a listener.');
    };
    syncBuiltinESMExports();
    const { default: configuredApp, createApp } = await import(${JSON.stringify(entrypoint)});
    net.Server.prototype.listen = listen;
    const { readApiConfig } = await import(${JSON.stringify(new URL(`${backend.root}/src/config/environment.js`, rootUrl).href)});
    const operations = [];
    const dependencies = { contact: {
      databasePool: { async execute(sql, parameters) {
        await new Promise(resolve => setTimeout(resolve, 12));
        operations.push({ operation: 'save', sql, parameters });
        return [{ affectedRows: 1 }];
      } },
      notify: async () => {
        await new Promise(resolve => setTimeout(resolve, 12));
        operations.push({ operation: 'notify' });
      },
    } };
    const productionApp = createApp(readApiConfig(), dependencies);
    const localApp = createApp({ frontendOrigin: 'http://127.0.0.1:5173' }, dependencies);
    const configuration = ${JSON.stringify(configuration)};
    const visits = [];
    let selectedApp = configuredApp;
    // This checks the configured ingress contract; it does not emulate Vercel's hosted runtime.
    const server = createServer((request, response) => {
      const path = new URL(request.url, 'http://route.test').pathname;
      const service = configuration.rewrites.find(rule => new RegExp('^' + rule.source + '$').test(path))?.destination.service;
      visits.push({ service, method: request.method, url: request.url });
      if (service !== 'backend') {
        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: { code: 'TEST_FRONTEND_ROUTE' } }));
        return;
      }
      selectedApp(request, response);
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const origin = 'http://127.0.0.1:' + server.address().port;
    const results = {};
    async function request(key, path, { method = 'POST', body = {}, requestOrigin = 'https://preview.example.test' } = {}) {
      const response = await fetch(origin + path, {
        method,
        redirect: 'manual',
        headers: { Origin: requestOrigin, 'Content-Type': 'application/json' },
        ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
      });
      results[key] = { status: response.status, type: response.headers.get('content-type'), location: response.headers.get('location'), body: await response.json() };
    }
    try {
      await request('defaultInvalid', '/api/contact');
      await request('defaultSlashQuery', '/api/contact/?probe=services');
      await request('wrongMethod', '/api/contact', { method: 'GET' });
      await request('duplicatePrefix', '/api/api/contact');
      const valid = { name: 'Services Route Test', email: 'route@example.test', subject: '', message: 'Mocked Contact path verification without a real database or email.' };
      selectedApp = productionApp;
      await request('productionQuery', '/api/contact?probe=services', { body: valid });
      await request('productionSlashQuery', '/api/contact/?probe=services', { body: valid });
      selectedApp = localApp;
      await request('local', '/api/contact', { body: valid, requestOrigin: 'http://127.0.0.1:5173' });
      process.stdout.write(JSON.stringify({ callable: typeof configuredApp === 'function', counters, results, operations, visits }));
    } finally {
      await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    }
  `
  const environment = {
    NODE_ENV: 'production',
    VERCEL: '1',
    VERCEL_URL: 'preview.example.test',
    FRONTEND_ORIGIN: 'https://portfolio.example.test',
  }
  for (const key of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP']) {
    if (process.env[key] !== undefined) environment[key] = process.env[key]
  }
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    cwd: fileURLToPath(new URL(`${backend.root}/`, rootUrl)),
    env: environment,
    encoding: 'utf8',
    timeout: 15_000,
  })
  assert.equal(result.error, undefined, 'The isolated route probe must finish.')
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout)
}

let probe
function routeProbe() {
  probe ??= runConfiguredEntrypoint()
  return probe
}

test('the configured Services entrypoint routes POST /api/contact to validation without external resources', () => {
  const { callable, results, counters } = routeProbe()
  assert.equal(callable, true)
  for (const response of [results.defaultInvalid, results.defaultSlashQuery]) {
    assert.equal(response.status, 422)
    assert.equal(response.body.error.code, 'VALIDATION_ERROR')
    assert.match(response.type, /^application\/json/)
    assert.equal(response.location, null)
  }
  assert.deepEqual(counters, { pools: 0, transports: 0, privateReads: 0, importListeners: 0 })
})

test('Services Contact preserves POST, the /api prefix, query strings, and trailing slash behavior', () => {
  const { results, visits } = routeProbe()
  for (const response of [results.productionQuery, results.productionSlashQuery]) {
    assert.equal(response.status, 201)
    assert.deepEqual(response.body.data, { saved: true, notification: 'sent' })
    assert.equal(response.location, null)
  }
  assert.deepEqual(visits.slice(4, 6), [
    { service: 'backend', method: 'POST', url: '/api/contact?probe=services' },
    { service: 'backend', method: 'POST', url: '/api/contact/?probe=services' },
  ])
})

test('local and Services Contact await asynchronous persistence and notification without falling through', () => {
  const { results, operations } = routeProbe()
  assert.equal(results.local.status, 201)
  assert.deepEqual(
    operations.map((operation) => operation.operation),
    ['save', 'notify', 'save', 'notify', 'save', 'notify'],
  )
  for (const operation of operations.filter((entry) => entry.operation === 'save')) {
    assert.equal(
      operation.sql,
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
    )
    assert.deepEqual(operation.parameters, [
      'Services Route Test',
      'route@example.test',
      null,
      'Mocked Contact path verification without a real database or email.',
    ])
  }
})

test('GET and a duplicated prefix remain route misses rather than Contact submissions', () => {
  const { results, operations } = routeProbe()
  for (const response of [results.wrongMethod, results.duplicatePrefix]) {
    assert.equal(response.status, 404)
    assert.equal(response.body.error.code, 'NOT_FOUND')
  }
  assert.equal(operations.filter((entry) => entry.operation === 'save').length, 3)
})
