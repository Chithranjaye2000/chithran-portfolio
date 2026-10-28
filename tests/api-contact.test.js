import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiRequestError, requestJson, resolveApiBase } from '../src/utils/api.js'
import {
  confirmedContactResult,
  contactFieldLimits,
  validateContact,
} from '../src/utils/contact.js'

const validContact = {
  name: 'Alice Example',
  email: 'alice@example.test',
  subject: 'Portfolio enquiry',
  message: 'I would like to discuss a software quality opportunity.',
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

test('API base selection uses explicit configuration, local development, or same-origin production', () => {
  assert.equal(resolveApiBase({ DEV: true }), 'http://127.0.0.1:3001')
  assert.equal(resolveApiBase({ DEV: false }), '')
  assert.equal(resolveApiBase({}), '')
  assert.equal(resolveApiBase({ DEV: true, VITE_API_BASE_URL: '' }), '')
  assert.equal(resolveApiBase({ VITE_API_BASE_URL: '   ' }), '')
  assert.equal(
    resolveApiBase({ DEV: true, VITE_API_BASE_URL: ' https://api.example.test/// ' }),
    'https://api.example.test',
  )
  assert.equal(
    resolveApiBase({ VITE_API_BASE_URL: 'https://example.test/portfolio/' }),
    'https://example.test/portfolio',
  )
})

test('API base rejects credentials, non-HTTP schemes, query strings, and fragments safely', () => {
  for (const value of [
    'not a URL',
    '/relative-base',
    'file:///private-path',
    'javascript:alert(1)',
    'https://private-user:fake-password@api.example.test',
    'https://api.example.test?token=fake-secret',
    'https://api.example.test#contact',
  ]) {
    assert.throws(
      () => resolveApiBase({ VITE_API_BASE_URL: value }),
      (error) => {
        assert.ok(error instanceof ApiRequestError)
        assert.equal(error.message, 'The API address is not configured correctly.')
        assert.equal(error.message.includes(value), false)
        return true
      },
    )
  }
})

test('JSON POST requests encode only the supplied data and return the actual response status', async () => {
  let received
  const response = await requestJson('/api/contact', {
    method: 'POST',
    body: validContact,
    baseUrl: 'https://api.example.test',
    fetcher: async (url, options) => {
      received = { url, options }
      return jsonResponse({ data: { saved: true, notification: 'sent' } }, 201)
    },
  })
  assert.equal(received.url, 'https://api.example.test/api/contact')
  assert.equal(received.options.method, 'POST')
  assert.deepEqual(received.options.headers, {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  })
  assert.equal(received.options.body, JSON.stringify(validContact))
  assert.equal(received.options.signal.aborted, false)
  assert.deepEqual(response, {
    status: 201,
    result: { data: { saved: true, notification: 'sent' } },
  })
})

test('GET requests support same-origin URLs without a body or unnecessary Content-Type header', async () => {
  let received
  const response = await requestJson('/api/projects?page=2', {
    baseUrl: '',
    fetcher: async (url, options) => {
      received = { url, options }
      return jsonResponse({ data: [] })
    },
  })
  assert.equal(received.url, '/api/projects?page=2')
  assert.equal(received.options.method, 'GET')
  assert.deepEqual(received.options.headers, { Accept: 'application/json' })
  assert.equal(Object.hasOwn(received.options, 'body'), false)
  assert.deepEqual(response, { status: 200, result: { data: [] } })
})

test('unreadable JSON responses never expose their HTML or private contents', async () => {
  for (const status of [200, 201, 502]) {
    await assert.rejects(
      requestJson('/api/contact', {
        baseUrl: '',
        fetcher: async () =>
          new Response('<html>private-server-details fake-password</html>', { status }),
      }),
      (error) => {
        assert.ok(error instanceof ApiRequestError)
        assert.equal(error.status, status)
        assert.equal(error.message, 'The API returned an unreadable response.')
        assert.equal(error.message.includes('fake-password'), false)
        return true
      },
    )
  }
})

test('expected status errors retain safe API messages and validation fields', async () => {
  for (const status of [400, 413, 415, 422, 429, 503]) {
    const fields = status === 422 ? { email: 'Enter a valid email address.' } : {}
    const message =
      status === 429 ? 'Please wait before sending another message.' : 'Request unavailable.'
    await assert.rejects(
      requestJson('/api/contact', {
        baseUrl: '',
        fetcher: async () =>
          jsonResponse({ error: { code: 'EXPECTED_ERROR', message, fields } }, status),
      }),
      (error) => {
        assert.ok(error instanceof ApiRequestError)
        assert.equal(error.status, status)
        assert.equal(error.message, message)
        assert.deepEqual(error.fields, fields)
        return true
      },
    )
  }
})

test('unexpected HTTP errors and missing error messages use safe generic messages', async () => {
  for (const [status, result] of [
    [500, { error: { message: 'mysql://private-user:fake-password@private-host/database' } }],
    [404, { error: { message: 'private filesystem route' } }],
    [422, { error: { message: { private: 'not a string' } } }],
    [503, {}],
  ]) {
    await assert.rejects(
      requestJson('/api/contact', {
        baseUrl: '',
        fetcher: async () => jsonResponse(result, status),
      }),
      (error) => {
        assert.equal(error.status, status)
        assert.equal(error.message, 'The service could not complete the request. Please try again.')
        assert.equal(error.message.includes('fake-password'), false)
        return true
      },
    )
  }
})

test('network failures are presented safely without exposing low-level details', async () => {
  await assert.rejects(
    requestJson('/api/contact', {
      baseUrl: '',
      fetcher: async () => {
        throw new Error('ECONNREFUSED private-host fake-secret')
      },
    }),
    (error) => {
      assert.ok(error instanceof ApiRequestError)
      assert.equal(error.status, 0)
      assert.equal(error.message, 'The API could not be reached. Please try again later.')
      assert.equal(error.message.includes('fake-secret'), false)
      return true
    },
  )
})

function abortableFetch(_url, { signal }) {
  return new Promise((_resolve, reject) => {
    const abort = () => reject(new Error('private abort implementation details'))
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
  })
}

test('caller cancellation and pre-cancelled requests never confirm a successful result', async () => {
  for (const alreadyAborted of [false, true]) {
    const controller = new AbortController()
    if (alreadyAborted) controller.abort()
    const pending = requestJson('/api/contact', {
      baseUrl: '',
      signal: controller.signal,
      fetcher: abortableFetch,
    })
    if (!alreadyAborted) controller.abort()
    await assert.rejects(pending, (error) => {
      assert.ok(error instanceof ApiRequestError)
      assert.equal(error.status, 0)
      assert.match(error.message, /timed out or was cancelled/)
      assert.match(error.message, /result could not be confirmed/)
      assert.equal(error.message.includes('private abort'), false)
      return true
    })
  }
})

test('a request timeout aborts the transport and reports an unconfirmed result', async () => {
  let transportSignal
  await assert.rejects(
    requestJson('/api/contact', {
      baseUrl: '',
      timeoutMs: 10,
      fetcher: (url, options) => {
        transportSignal = options.signal
        return abortableFetch(url, options)
      },
    }),
    /timed out or was cancelled/,
  )
  assert.equal(transportSignal.aborted, true)
})

test('request completion removes the caller cancellation listener', async () => {
  const listeners = new Set()
  const signal = {
    aborted: false,
    addEventListener(type, listener) {
      assert.equal(type, 'abort')
      listeners.add(listener)
    },
    removeEventListener(type, listener) {
      assert.equal(type, 'abort')
      listeners.delete(listener)
    },
  }
  await requestJson('/api/contact', {
    baseUrl: '',
    signal,
    fetcher: async () => jsonResponse({ data: {} }),
  })
  assert.equal(listeners.size, 0)
})

test('contact client validation normalizes text and permits an optional subject', () => {
  const validation = validateContact({
    ...validContact,
    name: '  Jose\u0301 Example  ',
    email: ' alice@example.test ',
    subject: '   ',
    message: '  A genuine enquiry.\nThank you.  ',
    unexpected: 'not submitted',
  })
  assert.deepEqual(validation.errors, {})
  assert.deepEqual(validation.values, {
    name: 'José Example',
    email: 'alice@example.test',
    subject: '',
    message: 'A genuine enquiry.\nThank you.',
  })
})

test('contact client validation flags missing fields, invalid emails, and excessive lengths', () => {
  for (const field of ['name', 'email', 'message']) {
    for (const value of [undefined, null, {}, '', '   ']) {
      const validation = validateContact({ ...validContact, [field]: value })
      assert.ok(validation.errors[field], field)
    }
  }
  for (const email of [
    'invalid',
    'alice@localhost',
    'alice@@example.test',
    'alice @example.test',
  ]) {
    assert.ok(validateContact({ ...validContact, email }).errors.email, email)
  }
  for (const [field, maximum] of Object.entries(contactFieldLimits)) {
    assert.ok(validateContact({ ...validContact, [field]: 'x'.repeat(maximum + 1) }).errors[field])
  }
  assert.equal(
    validateContact({ ...validContact, message: '😀'.repeat(contactFieldLimits.message) }).errors
      .message,
    undefined,
  )
})

test('a saved confirmation requires HTTP 201, saved true, and a recognized notification status', () => {
  for (const response of [
    { status: 200, result: { data: { saved: true, notification: 'sent' } } },
    { status: 201, result: { data: { saved: false, notification: 'sent' } } },
    { status: 201, result: { data: { saved: 'true', notification: 'sent' } } },
    { status: 201, result: { data: { saved: true, notification: 'unknown' } } },
    { status: 201, result: { success: true } },
    { status: 201, result: null },
    { status: 201 },
  ]) {
    assert.throws(
      () => confirmedContactResult(response),
      /message could not be confirmed as saved/i,
    )
  }
  assert.equal(
    confirmedContactResult({
      status: 201,
      result: { data: { saved: true, notification: 'sent' } },
    }),
    'Your message was saved. Thank you for getting in touch.',
  )
})

test('saved messages with failed email notifications receive an honest saved-only confirmation', () => {
  const message = confirmedContactResult({
    status: 201,
    result: { data: { saved: true, notification: 'unavailable' } },
  })
  assert.equal(message, 'Your message was saved. The email notification is currently unavailable.')
  assert.doesNotMatch(message, /email (sent|delivered)/i)
})
