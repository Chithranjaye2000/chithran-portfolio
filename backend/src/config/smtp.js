import './environment.js'
import { isValidEmail } from '../validators/contactValidation.js'

export function readSmtpConfig(environment = process.env) {
  const host = environment.SMTP_HOST?.trim()
  const user = environment.SMTP_USER?.trim()
  const password = environment.SMTP_PASSWORD
  const from = environment.SMTP_FROM?.trim()
  const to = environment.SMTP_TO?.trim()
  if (!host || !user || !password || !from || !to) return null

  const port = environment.SMTP_PORT ?? '587'
  const secure = environment.SMTP_SECURE ?? 'false'
  if (
    /[\s/@\\]/u.test(host) ||
    host.includes('://') ||
    /[\r\n]/u.test(user) ||
    !/^\d+$/.test(port) ||
    Number(port) < 1 ||
    Number(port) > 65535 ||
    !['true', 'false'].includes(secure) ||
    !isValidEmail(from) ||
    !isValidEmail(to)
  ) {
    throw new Error('Email notification configuration is unavailable.')
  }
  return { host, port: Number(port), secure: secure === 'true', user, password, from, to }
}
