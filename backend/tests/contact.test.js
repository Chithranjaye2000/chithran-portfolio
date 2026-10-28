import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import express from 'express'
import { createContactRouter } from '../src/routes/contactRoutes.js'
import { errorHandler } from '../src/middleware/errorHandler.js'
import { createContactRateLimiter } from '../src/middleware/contactRateLimit.js'
import { contactLimits, validateContactInput } from '../src/validators/contactValidation.js'
import { readSmtpConfig } from '../src/config/smtp.js'
import { sendContactNotification } from '../src/services/emailService.js'

const valid = {
  name: 'Alice Example',
  email: 'alice@example.test',
  subject: 'Portfolio enquiry',
  message: 'I would like to discuss a software quality opportunity.',
}
const noLimit = (_request, _response, next) => next()

async function contactServer(t, dependencies = {}) {
  const saved = []
  const notified = []
  const app = express()
  app.use(express.json({ limit: '32kb', strict: true }))
  app.use(
    '/api/contact',
    createContactRouter({
      databasePool: {
        async execute(statement, parameters) {
          saved.push({ statement, parameters })
          return [{ affectedRows: 1 }]
        },
      },
      notify: async (contact) => notified.push(contact),
      rateLimiter: noLimit,
      ...dependencies,
    }),
  )
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
    saved,
    notified,
    submit: (body, options = {}) =>
      fetch(`http://127.0.0.1:${server.address().port}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        ...options,
      }),
  }
}

test('contact saves normalized data with placeholders before notifying and confirms actual persistence', async (t) => {
  const events = []
  const databasePool = {
    async execute(statement, parameters) {
      events.push({ type: 'saved', statement, parameters })
      return [{ affectedRows: 1 }]
    },
  }
  const api = await contactServer(t, {
    databasePool,
    notify: async (contact) => events.push({ type: 'notified', contact }),
  })
  const response = await api.submit({
    ...valid,
    name: '  Alice   Example  ',
    email: ' alice@EXAMPLE.TEST ',
    subject: '  Portfolio enquiry ',
    message: "  Hello\r\nI can discuss O'Reilly's project.  ",
  })
  assert.equal(response.status, 201)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual((await response.json()).data, { saved: true, notification: 'sent' })
  assert.deepEqual(
    events.map((event) => event.type),
    ['saved', 'notified'],
  )
  assert.equal(
    events[0].statement,
    'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
  )
  assert.deepEqual(events[0].parameters, [
    'Alice Example',
    'alice@example.test',
    'Portfolio enquiry',
    "Hello\nI can discuss O'Reilly's project.",
  ])
  assert.equal(events[1].contact.message, events[0].parameters[3])
})

test('subject is optional and empty subjects are stored as SQL NULL', async (t) => {
  const api = await contactServer(t)
  const withoutSubject = { ...valid }
  delete withoutSubject.subject
  for (const body of [withoutSubject, { ...valid, subject: '   ' }]) {
    const response = await api.submit(body)
    assert.equal(response.status, 201)
    await response.arrayBuffer()
  }
  assert.ok(api.saved.every(({ parameters }) => parameters[2] === null))
})

test('missing or empty required fields return field errors without inserting or notifying', async (t) => {
  const api = await contactServer(t)
  for (const field of ['name', 'email', 'message']) {
    for (const value of [undefined, '', '   ']) {
      const response = await api.submit({ ...valid, [field]: value })
      assert.equal(response.status, 422)
      assert.equal((await response.json()).error.code, 'VALIDATION_ERROR')
    }
  }
  assert.equal(api.saved.length, 0)
  assert.equal(api.notified.length, 0)
})

test('invalid email addresses and attempted mail-header injection are rejected', async (t) => {
  const api = await contactServer(t)
  for (const email of [
    'invalid',
    'alice@localhost',
    'alice@@example.test',
    '.alice@example.test',
    'alice..name@example.test',
    'alice@-example.test',
    'alice@example.test\r\nBcc: other@example.test',
    `${'a'.repeat(65)}@example.test`,
  ]) {
    const response = await api.submit({ ...valid, email })
    assert.equal(response.status, 422, email)
    assert.ok((await response.json()).error.fields.email)
  }
  assert.equal(api.saved.length, 0)
})

test('oversized fields and unexpected properties never reach the database', async (t) => {
  const api = await contactServer(t)
  for (const [field, maximum] of Object.entries(contactLimits)) {
    const response = await api.submit({ ...valid, [field]: 'x'.repeat(maximum + 1) })
    assert.equal(response.status, 422, field)
    assert.ok((await response.json()).error.fields[field])
  }
  for (const body of [
    { ...valid, admin: true },
    { ...valid, name: { nested: 'invalid' } },
    { ...valid, message: ['invalid'] },
    { ...valid, subject: null },
    [],
  ]) {
    const response = await api.submit(body)
    assert.equal(response.status, 422)
    await response.arrayBuffer()
  }
  assert.equal(api.saved.length, 0)
})

test('input normalization preserves Unicode and rejects control characters or malformed Unicode', () => {
  const normalized = validateContactInput({
    ...valid,
    name: 'Jose\u0301 Example',
    message: '😀'.repeat(5000),
  })
  assert.equal(normalized.name, 'José Example')
  assert.equal([...normalized.message].length, 5000)
  for (const body of [
    { ...valid, subject: 'Hello\nBcc: other@example.test' },
    { ...valid, name: 'Alice\u0000Example' },
    { ...valid, message: 'Bad\u000bcharacter' },
    { ...valid, message: '\ud800' },
    null,
    'invalid',
  ]) {
    assert.throws(
      () => validateContactInput(body),
      (error) => error.code === 'VALIDATION_ERROR',
    )
  }
})

test('incorrect content type, malformed JSON, and oversized request bodies are safely rejected', async (t) => {
  const api = await contactServer(t)
  const typeResponse = await api.submit(valid, { headers: { 'Content-Type': 'text/plain' } })
  assert.equal(typeResponse.status, 415)
  assert.equal((await typeResponse.json()).error.code, 'UNSUPPORTED_MEDIA_TYPE')
  const malformed = await api.submit(valid, { body: '{"name":' })
  assert.equal(malformed.status, 400)
  await malformed.arrayBuffer()
  const oversized = await api.submit({ ...valid, message: 'x'.repeat(33 * 1024) })
  assert.equal(oversized.status, 413)
  await oversized.arrayBuffer()
  assert.equal(api.saved.length, 0)
})

test('database failures do not send email or claim success and never expose driver details', async (t) => {
  t.mock.method(console, 'error', () => {})
  const secret = 'private-test-password mysql://private-user@private-host/private-db'
  const api = await contactServer(t, {
    databasePool: {
      execute: async () => {
        throw new Error(secret)
      },
    },
  })
  const response = await api.submit(valid)
  assert.equal(response.status, 503)
  const result = await response.text()
  assert.equal(result.includes(secret), false)
  assert.equal(result.includes('stack'), false)
  assert.equal(JSON.parse(result).error.code, 'DATABASE_UNAVAILABLE')
  assert.equal(api.notified.length, 0)
})

test('unexpected write results never produce a false saved confirmation', async (t) => {
  t.mock.method(console, 'error', () => {})
  const api = await contactServer(t, {
    databasePool: { execute: async () => [{ affectedRows: 0 }] },
  })
  const response = await api.submit(valid)
  assert.equal(response.status, 503)
  await response.arrayBuffer()
  assert.equal(api.notified.length, 0)
})

test('email failure preserves the successful insert and returns an honest notification status', async (t) => {
  const warnings = []
  t.mock.method(console, 'warn', (...values) => warnings.push(values.join(' ')))
  const secret = 'smtp-test-secret-not-for-output'
  const api = await contactServer(t, {
    notify: async () => {
      throw new Error(secret)
    },
  })
  const response = await api.submit(valid)
  assert.equal(response.status, 201)
  const body = await response.json()
  assert.deepEqual(body.data, { saved: true, notification: 'unavailable' })
  assert.match(body.message, /message was saved/i)
  assert.equal(api.saved.length, 1)
  assert.equal(JSON.stringify(body).includes(secret), false)
  assert.equal(warnings.join(' ').includes(secret), false)
})

test('contact rate limiting enforces the window, ignores spoofed forwarding, and resets after expiry', async (t) => {
  let time = 1000
  const api = await contactServer(t, {
    rateLimiter: createContactRateLimiter({ max: 2, windowMs: 1000, now: () => time }),
  })
  for (let count = 0; count < 2; count += 1) {
    const response = await api.submit(valid)
    assert.equal(response.status, 201)
    await response.arrayBuffer()
  }
  const limited = await api.submit(valid, {
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '198.51.100.23' },
  })
  assert.equal(limited.status, 429)
  assert.equal(limited.headers.get('retry-after'), '1')
  assert.equal(limited.headers.get('ratelimit-remaining'), '0')
  assert.equal((await limited.json()).error.code, 'RATE_LIMITED')
  assert.equal(api.saved.length, 2)
  time = 2000
  const reset = await api.submit(valid)
  assert.equal(reset.status, 201)
  await reset.arrayBuffer()
  assert.equal(api.saved.length, 3)
})

test('rate-limit storage remains bounded and expired entries free capacity', () => {
  let time = 0
  const limiter = createContactRateLimiter({ maxEntries: 1, windowMs: 1000, now: () => time })
  const results = []
  const response = {
    set() {
      return this
    },
  }
  const next = (error) => results.push(error?.code ?? 'allowed')
  limiter({ ip: 'first' }, response, next)
  limiter({ ip: 'second' }, response, next)
  time = 1000
  limiter({ ip: 'second' }, response, next)
  assert.deepEqual(results, ['allowed', 'RATE_LIMITED', 'allowed'])
})

const smtpEnvironment = {
  SMTP_HOST: 'smtp.example.test',
  SMTP_PORT: '587',
  SMTP_SECURE: 'false',
  SMTP_USER: 'test-user',
  SMTP_PASSWORD: 'fake-smtp-password-only',
  SMTP_FROM: 'portfolio@example.test',
  SMTP_TO: 'owner@example.test',
}

test('SMTP is unavailable until configured and invalid options fail without exposing credentials', () => {
  assert.equal(readSmtpConfig({}), null)
  assert.equal(readSmtpConfig({ ...smtpEnvironment, SMTP_PASSWORD: '' }), null)
  const configuration = readSmtpConfig(smtpEnvironment)
  assert.equal(configuration.port, 587)
  assert.equal(configuration.secure, false)
  assert.equal(configuration.password, smtpEnvironment.SMTP_PASSWORD)
  for (const invalid of [
    { SMTP_PORT: '65536' },
    { SMTP_PORT: 'not-a-port' },
    { SMTP_SECURE: 'maybe' },
    { SMTP_HOST: 'smtp://example.test' },
    { SMTP_FROM: 'sender@example.test\r\nBcc: other@example.test' },
  ]) {
    assert.throws(
      () => readSmtpConfig({ ...smtpEnvironment, ...invalid }),
      (error) => {
        assert.equal(error.message.includes(smtpEnvironment.SMTP_PASSWORD), false)
        return true
      },
    )
  }
})

test('Nodemailer uses configured sender/recipient and plain text with a safe reply-to; no real email is sent', async () => {
  let sent
  let options
  let closed = false
  await sendContactNotification(valid, {
    configuration: readSmtpConfig(smtpEnvironment),
    transportFactory(configuration) {
      options = configuration
      return {
        async sendMail(message) {
          sent = message
          return { accepted: ['owner@example.test'] }
        },
        close() {
          closed = true
        },
      }
    },
  })
  assert.equal(options.auth.pass, smtpEnvironment.SMTP_PASSWORD)
  assert.equal(options.requireTLS, true)
  assert.equal(sent.from.address, smtpEnvironment.SMTP_FROM)
  assert.equal(sent.to, smtpEnvironment.SMTP_TO)
  assert.deepEqual(sent.replyTo, { name: valid.name, address: valid.email })
  assert.equal(sent.subject, 'New portfolio contact message')
  assert.match(sent.text, /Portfolio enquiry/)
  assert.equal(sent.html, undefined)
  assert.equal(closed, true)
})

test('missing SMTP configuration and rejected mail are not treated as successful notification', async () => {
  await assert.rejects(sendContactNotification(valid, { configuration: null }), /unavailable/)
  let closed = false
  await assert.rejects(
    sendContactNotification(valid, {
      configuration: readSmtpConfig(smtpEnvironment),
      transportFactory: () => ({
        sendMail: async () => ({ accepted: [], rejected: ['owner@example.test'] }),
        close() {
          closed = true
        },
      }),
    }),
    /not accepted/,
  )
  assert.equal(closed, true)
})
