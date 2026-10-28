import { ApiError } from '../middleware/apiError.js'

export const contactLimits = Object.freeze({ name: 120, email: 254, subject: 200, message: 5000 })
const allowedFields = new Set(Object.keys(contactLimits))
const loneSurrogate = /[\ud800-\udfff]/u

function containsControls(value, multiline) {
  return [...value].some((character) => {
    const point = character.codePointAt(0)
    const permittedWhitespace = multiline && [9, 10, 13].includes(point)
    return (point < 32 && !permittedWhitespace) || (point >= 127 && point <= 159)
  })
}

export function isValidEmail(value) {
  if (typeof value !== 'string' || value.length > contactLimits.email) return false
  const parts = value.split('@')
  if (parts.length !== 2) return false
  const [local, domain] = parts
  if (
    !local ||
    local.length > 64 ||
    local.startsWith('.') ||
    local.endsWith('.') ||
    local.includes('..') ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)
  ) {
    return false
  }
  const labels = domain.split('.')
  return (
    domain.length <= 253 &&
    labels.length >= 2 &&
    labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)) &&
    /^[a-z]{2,63}$/i.test(labels.at(-1))
  )
}

export function validateContactInput(body) {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(body))
  ) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', {
      _form: 'Submit a JSON object containing the contact fields.',
    })
  }

  const fields = {}
  if (Object.keys(body).some((field) => !allowedFields.has(field))) {
    fields._form = 'Only name, email, subject, and message are accepted.'
  }
  const normalized = {}
  for (const field of allowedFields) {
    const original = body[field]
    if (field === 'subject' && original === undefined) {
      normalized.subject = null
      continue
    }
    if (typeof original !== 'string') {
      fields[field] = field === 'subject' ? 'Subject must be text.' : `Enter your ${field}.`
      continue
    }
    if (containsControls(original, field === 'message') || loneSurrogate.test(original)) {
      fields[field] = 'Remove unsupported control characters.'
      continue
    }
    let value = original.normalize('NFC').replace(/\r\n?/g, '\n').trim()
    if (field === 'name') value = value.replace(/ {2,}/g, ' ')
    if (field === 'email') {
      const separator = value.lastIndexOf('@')
      if (separator !== -1)
        value = value.slice(0, separator + 1) + value.slice(separator + 1).toLowerCase()
    }
    if (!value && field !== 'subject') {
      fields[field] = `Enter your ${field}.`
    } else if ([...value].length > contactLimits[field]) {
      fields[field] = `Use ${contactLimits[field]} characters or fewer.`
    } else if (field === 'email' && !isValidEmail(value)) {
      fields.email = 'Enter a valid email address.'
    }
    normalized[field] = field === 'subject' && !value ? null : value
  }
  if (Object.keys(fields).length) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', fields)
  }
  return normalized
}
