import nodemailer from 'nodemailer'
import { readSmtpConfig } from '../config/smtp.js'

export async function sendContactNotification(
  contact,
  { configuration = readSmtpConfig(), transportFactory = nodemailer.createTransport } = {},
) {
  if (!configuration) throw new Error('Email notification is unavailable.')
  let transport
  try {
    transport = transportFactory({
      host: configuration.host,
      port: configuration.port,
      secure: configuration.secure,
      requireTLS: !configuration.secure,
      tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2', servername: configuration.host },
      auth: { user: configuration.user, pass: configuration.password },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10_000,
      logger: false,
      debug: false,
    })
    const result = await transport.sendMail({
      from: { name: 'Portfolio contact notifications', address: configuration.from },
      to: configuration.to,
      replyTo: { name: contact.name, address: contact.email },
      subject: 'New portfolio contact message',
      text: [
        'A contact message was saved in your portfolio database.',
        '',
        `Name: ${contact.name}`,
        `Email: ${contact.email}`,
        `Subject: ${contact.subject || '(not provided)'}`,
        '',
        contact.message,
      ].join('\n'),
    })
    const matchesRecipient = (address) =>
      typeof address === 'string' && address.toLowerCase() === configuration.to.toLowerCase()
    if (
      !Array.isArray(result.accepted) ||
      !result.accepted.some(matchesRecipient) ||
      result.rejected?.some(matchesRecipient)
    ) {
      throw new Error('Email notification was not accepted.')
    }
  } catch {
    // SMTP errors may include credentials, recipient addresses, or message contents.
    throw new Error('Email notification was not accepted.')
  } finally {
    try {
      transport?.close?.()
    } catch {
      console.warn('Email transport cleanup unavailable.')
    }
  }
}
