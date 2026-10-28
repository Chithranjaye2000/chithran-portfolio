import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import express from 'express'
import { qaReports } from '../../src/data/qaReports.js'
import { createQaEvidenceRouter } from '../src/routes/qaEvidenceRoutes.js'
import { errorHandler, notFound } from '../src/middleware/errorHandler.js'
import { qaEvidenceToPublicDto } from '../src/services/qaEvidenceService.js'

function databaseRow(report, index = 0) {
  return {
    api_id: String(index + 1),
    slug: report.id,
    title: report.title,
    category: report.category,
    primary_tool: report.primaryTool,
    technologies: report.technologies,
    context: report.context,
    summary: report.summary,
    scope: report.scope,
    recorded_result: report.result,
    implementation: report.implementation,
    limitations: report.limitations,
    source_note: report.sourceNote,
    summary_approved: report.summaryApproved ? 1 : 0,
    source_reviewed: report.sourceReviewed ? 1 : 0,
    public_report_approved: report.publicReportApproved ? 1 : 0,
    report_url: report.reportUrl,
    is_published: 1,
    display_order: index,
    private_source_file: 'D:/private/reports/confidential-original.pdf',
  }
}

function qaPool(rows = qaReports.map(databaseRow)) {
  const calls = []
  function published(statement, parameters) {
    assert.match(statement, /is_published = 1/)
    assert.match(statement, /summary_approved = 1/)
    let selected = rows.filter((row) => row.is_published === 1 && row.summary_approved === 1)
    let binding = 0
    for (const [fragment, property] of [
      ['category = ?', 'category'],
      ['primary_tool = ?', 'primary_tool'],
      ['context = ?', 'context'],
    ]) {
      if (!statement.includes(fragment)) continue
      const value = parameters[binding++]
      selected = selected.filter((row) => row[property] === value)
    }
    return selected
  }
  return {
    calls,
    async execute(statement, parameters = []) {
      calls.push({ statement, parameters })
      const selected = published(statement, parameters)
      if (statement.includes('COUNT(*)')) return [[{ total: selected.length }], []]
      if (statement.includes('LIMIT ? OFFSET ?')) {
        assert.match(statement, /ORDER BY display_order, id LIMIT \? OFFSET \?$/)
        assert.equal(typeof parameters.at(-2), 'string')
        assert.equal(typeof parameters.at(-1), 'string')
        const limit = Number(parameters.at(-2))
        const offset = Number(parameters.at(-1))
        return [selected.slice(offset, offset + limit), []]
      }
      assert.match(statement, /id = \?/)
      return [selected.filter((row) => row.api_id === parameters[0]), []]
    },
  }
}

async function qaServer(t, pool = qaPool()) {
  const app = express()
  app.use('/api/qa-evidence', createQaEvidenceRouter({ databasePool: pool }))
  app.use(notFound)
  app.use(errorHandler)
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
  return {
    pool,
    request: (path = '', options) =>
      fetch(`http://127.0.0.1:${server.address().port}/api/qa-evidence${path}`, options),
  }
}

test('QA API preserves all nine owner-approved entries, findings, disclaimers, flags, and exact report links', async (t) => {
  const api = await qaServer(t)
  const response = await api.request()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const body = await response.json()
  assert.deepEqual(body.pagination, { page: 1, pageSize: 20, total: 9, totalPages: 1 })
  assert.equal(body.data.length, 9)
  for (let index = 0; index < qaReports.length; index++) {
    const { id, ...source } = qaReports[index]
    assert.deepEqual(body.data[index], {
      ...source,
      id: String(index + 1),
      slug: id,
      reportOnly: false,
    })
  }
  assert.equal(
    body.data.slice(0, 7).every((report) => report.sourceReviewed === false),
    true,
  )
  assert.equal(
    body.data.slice(7).every((report) => report.sourceReviewed === true),
    true,
  )
  assert.equal(JSON.stringify(body).includes('D:/private'), false)
  assert.equal(Object.hasOwn(body.data[0], 'is_published'), false)
  assert.equal(Object.hasOwn(body.data[0], 'display_order'), false)
})

