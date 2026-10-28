import { ApiError } from '../middleware/apiError.js'
import { validateContactInput } from '../validators/contactValidation.js'
import { saveContactMessage } from '../services/contactService.js'

export function createContactController(dependencies = {}) {
  return async function contactController(request, response) {
    if (!request.is('application/json')) {
      throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send the contact form as JSON.')
    }
    const contact = validateContactInput(request.body)
    const data = await saveContactMessage(contact, dependencies)
    response
      .set('Cache-Control', 'no-store')
      .status(201)
      .json({
        data,
        message:
          data.notification === 'sent'
            ? 'Your message was saved. Thank you for getting in touch.'
            : 'Your message was saved. The email notification is currently unavailable.',
      })
  }
}
