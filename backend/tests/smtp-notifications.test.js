import test from 'node:test'
import assert from 'node:assert/strict'
import { readNotificationEnvironment, readSmtpConfig } from '../src/config/smtp.js'
import { sendContactNotification } from '../src/services/emailService.js'

const gmailEnvironment = {
  NODE_ENV: 'production',
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '465',
  SMTP_SECURE: 'true',
  SMTP_USER: 'sender@example.test',
  SMTP_PASSWORD: 'abcd efgh ijkl mnop',
  CONTACT_NOTIFICATION_EMAIL: 'inbox@example.test',
}
const contact = {
  name: 'Example Visitor',
  email: 'visitor@example.test',
  subject: 'An opportunity',
  message: 'A sample enquiry used only in mocked tests.',
}

test('production Gmail uses an explicit notification address and App Password configuration', () => {
  const configuration = readSmtpConfig(gmailEnvironment)
  assert.equal(configuration.to, gmailEnvironment.CONTACT_NOTIFICATION_EMAIL)
  assert.equal(configuration.from, gmailEnvironment.SMTP_USER)
  assert.equal(configuration.user, gmailEnvironment.SMTP_USER)
  assert.equal(configuration.password, 'abcdefghijklmnop')
  assert.equal(configuration.port, 465)
  assert.equal(configuration.secure, true)
  assert.equal(
    readSmtpConfig({ ...gmailEnvironment, SMTP_PORT: '587', SMTP_SECURE: 'false' }).secure,
    false,
  )
})

test('optional local SMTP settings are isolated and do not merge inherited credentials or change the process', () => {
  const inherited = {
    NODE_ENV: 'development',
    SMTP_PASSWORD: 'inherited-test-secret',
    SMTP_TO: 'legacy@example.test',
  }
  const settings = readNotificationEnvironment(inherited, {
    readSource: () =>
      'SMTP_HOST=smtp.gmail.com\nCONTACT_NOTIFICATION_EMAIL=inbox@example.test\nNODE_ENV=production',
  })
  assert.equal(settings.NODE_ENV, 'development')
  assert.equal(settings.SMTP_PASSWORD, undefined)
  assert.equal(settings.SMTP_TO, undefined)
  assert.equal(settings.CONTACT_NOTIFICATION_EMAIL, 'inbox@example.test')
  assert.equal(inherited.SMTP_PASSWORD, 'inherited-test-secret')
  assert.equal(readSmtpConfig(settings), null)
})

test('production ignores the local SMTP file and missing optional files retain existing local behavior', () => {
  const production = { ...gmailEnvironment }
  const settings = readNotificationEnvironment(production, {
    readSource() {
      throw new Error('must not read local files in production')
    },
  })
  assert.equal(settings, production)
  const local = { NODE_ENV: 'development' }
  assert.equal(
    readNotificationEnvironment(local, {
      readSource() {
        throw Object.assign(new Error('not found'), { code: 'ENOENT' })
      },
    }),
    local,
  )
  assert.throws(
    () =>
      readNotificationEnvironment(local, {
        readSource() {
          throw new Error('private SMTP contents')
        },
      }),
    { message: 'Email notification configuration is unavailable.' },
  )
})

test('production cannot fall back to the legacy recipient and no recipient is invented', () => {
  assert.equal(
    readSmtpConfig({
      ...gmailEnvironment,
      CONTACT_NOTIFICATION_EMAIL: undefined,
      SMTP_TO: 'legacy@example.test',
    }),
    null,
  )
  assert.equal(readSmtpConfig({ ...gmailEnvironment, CONTACT_NOTIFICATION_EMAIL: '' }), null)
})

test('development preserves the legacy SMTP_TO configuration without changing provider passwords', () => {
  const configuration = readSmtpConfig({
    NODE_ENV: 'development',
    SMTP_HOST: 'smtp.example.test',
    SMTP_USER: 'provider-user',
    SMTP_PASSWORD: ' intentional password spaces ',
    SMTP_FROM: 'sender@example.test',
    SMTP_TO: 'legacy@example.test',
  })
  assert.equal(configuration.to, 'legacy@example.test')
  assert.equal(configuration.password, ' intentional password spaces ')
  assert.equal(configuration.port, 587)
})

