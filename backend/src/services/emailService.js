import nodemailer from 'nodemailer'
import { readSmtpConfig } from '../config/smtp.js'

export async function sendContactNotification(
  contact,
  { configuration = readSmtpConfig(), transportFactory = nodemailer.createTransport } = {},
) {
  if (!configuration) throw new Error('Email notification is unavailable.')
  const transport = transportFactory({
    host: configuration.host,
    port: configuration.port,
    secure: configuration.secure,
    requireTLS: !configuration.secure,
    auth: { user: configuration.user, pass: configuration.password },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10_000,
  })
  try {
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
    if (!Array.isArray(result.accepted) || !result.accepted.length) {
      throw new Error('Email notification was not accepted.')
    }
  } finally {
    transport.close?.()
  }
}