test('testing type, primary tool, and context filters work alone and in combination through bindings', async (t) => {
  for (const [filters, expected, bindings] of [
    [{ category: 'automation' }, 2, ['automation']],
    [{ tool: 'Playwright' }, 1, ['Playwright']],
    [{ context: 'TalentHub testing environment' }, 2, ['TalentHub testing environment']],
    [
      { category: 'performance', tool: 'Apache JMeter', context: 'TalentHub testing environment' },
      1,
      ['performance', 'Apache JMeter', 'TalentHub testing environment'],
    ],
  ]) {
    const api = await qaServer(t)
    const response = await api.request(`?${new URLSearchParams(filters)}`)
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.pagination.total, expected)
    assert.equal(body.data.length, expected)
    assert.deepEqual(api.pool.calls[0].parameters, bindings)
    assert.deepEqual(api.pool.calls[1].parameters, [...bindings, '20', '0'])
  }
})

test('QA pagination retains stable source order and reports explicit totals', async (t) => {
  const api = await qaServer(t)
  const response = await api.request('?page=3&pageSize=4')
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.deepEqual(body.pagination, { page: 3, pageSize: 4, total: 9, totalPages: 3 })
  assert.deepEqual(
    body.data.map((report) => report.slug),
    ['allure-report'],
  )
  assert.deepEqual(api.pool.calls[1].parameters, ['4', '8'])
})

test('empty filters and out-of-range pages return real empty results rather than fabricated evidence', async (t) => {
  const api = await qaServer(t)
  const empty = await (await api.request('?tool=Unlisted')).json()
  assert.deepEqual(empty, {
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  })
  const beyond = await (await api.request('?page=10&pageSize=2')).json()
  assert.deepEqual(beyond.data, [])
  assert.equal(beyond.pagination.total, 9)
})

test('detail IDs retain BIGINT precision and return the matching public report', async (t) => {
  const row = { ...databaseRow(qaReports[0]), api_id: '9007199254740993' }
  const api = await qaServer(t, qaPool([row]))
  const response = await api.request('/9007199254740993')
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.data.id, '9007199254740993')
  assert.equal(body.data.slug, qaReports[0].id)
  assert.deepEqual(api.pool.calls[0].parameters, ['9007199254740993'])
  assert.match(api.pool.calls[0].statement, /CAST\(id AS CHAR\) AS api_id/)
})

test('invalid identifiers never reach the database', async (t) => {
  const api = await qaServer(t)
  for (const id of ['0', '-1', '01', '1.2', 'abc', '18446744073709551616', '1 OR 1=1--']) {
    const response = await api.request(`/${encodeURIComponent(id)}`)
    assert.equal(response.status, 400, id)
    assert.equal((await response.json()).error.code, 'INVALID_IDENTIFIER')
  }
  assert.equal(api.pool.calls.length, 0)
})

test('draft, unapproved, and missing entries are excluded from both collections and details', async (t) => {
  const rows = [
    databaseRow(qaReports[0]),
    { ...databaseRow(qaReports[1], 1), is_published: 0 },
    { ...databaseRow(qaReports[2], 2), summary_approved: 0 },
  ]
  const api = await qaServer(t, qaPool(rows))
  const collection = await (await api.request()).json()
  assert.equal(collection.pagination.total, 1)
  assert.deepEqual(
    collection.data.map((report) => report.slug),
    [qaReports[0].id],
  )
  for (const id of ['2', '3', '999']) {
    const response = await api.request(`/${id}`)
    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), {
      error: { code: 'QA_EVIDENCE_NOT_FOUND', message: 'No public QA evidence was found.' },
    })
  }
})

test('unsupported relationships, repeated filters, and invalid pagination are rejected before querying', async (t) => {
  const api = await qaServer(t)
  for (const query of [
    'project=QuickJob',
    'unknown=value',
    'category=api&category=security',
    'tool=one&tool=two',
    'context[x]=private',
    'category=',
    'tool=',
    `tool=${'x'.repeat(101)}`,
    `context=${'x'.repeat(256)}`,
    'context=%0Aprivate',
    'page=0',
    'page=10001',
    'pageSize=0',
    'pageSize=51',
    'pageSize=all',
  ]) {
    const response = await api.request(`?${query}`)
    assert.equal(response.status, 400, query)
    assert.equal((await response.json()).error.code, 'INVALID_QUERY')
  }
  assert.equal(api.pool.calls.length, 0)
})

