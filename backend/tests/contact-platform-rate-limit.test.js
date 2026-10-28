import test from 'node:test'
import assert from 'node:assert/strict'
import { createContactRateLimiter } from '../src/middleware/contactRateLimit.js'

function invoke(
  limiter,
  { ip = '192.0.2.10', remoteAddress = '192.0.2.20', platformIp, forwardedFor } = {},
) {
  const headers = {}
  const headerReads = []
  let error
  limiter(
    {
      ip,
      socket: { remoteAddress },
      get(name) {
        headerReads.push(name)
        return name === 'x-vercel-forwarded-for' ? platformIp : forwardedFor
      },
    },
    {
      set(name, value) {
        if (typeof name === 'object') Object.assign(headers, name)
        else headers[name] = value
      },
    },
    (failure) => {
      error = failure
    },
  )
  return { error, headers, headerReads }
}

test('non-Vercel requests cannot bypass the limiter by changing forwarded headers', () => {
  const limiter = createContactRateLimiter({ vercel: false, now: () => 0 })
  for (let index = 1; index <= 5; index++) {
    const result = invoke(limiter, {
      platformIp: `203.0.113.${index}`,
      forwardedFor: `198.51.100.${index}`,
    })
    assert.equal(result.error, undefined)
    assert.deepEqual(result.headerReads, [])
  }
  assert.equal(invoke(limiter, { platformIp: '203.0.113.99' }).error.status, 429)
})

test('Vercel uses its validated IPv4 header independently of the shared socket address', () => {
  const limiter = createContactRateLimiter({ vercel: true, now: () => 0 })
  for (let index = 0; index < 5; index++) {
    assert.equal(invoke(limiter, { platformIp: '203.0.113.1' }).error, undefined)
  }
  assert.equal(invoke(limiter, { platformIp: '203.0.113.1' }).error.status, 429)
  const secondVisitor = invoke(limiter, { platformIp: '203.0.113.2' })
  assert.equal(secondVisitor.error, undefined)
  assert.equal(secondVisitor.headers['RateLimit-Remaining'], '4')
  assert.deepEqual(secondVisitor.headerReads, ['x-vercel-forwarded-for'])
})

test('Vercel uses validated IPv6 addresses and normalizes surrounding whitespace', () => {
  const limiter = createContactRateLimiter({ vercel: true, now: () => 0 })
  for (let index = 0; index < 5; index++) {
    assert.equal(invoke(limiter, { platformIp: ' 2001:db8::1 ' }).error, undefined)
  }
  assert.equal(invoke(limiter, { platformIp: '2001:db8::1' }).error.status, 429)
  assert.equal(invoke(limiter, { platformIp: '2001:db8::2' }).error, undefined)
})

test('invalid, missing, or comma-separated platform headers fall back to request.ip', () => {
  const limiter = createContactRateLimiter({ vercel: true, now: () => 0 })
  for (const platformIp of [
    undefined,
    '',
    'not-an-ip',
    '203.0.113.1, 203.0.113.2',
    ['203.0.113.1'],
  ]) {
    assert.equal(invoke(limiter, { platformIp, forwardedFor: '198.51.100.99' }).error, undefined)
  }
  assert.equal(invoke(limiter, { platformIp: 'also-invalid' }).error.status, 429)
})

test('Vercel handling does not fall back to arbitrary X-Forwarded-For values', () => {
  const limiter = createContactRateLimiter({ vercel: true, now: () => 0 })
  for (let index = 1; index <= 5; index++) {
    assert.equal(invoke(limiter, { forwardedFor: `198.51.100.${index}` }).error, undefined)
  }
  assert.equal(invoke(limiter, { forwardedFor: '198.51.100.99' }).error.status, 429)
})

test('the five-request limit retains safe headers and expires after fifteen minutes', () => {
  let time = 100
  const limiter = createContactRateLimiter({ vercel: true, now: () => time })
  for (let index = 0; index < 5; index++) {
    const result = invoke(limiter, { platformIp: '203.0.113.1' })
    assert.equal(result.error, undefined)
    assert.equal(result.headers['RateLimit-Limit'], '5')
    assert.equal(result.headers['RateLimit-Remaining'], String(4 - index))
    assert.equal(result.headers['Cache-Control'], 'no-store')
  }
  const limited = invoke(limiter, { platformIp: '203.0.113.1' })
  assert.equal(limited.error.status, 429)
  assert.equal(limited.error.code, 'RATE_LIMITED')
  assert.equal(limited.headers['Retry-After'], '900')
  assert.doesNotMatch(limited.error.message, /203\.0\.113/)
  time += 15 * 60 * 1000
  assert.equal(invoke(limiter, { platformIp: '203.0.113.1' }).error, undefined)
})

test('request.ip is preferred over socket fallback, with no dependence on a forwarded-header getter', () => {
  const limiter = createContactRateLimiter({ vercel: true, now: () => 0 })
  let error
  const response = { set() {} }
  for (let index = 0; index < 6; index++) {
    limiter(
      { ip: '192.0.2.10', socket: { remoteAddress: `198.51.100.${index}` } },
      response,
      (failure) => {
        error = failure
      },
    )
  }
  assert.equal(error.status, 429)
})
