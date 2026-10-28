import { getContactDatabasePool } from '../config/contactDatabase.js'
import { ApiError } from '../middleware/apiError.js'
import { sendContactNotification } from './emailService.js'

export async function saveContactMessage(
  contact,
  { databasePool, notify = sendContactNotification } = {},
) {
  try {
    const [result] = await (databasePool ?? getContactDatabasePool()).execute(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [contact.name, contact.email, contact.subject, contact.message],
    )
    if (result.affectedRows !== 1) throw new Error()
  } catch {
    throw new ApiError(
      503,
      'DATABASE_UNAVAILABLE',
      'Your message could not be saved right now. Please try again later.',
    )
  }

  let notification = 'sent'
  try {
    await notify(contact)
  } catch {
    notification = 'unavailable'
    console.warn('Contact notification unavailable; the message was saved.')
  }
  return { saved: true, notification }
}
