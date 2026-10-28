import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiRequestError, fetchCollection } from '../src/utils/api.js'
import { isProjectRecord } from '../src/utils/catalogue.js'
import { projects } from '../src/data/portfolio.js'

// Keep the portfolio's actual case-study content; only API identity fields differ.
const projectRecords = projects.map((project, index) => ({
  ...project,
  id: String(index + 1),
  slug: project.id,
}))

function collectionResponse(
  data,
  {
    page = 1,
    pageSize = 50,
    total = projectRecords.length,
    totalPages = Math.ceil(total / pageSize),
  } = {},
) {
  return {
    data,
    pagination: { page, pageSize, total, totalPages },
  }
}

function asJson(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function expectUnreadable(pages) {
  await assert.rejects(
    fetchCollection('/api/projects', {
      baseUrl: '',
      validateItem: isProjectRecord,
      fetcher: async (url) => {
        const page = Number(new URL(url, 'https://portfolio.example.test').searchParams.get('page'))
        return asJson(pages[page - 1])
      },
    }),
    (error) => {
      assert.ok(error instanceof ApiRequestError)
      assert.equal(error.message, 'The portfolio data could not be read. Please try again.')
      return true
    },
  )
}

test('project DTO validation accepts the existing real project records with API identities', () => {
  assert.equal(projectRecords.length, projects.length)
  assert.ok(projectRecords.every(isProjectRecord))
  assert.deepEqual(
    projectRecords.map(({ id: _id, slug: _slug, ...record }) => record),
    projects.map(({ id: _id, ...record }) => record),
  )
})

test('project DTO validation rejects missing fields and invalid core data types', () => {
  const project = projectRecords[0]
  for (const candidate of [
    null,
    undefined,
    {},
    { ...project, id: 1 },
    { ...project, id: 'not-an-id' },
    { ...project, summary: null },
    { ...project, technologies: 'not-an-array' },
    { ...project, technologies: [project.technologies[0], null] },
    { ...project, contributions: [null] },
  ]) {
    assert.equal(isProjectRecord(candidate), false)
  }
  for (const field of [
    'slug',
    'number',
    'label',
    'fullTitle',
    'title',
    'date',
    'category',
    'context',
    'summary',
    'overview',
    'note',
  ]) {
    const missing = { ...project }
    delete missing[field]
    assert.equal(isProjectRecord(missing), false, field)
  }
})

test('collection loading aggregates all pages in order without replacing portfolio content', async () => {
  const calls = []
  const records = await fetchCollection('/api/projects', {
    baseUrl: 'https://api.example.test',
    validateItem: isProjectRecord,
    fetcher: async (url, options) => {
      calls.push({ url, options })
      const page = Number(new URL(url).searchParams.get('page'))
      // A server may cap page size below the requested size.
      return asJson(
        collectionResponse(projectRecords.slice((page - 1) * 2, page * 2), {
          page,
          pageSize: 2,
        }),
      )
    },
  })
  assert.deepEqual(records, projectRecords)
  assert.deepEqual(
    calls.map(({ url }) => new URL(url).searchParams.get('page')),
    ['1', '2'],
  )
  assert.ok(calls.every(({ url }) => new URL(url).searchParams.get('pageSize') === '50'))
  assert.ok(calls.every(({ options }) => options.method === 'GET'))
})

test('collection requests preserve existing filter query parameters on every page', async () => {
  const urls = []
  const filtered = projectRecords.filter((project) => project.category === 'Web & mobile')
  const records = await fetchCollection('/api/projects?category=Web%20%26%20mobile', {
    baseUrl: '',
    validateItem: isProjectRecord,
    fetcher: async (url) => {
      urls.push(url)
      return asJson(collectionResponse(filtered, { total: filtered.length }))
    },
  })
  assert.deepEqual(records, filtered)
  const url = new URL(urls[0], 'https://portfolio.example.test')
  assert.equal(url.searchParams.get('category'), 'Web & mobile')
  assert.equal(url.searchParams.get('page'), '1')
  assert.equal(url.searchParams.get('pageSize'), '50')
})

test('a confirmed empty collection returns an empty list after one request', async () => {
  let calls = 0
  const records = await fetchCollection('/api/projects', {
    baseUrl: '',
    validateItem: isProjectRecord,
    fetcher: async () => {
      calls += 1
      return asJson(collectionResponse([], { total: 0, totalPages: 0 }))
    },
  })
  assert.deepEqual(records, [])
  assert.equal(calls, 1)
})

test('API rejection is surfaced instead of returning static or partial successful results', async () => {
  let calls = 0
  await assert.rejects(
    fetchCollection('/api/projects', {
      baseUrl: '',
      validateItem: isProjectRecord,
      fetcher: async () => {
        calls += 1
        if (calls === 1) {
          return asJson(collectionResponse(projectRecords.slice(0, 2), { pageSize: 2 }))
        }
        return asJson({ error: { message: 'Projects are unavailable right now.' } }, 503)
      },
    }),
    (error) => {
      assert.ok(error instanceof ApiRequestError)
      assert.equal(error.status, 503)
      assert.equal(error.message, 'Projects are unavailable right now.')
      return true
    },
  )
  assert.equal(calls, 2)
})

test('missing data or malformed pagination is rejected rather than presented as empty', async () => {
  const valid = collectionResponse(projectRecords)
  for (const result of [
    null,
    {},
    { pagination: valid.pagination },
    { data: {}, pagination: valid.pagination },
    { data: projectRecords },
    ...[
      { page: 0 },
      { page: 2 },
      { page: '1' },
      { pageSize: 0 },
      { pageSize: '50' },
      { pageSize: 1.5 },
      { total: -1 },
      { total: '4' },
      { total: Number.MAX_SAFE_INTEGER + 1 },
      { totalPages: -1 },
      { totalPages: '1' },
      { totalPages: 2 },
    ].map((invalid) => ({ ...valid, pagination: { ...valid.pagination, ...invalid } })),
  ]) {
    await expectUnreadable([result])
  }
})

test('invalid project records reject the whole collection without returning partial cards', async () => {
  await expectUnreadable([
    collectionResponse(projectRecords.slice(0, 2), { pageSize: 2 }),
    collectionResponse([projectRecords[2], { ...projectRecords[3], technologies: null }], {
      page: 2,
      pageSize: 2,
    }),
  ])
})

test('duplicate project identifiers are rejected within a page and across pages', async () => {
  await expectUnreadable([collectionResponse([projectRecords[0], projectRecords[0]], { total: 2 })])
  await expectUnreadable([
    collectionResponse([projectRecords[0]], { total: 2, pageSize: 1 }),
    collectionResponse([projectRecords[0]], { page: 2, total: 2, pageSize: 1 }),
  ])
})

test('aggregate record counts must match the declared total', async () => {
  await expectUnreadable([
    collectionResponse(projectRecords.slice(0, 2), { pageSize: 2 }),
    collectionResponse(projectRecords.slice(2, 3), { page: 2, pageSize: 2 }),
  ])
  await expectUnreadable([collectionResponse(projectRecords, { total: projectRecords.length - 1 })])
  await expectUnreadable([collectionResponse([], { total: 1 })])
})

test('pagination metadata must remain consistent while loading successive pages', async () => {
  for (const changedPage of [
    {
      data: projectRecords.slice(2, 3),
      pagination: { page: 2, pageSize: 2, total: 3, totalPages: 2 },
    },
    {
      data: projectRecords.slice(2),
      pagination: { page: 2, pageSize: 3, total: 4, totalPages: 2 },
    },
    {
      data: [],
      pagination: { page: 2, pageSize: 2, total: 2, totalPages: 1 },
    },
  ]) {
    await expectUnreadable([
      collectionResponse(projectRecords.slice(0, 2), { pageSize: 2 }),
      changedPage,
    ])
  }
})

test('a page cannot return more records than its declared page size', async () => {
  await expectUnreadable([
    collectionResponse(projectRecords.slice(0, 3), { pageSize: 2 }),
    collectionResponse(projectRecords.slice(3), { page: 2, pageSize: 2 }),
  ])
})

test('caller cancellation reaches the current page request and cannot return a partial collection', async () => {
  const controller = new AbortController()
  let calls = 0
  let receivedSignal
  await assert.rejects(
    fetchCollection('/api/projects', {
      baseUrl: '',
      validateItem: isProjectRecord,
      signal: controller.signal,
      fetcher: async (_url, { signal }) => {
        calls += 1
        if (calls === 1)
          return asJson(collectionResponse(projectRecords.slice(0, 2), { pageSize: 2 }))
        receivedSignal = signal
        return new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('private abort details')), {
            once: true,
          })
          controller.abort()
        })
      },
    }),
    (error) => {
      assert.ok(error instanceof ApiRequestError)
      assert.match(error.message, /timed out or was cancelled/)
      assert.equal(error.message.includes('private abort details'), false)
      return true
    },
  )
  assert.equal(calls, 2)
  assert.equal(receivedSignal.aborted, true)
})
