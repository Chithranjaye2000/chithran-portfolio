export const contactFieldLimits = { name: 120, email: 254, subject: 200, message: 5000 }

export function validateContact(values) {
  const normalized = Object.fromEntries(
    Object.keys(contactFieldLimits).map((key) => [
      key,
      typeof values[key] === 'string' ? values[key].normalize('NFC').trim() : '',
    ]),
  )
  const errors = {}
  for (const [key, maximum] of Object.entries(contactFieldLimits)) {
    if (!normalized[key] && key !== 'subject') errors[key] = `Enter your ${key}.`
    else if ([...normalized[key]].length > maximum)
      errors[key] = `Use ${maximum} characters or fewer.`
  }
  if (normalized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    errors.email = 'Enter a valid email address.'
  }
  return { values: normalized, errors }
}

export function confirmedContactResult(response) {
  if (
    response.status !== 201 ||
    response.result?.data?.saved !== true ||
    !['sent', 'unavailable'].includes(response.result.data.notification)
  ) {
    throw new Error('The message could not be confirmed as saved. Please try again later.')
  }
  return response.result.data.notification === 'sent'
    ? 'Your message was saved. Thank you for getting in touch.'
    : 'Your message was saved. The email notification is currently unavailable.'
}
