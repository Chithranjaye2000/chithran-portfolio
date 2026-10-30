import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createApp } from '../backend/src/app.js'
import { readApiConfig } from '../backend/src/config/environment.js'
import { projects } from '../src/data/portfolio.js'
import { qaReports } from '../src/data/qaReports.js'
import { mapProjectForMigration } from '../backend/src/services/projectMigrationService.js'
import { mapQaReportForMigration } from '../backend/src/services/qaMigrationService.js'
import { resolveApiBase, resolveContactApiBase } from '../src/utils/api.js'

const configuration = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
const projectRows = projects.map((project, index) => ({
  ...mapProjectForMigration(project, index),
  api_id: String(index + 1),
}))
const qaRows = qaReports
  .filter((report) => report.summaryApproved)
  .map((report, index) => ({
    ...mapQaReportForMigration(report, index),
    api_id: String(index + 1),
  }))

function serviceFor(path) {
  return configuration.rewrites.find((rule) => new RegExp(`^${rule.source}$`).test(path))
    ?.destination.service
}

function cataloguePool(rows) {
  return {
    async execute(sql) {
      return sql.includes('COUNT(*)') ? [[{ total: rows.length }]] : [rows]
    },
  }
}

async function startHarness(t) {
  const operations = []
  const app = createApp(
    readApiConfig({
      VERCEL: '1',
      FRONTEND_ORIGIN: 'https://portfolio.example.test',
      VERCEL_URL: 'portfolio-preview.example.test',
    }),
    {
      contact: {
        databasePool: {
          async execute(sql) {
            assert.match(sql, /^INSERT INTO contact_messages/)
            operations.push('save')
            return [{ affectedRows: 1 }]
          },
        },
        notify: async () => operations.push('notify'),
      },
      projects: { databasePool: cataloguePool(projectRows) },
      qaEvidence: { databasePool: cataloguePool(qaRows) },
    },
  )
  const visits = []
  // Local routing-contract harness, not an emulation of Vercel's hosted build/CDN.
  const server = createServer(async (request, response) => {
    const path = new URL(request.url, 'http://routing.test').pathname
    const service = serviceFor(path)
    visits.push({ service, url: request.url })
    if (service === 'backend') return app(request, response)
    const assets = {
      '/favicon.svg': ['../public/favicon.svg', 'image/svg+xml'],
      '/documents/Chithran-CV.pdf': ['../public/documents/Chithran-CV.pdf', 'application/pdf'],
    }
    const [file, contentType] = assets[path] ?? ['../index.html', 'text/html']
    try {
      response.setHeader('Content-Type', contentType)
      response.end(await readFile(new URL(file, import.meta.url)))
    } catch {
      response.statusCode = 404
      response.end('Test asset unavailable')
    }
  })
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
  return { origin: `http://127.0.0.1:${server.address().port}`, visits, operations }
}

test('Services routes preserve API ownership, asset paths, and frontend deep links', () => {
  for (const path of [
    '/api',
    '/api/',
    '/api/health',
    '/api/contact',
    '/api/projects/1',
    '/api/qa-evidence',
  ]) {
    assert.equal(serviceFor(path), 'backend', path)
  }
  for (const path of [
    '/',
    '/apiary',
    '/assets/app.js',
    '/images/profile/Photo.jpg',
    '/documents/Chithran-CV.pdf',
    '/portfolio/deep-link',
  ]) {
    assert.equal(serviceFor(path), 'app', path)
  }
  assert.equal(configuration.services.backend.entrypoint, 'src/app.js')
  assert.equal(configuration.services.app.outputDirectory, 'dist')
  assert.equal(configuration.services.app.installCommand, 'npm ci --include=dev')
  assert.deepEqual(configuration.services.app.rewrites, [
    { source: '/(.*)', destination: '/index.html' },
  ])
})

test('the original /api prefix reaches Express and API 404s never become frontend HTML', async (t) => {
  const harness = await startHarness(t)
  const health = await fetch(`${harness.origin}/api/health?probe=services`)
  assert.equal(health.status, 200)
  assert.equal((await health.json()).status, 'ok')
  assert.deepEqual(harness.visits[0], { service: 'backend', url: '/api/health?probe=services' })
  for (const path of ['/api', '/api/no-such-route', '/api/api/health']) {
    const response = await fetch(`${harness.origin}${path}`)
    assert.equal(response.status, 404)
    assert.match(response.headers.get('content-type'), /application\/json/)
    assert.equal((await response.json()).error.code, 'NOT_FOUND')
  }
})

test('same-origin frontend bases reach Contact once, with Preview CORS and save-before-notify', async (t) => {
  assert.equal(resolveApiBase({ DEV: false }), '')
  assert.equal(resolveContactApiBase({ DEV: false }), '')
  const harness = await startHarness(t)
  const response = await fetch(
    `${harness.origin}${resolveContactApiBase({ DEV: false })}/api/contact`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://portfolio-preview.example.test',
      },
      body: JSON.stringify({
        name: 'Routing check',
        email: 'routing@example.test',
        subject: '',
        message: 'Synthetic routing test; no real database or email.',
      }),
    },
  )
  assert.equal(response.status, 201)
  assert.equal(
    response.headers.get('access-control-allow-origin'),
    'https://portfolio-preview.example.test',
  )
  assert.deepEqual((await response.json()).data, { saved: true, notification: 'sent' })
  assert.deepEqual(harness.operations, ['save', 'notify'])
  assert.deepEqual(harness.visits, [{ service: 'backend', url: '/api/contact' }])
})

test('existing catalogue API response fields and approval metadata survive service routing', async (t) => {
  const harness = await startHarness(t)
  const projectsResponse = await fetch(`${harness.origin}/api/projects`)
  assert.equal(projectsResponse.status, 200)
  const projectBody = await projectsResponse.json()
  assert.equal(projectBody.pagination.total, 4)
  assert.deepEqual(
    projectBody.data.map((project) => project.slug),
    projects.map((project) => project.id),
  )
  assert.equal(projectBody.data[0].summary, projects[0].summary)
  const qaResponse = await fetch(`${harness.origin}/api/qa-evidence`)
  assert.equal(qaResponse.status, 200)
  const qaBody = await qaResponse.json()
  assert.equal(qaBody.pagination.total, 9)
  assert.equal(qaBody.data.filter((record) => record.sourceReviewed).length, 2)
  assert.equal(qaBody.data.filter((record) => record.summaryApproved).length, 9)
})

test('frontend static assets and the real CV retain their MIME types and content', async (t) => {
  const harness = await startHarness(t)
  const icon = await fetch(`${harness.origin}/favicon.svg`)
  assert.equal(icon.status, 200)
  assert.match(icon.headers.get('content-type'), /image\/svg\+xml/)
  assert.match(await icon.text(), /<svg/)
  const cv = await fetch(`${harness.origin}/documents/Chithran-CV.pdf`)
  assert.equal(cv.status, 200)
  assert.equal(cv.headers.get('content-type'), 'application/pdf')
  assert.equal((await cv.text()).slice(0, 5), '%PDF-')
  const deepLink = await fetch(`${harness.origin}/portfolio/deep-link`)
  assert.equal(deepLink.status, 200)
  assert.match(deepLink.headers.get('content-type'), /text\/html/)
  assert.match(await deepLink.text(), /<div id="root">/)
})
