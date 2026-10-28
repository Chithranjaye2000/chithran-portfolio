import './environment.js'
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { isValidEmail } from '../validators/contactValidation.js'

export function readNotificationEnvironment(
  environment = process.env,
  { readSource = () => readFileSync(new URL('../../.env.smtp', import.meta.url), 'utf8') } = {},
) {
  if (environment.NODE_ENV === 'production') return environment
  try {
    // This optional file is a complete local SMTP configuration, never merged with other secrets.
    return { ...parseEnv(readSource()), NODE_ENV: environment.NODE_ENV ?? 'development' }
  } catch (error) {
    if (error.code === 'ENOENT') return environment
    throw new Error('Email notification configuration is unavailable.')
  }
}

function textSetting(environment, name) {
  const value = environment[name]
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new Error('Email notification configuration is unavailable.')
  return value.trim()
}

export function readSmtpConfig(environment = readNotificationEnvironment()) {
  const host = textSetting(environment, 'SMTP_HOST')
  const user = textSetting(environment, 'SMTP_USER')
  const gmail = host?.toLowerCase() === 'smtp.gmail.com'
  const rawPassword = environment.SMTP_PASSWORD
  if (rawPassword !== undefined && typeof rawPassword !== 'string') {
    throw new Error('Email notification configuration is unavailable.')
  }
  // Google displays App Passwords in groups; other providers' passwords remain byte-for-byte intact.
  const password = gmail ? rawPassword?.replaceAll(' ', '') : rawPassword
  const from = textSetting(environment, 'SMTP_FROM') || (gmail ? user : undefined)
  const recipient = textSetting(environment, 'CONTACT_NOTIFICATION_EMAIL')
  const to =
    recipient ??
    (environment.NODE_ENV === 'production' ? undefined : textSetting(environment, 'SMTP_TO'))
  if (!host || !user || !password || !from || !to) return null

  const port = textSetting(environment, 'SMTP_PORT') ?? '587'
  const secure = textSetting(environment, 'SMTP_SECURE') ?? 'false'
  if (
    /[\s/@\\]/u.test(host) ||
    host.includes('://') ||
    /[\r\n]/u.test(user) ||
    !/^\d+$/.test(port) ||
    Number(port) < 1 ||
    Number(port) > 65535 ||
    !['true', 'false'].includes(secure) ||
    !isValidEmail(from) ||
    !isValidEmail(to) ||
    (gmail &&
      (!isValidEmail(user) ||
        from.toLowerCase() !== user.toLowerCase() ||
        !/^[a-z0-9]{16}$/i.test(password) ||
        !((port === '465' && secure === 'true') || (port === '587' && secure === 'false'))))
  ) {
    throw new Error('Email notification configuration is unavailable.')
  }
  return { host, port: Number(port), secure: secure === 'true', user, password, from, to }
}