test('the new recipient takes precedence locally and rejects ambiguous or injected addresses', () => {
  assert.equal(
    readSmtpConfig({ ...gmailEnvironment, NODE_ENV: 'development', SMTP_TO: 'legacy@example.test' })
      .to,
    'inbox@example.test',
  )
  for (const recipient of [
    'one@example.test,two@example.test',
    'inbox@example.test\r\nBcc:other@example.test',
    'not-an-email',
    {},
  ]) {
    assert.throws(
      () => readSmtpConfig({ ...gmailEnvironment, CONTACT_NOTIFICATION_EMAIL: recipient }),
      { message: 'Email notification configuration is unavailable.' },
    )
  }
})

test('Gmail rejects insecure port combinations, sender mismatches, and invalid App Password input', () => {
  for (const overrides of [
    { SMTP_PORT: '465', SMTP_SECURE: 'false' },
    { SMTP_PORT: '587', SMTP_SECURE: 'true' },
    { SMTP_PORT: '25' },
    { SMTP_FROM: 'other@example.test' },
    { SMTP_USER: 'not-an-email' },
    { SMTP_PASSWORD: 'not-an-app-password' },
    { SMTP_PASSWORD: 'abcdefghijklmnop\n' },
    { SMTP_PASSWORD: {} },
  ]) {
    assert.throws(() => readSmtpConfig({ ...gmailEnvironment, ...overrides }), {
      message: 'Email notification configuration is unavailable.',
    })
  }
})

test('mocked delivery requires TLS verification and uses only configured envelope addresses', async () => {
  let sent
  let options
  let closed = false
  await sendContactNotification(contact, {
    configuration: readSmtpConfig(gmailEnvironment),
    transportFactory(settings) {
      options = settings
      return {
        async sendMail(message) {
          sent = message
          return { accepted: ['inbox@example.test'], rejected: [] }
        },
        close() {
          closed = true
        },
      }
    },
  })
  assert.deepEqual(options.tls, {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
    servername: 'smtp.gmail.com',
  })
  assert.equal(options.secure, true)
  assert.equal(options.logger, false)
  assert.equal(options.debug, false)
  assert.equal(sent.to, gmailEnvironment.CONTACT_NOTIFICATION_EMAIL)
  assert.equal(sent.from.address, gmailEnvironment.SMTP_USER)
  assert.deepEqual(sent.replyTo, { name: contact.name, address: contact.email })
  assert.equal(sent.html, undefined)
  assert.equal(sent.subject, 'New portfolio contact message')
  assert.equal(closed, true)
})

test('a different accepted recipient or a rejected intended recipient never counts as notification success', async () => {
  for (const result of [
    { accepted: [] },
    { accepted: ['someone-else@example.test'] },
    { accepted: ['inbox@example.test'], rejected: ['inbox@example.test'] },
  ]) {
    let closed = false
    await assert.rejects(
      sendContactNotification(contact, {
        configuration: readSmtpConfig(gmailEnvironment),
        transportFactory: () => ({
          async sendMail() {
            return result
          },
          close() {
            closed = true
          },
        }),
      }),
      { message: 'Email notification was not accepted.' },
    )
    assert.equal(closed, true)
  }
})

test('SMTP transport construction and delivery errors expose no provider details or credentials', async () => {
  const privateDetails =
    'fake-app-password smtp://private-user:fake-app-password@private-host visitor@example.test'
  for (const constructionFailure of [true, false]) {
    let closed = false
    await assert.rejects(
      sendContactNotification(contact, {
        configuration: readSmtpConfig(gmailEnvironment),
        transportFactory() {
          if (constructionFailure) throw new Error(privateDetails)
          return {
            async sendMail() {
              throw new Error(privateDetails)
            },
            close() {
              closed = true
            },
          }
        },
      }),
      (error) => {
        assert.equal(error.message, 'Email notification was not accepted.')
        assert.equal(error.stack.includes(privateDetails), false)
        assert.equal(error.cause, undefined)
        return true
      },
    )
    assert.equal(closed, !constructionFailure)
  }
})

test('cleanup failure is sanitized and does not falsely undo an already accepted notification', async (t) => {
  const logs = []
  t.mock.method(console, 'warn', (message) => logs.push(message))
  await sendContactNotification(contact, {
    configuration: readSmtpConfig(gmailEnvironment),
    transportFactory: () => ({
      async sendMail() {
        return { accepted: ['inbox@example.test'] }
      },
      close() {
        throw new Error('private SMTP secret')
      },
    }),
  })
  assert.deepEqual(logs, ['Email transport cleanup unavailable.'])
})
