import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import express from 'express'
import { projects } from '../../src/data/portfolio.js'
import { createProjectRouter } from '../src/routes/projectRoutes.js'
import { errorHandler, notFound } from '../src/middleware/errorHandler.js'
import { projectToPublicDto } from '../src/services/projectService.js'
import {
  safeExternalUrl,
  safePublicImageUrl,
  validateCatalogueId,
} from '../src/validators/catalogueValidation.js'

function databaseRow(project, index = 0) {
  return {
    api_id: String(index + 1),
    slug: project.id,
    title: project.fullTitle,
    short_title: project.label,
    tagline: project.title,
    date_label: project.date,
    category: project.category,
    context: project.context,
    summary: project.summary,
    overview: project.overview,
    technologies: project.technologies,
    contributions: project.contributions,
    note: project.note,
    image_url: project.image,
    repository_url: project.repositoryUrl,
    demo_url: project.demoUrl,
    display_order: index,
    is_published: 1,
    internal_file_path: 'C:/private/unpublished-source.txt',
  }
}

function projectPool(rows = projects.map(databaseRow)) {
  const calls = []
  function published(statement, parameters) {
    assert.match(statement, /is_published = 1/)
    let selected = rows.filter((row) => row.is_published === 1)
    if (statement.includes('category = ?')) {
      selected = selected.filter((row) => row.category === parameters[0])
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

async function projectServer(t, pool = projectPool()) {
  const app = express()
  app.use('/api/projects', createProjectRouter({ databasePool: pool }))
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
      fetch(`http://127.0.0.1:${server.address().port}/api/projects${path}`, options),
  }
}

test('projects API preserves every existing card and case-study field while exposing only public DTOs', async (t) => {
  const api = await projectServer(t)
  const response = await api.request()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const body = await response.json()
  assert.deepEqual(body.pagination, { page: 1, pageSize: 20, total: 4, totalPages: 1 })
  assert.equal(body.data.length, 4)
  for (let index = 0; index < projects.length; index++) {
    const { id, ...source } = projects[index]
    assert.deepEqual(body.data[index], { ...source, id: String(index + 1), slug: id })
  }
  assert.equal(JSON.stringify(body).includes('C:/private'), false)
  assert.equal(Object.hasOwn(body.data[0], 'is_published'), false)
})

test('category filtering binds its exact value and preserves original display numbers', async (t) => {
  const api = await projectServer(t)
  const response = await api.request(`?category=${encodeURIComponent('Web & mobile')}`)
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.pagination.total, 3)
  assert.deepEqual(
    body.data.map((project) => project.number),
    ['02', '03', '04'],
  )
  assert.deepEqual(api.pool.calls[0].parameters, ['Web & mobile'])
  assert.deepEqual(api.pool.calls[1].parameters, ['Web & mobile', '20', '0'])
})

test('pagination uses validated bound limits, stable ordering, and explicit totals', async (t) => {
  const api = await projectServer(t)
  const response = await api.request('?page=2&pageSize=2')
  const body = await response.json()
  assert.equal(response.status, 200)
  assert.deepEqual(body.pagination, { page: 2, pageSize: 2, total: 4, totalPages: 2 })
  assert.deepEqual(
    body.data.map((project) => project.slug),
    ['innovation', 'task-tracker'],
  )
  assert.deepEqual(api.pool.calls[1].parameters, ['2', '2'])
})

test('empty filters and pages beyond available data return honest empty collections', async (t) => {
  const api = await projectServer(t)
  const empty = await (await api.request('?category=Unlisted')).json()
  assert.deepEqual(empty, {
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  })
  const beyond = await (await api.request('?page=8&pageSize=2')).json()
  assert.deepEqual(beyond.data, [])
  assert.equal(beyond.pagination.total, 4)
})

test('detail IDs remain exact decimal strings beyond JavaScript safe integer precision', async (t) => {
  const row = { ...databaseRow(projects[0]), api_id: '9007199254740993' }
  const api = await projectServer(t, projectPool([row]))
  const response = await api.request('/9007199254740993')
  assert.equal(response.status, 200)
  assert.equal((await response.json()).data.id, '9007199254740993')
  assert.deepEqual(api.pool.calls[0].parameters, ['9007199254740993'])
  assert.match(api.pool.calls[0].statement, /CAST\(id AS CHAR\) AS api_id/)
  assert.equal(validateCatalogueId('18446744073709551615'), '18446744073709551615')
})

test('invalid and injection-shaped detail identifiers are rejected before querying MySQL', async (t) => {
  const api = await projectServer(t)
  for (const id of ['0', '-1', '1.2', '1e2', '01', 'abc', '18446744073709551616', '1 OR 1=1--']) {
    const response = await api.request(`/${encodeURIComponent(id)}`)
    assert.equal(response.status, 400, id)
    assert.equal((await response.json()).error.code, 'INVALID_IDENTIFIER')
  }
  assert.equal(api.pool.calls.length, 0)
})

test('missing and unpublished projects have the same safe 404 response', async (t) => {
  const draft = { ...databaseRow(projects[0]), api_id: '9', is_published: 0 }
  const api = await projectServer(t, projectPool([draft]))
  for (const id of ['9', '999']) {
    const response = await api.request(`/${id}`)
    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), {
      error: { code: 'PROJECT_NOT_FOUND', message: 'No public project was found.' },
    })
  }
})