test('SQL-shaped filter values remain bound values and cannot alter public visibility conditions', async (t) => {
  for (const value of [
    "anything' OR 1=1; DROP TABLE qa_evidence; --",
    String.raw`anything\' OR 1=1 --`,
  ]) {
    const api = await qaServer(t)
    const response = await api.request(
      `?${new URLSearchParams({ category: value, tool: value, context: value })}`,
    )
    assert.equal(response.status, 200)
    assert.deepEqual((await response.json()).data, [])
    assert.deepEqual(api.pool.calls[0].parameters, [value, value, value])
    assert.deepEqual(api.pool.calls[1].parameters, [value, value, value, '20', '0'])
    for (const { statement } of api.pool.calls) {
      assert.equal(statement.includes(value), false)
      assert.match(statement, /is_published = 1 AND summary_approved = 1/)
    }
  }
})

test('database failures return safe 503 errors without credentials, SQL, or internal paths', async (t) => {
  const privateDetails =
    'mysql://private-user:fake-qa-password@internal.example/private D:/private/report.pdf SELECT private_data'
  const api = await qaServer(t, {
    async execute() {
      throw new Error(privateDetails)
    },
  })
  for (const path of ['', '/1']) {
    const response = await api.request(path)
    assert.equal(response.status, 503)
    const text = await response.text()
    assert.equal(text.includes(privateDetails), false)
    assert.equal(text.includes('stack'), false)
    assert.deepEqual(JSON.parse(text), {
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'QA evidence could not be loaded right now. Please try again later.',
      },
    })
  }
})

test('a failed row query cannot be reported as successful empty evidence', async (t) => {
  const api = await qaServer(t, {
    async execute(statement) {
      if (statement.includes('COUNT(*)')) return [[{ total: 9 }], []]
      throw new Error('fake-private-driver-details')
    },
  })
  const response = await api.request()
  assert.equal(response.status, 503)
  const body = await response.json()
  assert.equal(body.data, undefined)
  assert.equal(body.error.code, 'DATABASE_UNAVAILABLE')
})

test('report URLs require separate public approval and never expose filesystem or internal URLs', () => {
  const base = databaseRow(qaReports[0])
  assert.equal(qaEvidenceToPublicDto({ ...base, public_report_approved: 0 }).reportUrl, null)
  assert.equal(
    qaEvidenceToPublicDto({ ...base, source_reviewed: 0 }).reportUrl,
    qaReports[0].reportUrl,
  )
  for (const report_url of [
    'file:///D:/private/report.pdf',
    'D:/private/report.pdf',
    '/documents/qa-reports/reviewed.pdf',
    'javascript:alert(1)',
    'https://user:fake-password@example.com/report.pdf',
    'https://127.0.0.1/report.pdf',
    'https://private.internal/report.pdf',
  ]) {
    assert.equal(qaEvidenceToPublicDto({ ...base, report_url }).reportUrl, null, report_url)
  }
})

test('approval metadata uses explicit booleans rather than arbitrary truthy values', () => {
  const base = databaseRow(qaReports[0])
  for (const value of ['false', 'true', '1', -1, null, undefined]) {
    const report = qaEvidenceToPublicDto({
      ...base,
      summary_approved: value,
      source_reviewed: value,
      public_report_approved: value,
    })
    assert.equal(report.summaryApproved, false)
    assert.equal(report.sourceReviewed, false)
    assert.equal(report.publicReportApproved, false)
    assert.equal(report.reportUrl, null)
  }
  const approved = qaEvidenceToPublicDto({
    ...base,
    summary_approved: true,
    source_reviewed: true,
    public_report_approved: true,
  })
  assert.equal(approved.summaryApproved, true)
  assert.equal(approved.sourceReviewed, true)
  assert.equal(approved.publicReportApproved, true)
})

test('nullable arrays and MySQL JSON strings remain compatible with existing detail cards', () => {
  const report = qaEvidenceToPublicDto({
    ...databaseRow(qaReports[0]),
    technologies: JSON.stringify(['HTTP requests', 'Timers']),
    implementation: null,
  })
  assert.deepEqual(report.technologies, ['HTTP requests', 'Timers'])
  assert.deepEqual(report.implementation, [])
  assert.equal(report.reportOnly, false)
})

test('QA evidence management write endpoints are not introduced', async (t) => {
  const api = await qaServer(t)
  for (const [path, method] of [
    ['', 'POST'],
    ['/1', 'PUT'],
    ['/1', 'DELETE'],
  ]) {
    const response = await api.request(path, { method })
    assert.equal(response.status, 404)
    assert.equal((await response.json()).error.code, 'NOT_FOUND')
  }
  assert.equal(api.pool.calls.length, 0)
})