test('unexpected, repeated, malformed, and oversized query parameters are rejected safely', async (t) => {
  const api = await projectServer(t)
  for (const query of [
    'featured=true',
    'unknown=value',
    'page=1&page=2',
    'category=one&category=two',
    'category[x]=one',
    'category=',
    `category=${'x'.repeat(81)}`,
    'category=%0Aprivate',
    'page=0',
    'page=10001',
    'page=1.5',
    'pageSize=0',
    'pageSize=51',
    'pageSize=-1',
    'pageSize=all',
  ]) {
    const response = await api.request(`?${query}`)
    assert.equal(response.status, 400, query)
    assert.equal((await response.json()).error.code, 'INVALID_QUERY')
  }
  assert.equal(api.pool.calls.length, 0)
})

test('SQL-shaped category text stays in a value binding rather than entering the SQL statement', async (t) => {
  for (const category of ["Web' OR 1=1; DROP TABLE projects; --", String.raw`Web\' OR 1=1 --`]) {
    const api = await projectServer(t)
    const response = await api.request(`?category=${encodeURIComponent(category)}`)
    assert.equal(response.status, 200)
    assert.deepEqual((await response.json()).data, [])
    assert.equal(api.pool.calls[0].parameters[0], category)
    assert.deepEqual(api.pool.calls[1].parameters, [category, '20', '0'])
    for (const { statement } of api.pool.calls) assert.equal(statement.includes(category), false)
  }
})

test('database failures return sanitized 503 responses for both collection and detail reads', async (t) => {
  const secret = 'mysql://private-user:fake-project-password@internal.example/private'
  const api = await projectServer(t, {
    async execute() {
      throw new Error(secret)
    },
  })
  for (const path of ['', '/1']) {
    const response = await api.request(path)
    assert.equal(response.status, 503)
    const text = await response.text()
    assert.equal(text.includes(secret), false)
    assert.equal(text.includes('stack'), false)
    assert.deepEqual(JSON.parse(text), {
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Projects could not be loaded right now. Please try again later.',
      },
    })
  }
})

test('a failed row query is not disguised as an empty successful collection', async (t) => {
  const api = await projectServer(t, {
    async execute(statement) {
      if (statement.includes('COUNT(*)')) return [[{ total: 4 }], []]
      throw new Error('fake-private-query-details')
    },
  })
  const response = await api.request()
  assert.equal(response.status, 503)
  const body = await response.json()
  assert.equal(body.data, undefined)
  assert.equal(body.error.code, 'DATABASE_UNAVAILABLE')
})

test('public URL mapping excludes credentials, filesystem paths, traversal, and unsafe protocols', () => {
  for (const value of [
    'javascript:alert(1)',
    'file:///C:/private/image.png',
    'C:/private/image.png',
    'http://example.com/image.png',
    'https://user:fake-password@example.com/image.png',
    'https://127.0.0.1/image.png',
    'https://internal.local/image.png',
    '/images/../private.png',
    '/images/%2e%2e/private.png',
    '/images/a\\private.png',
  ]) {
    assert.equal(safePublicImageUrl(value), null, value)
  }
  for (const value of [
    'javascript:alert(1)',
    'file:///private',
    'https://private.internal/report',
  ]) {
    assert.equal(safeExternalUrl(value), null, value)
  }
  assert.equal(
    safePublicImageUrl('/images/projects/photo one.png'),
    '/images/projects/photo one.png',
  )
  assert.equal(
    safeExternalUrl('https://github.com/example/project'),
    'https://github.com/example/project',
  )
  const mapped = projectToPublicDto({
    ...databaseRow(projects[0]),
    image_url: 'C:/private/project.png',
    repository_url: 'javascript:alert(1)',
    demo_url: 'https://user:fake-password@example.com/private',
  })
  assert.equal(mapped.image, null)
  assert.equal(mapped.repositoryUrl, null)
  assert.equal(mapped.demoUrl, null)
})

test('nullable list fields and mysql2 JSON strings are mapped into usable arrays', () => {
  const row = {
    ...databaseRow(projects[0]),
    technologies: JSON.stringify(['ESP32', 'TCP/IP']),
    contributions: null,
    short_title: null,
  }
  const project = projectToPublicDto(row)
  assert.deepEqual(project.technologies, ['ESP32', 'TCP/IP'])
  assert.deepEqual(project.contributions, [])
  assert.equal(project.label, projects[0].fullTitle)
})

test('project management write endpoints are not introduced', async (t) => {
  const api = await projectServer(t)
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
