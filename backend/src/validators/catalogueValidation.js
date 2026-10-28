import { ApiError } from '../middleware/apiError.js'

const maximumId = 18446744073709551615n

function hasControlCharacters(value) {
  return [...value].some((character) => {
    const code = character.codePointAt(0)
    return code < 32 || code === 127
  })
}

function invalidQuery() {
  throw new ApiError(400, 'INVALID_QUERY', 'Unsupported or invalid query parameters.')
}

function positiveInteger(value, fallback, maximum) {
  if (value === undefined) return fallback
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) invalidQuery()
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number > maximum) invalidQuery()
  return number
}

export function validateCatalogueQuery(query, filterLimits = {}) {
  if (!query || typeof query !== 'object' || Array.isArray(query)) invalidQuery()
  const allowed = new Set(['page', 'pageSize', ...Object.keys(filterLimits)])
  if (Object.keys(query).some((key) => !allowed.has(key))) invalidQuery()
  const filters = {}
  for (const [name, limit] of Object.entries(filterLimits)) {
    if (query[name] === undefined) continue
    if (typeof query[name] !== 'string' || hasControlCharacters(query[name])) {
      invalidQuery()
    }
    const value = query[name].trim()
    if (!value || [...value].length > limit) {
      invalidQuery()
    }
    filters[name] = value
  }
  return {
    ...filters,
    page: positiveInteger(query.page, 1, 10_000),
    pageSize: positiveInteger(query.pageSize, 20, 50),
  }
}

export function validateCatalogueId(value) {
  if (typeof value !== 'string' || !/^[1-9]\d{0,19}$/.test(value) || BigInt(value) > maximumId) {
    throw new ApiError(400, 'INVALID_IDENTIFIER', 'Enter a valid item identifier.')
  }
  return value
}

export function safeExternalUrl(value) {
  if (typeof value !== 'string' || !value || hasControlCharacters(value) || /[\s\\]/u.test(value)) {
    return null
  }
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return null
    const hostname = url.hostname.toLowerCase()
    if (
      !hostname.includes('.') ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      /^(?:127\.|0\.|10\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(hostname)
    ) {
      return null
    }
    return value
  } catch {
    return null
  }
}

export function safePublicImageUrl(value) {
  if (safeExternalUrl(value)) return value
  if (typeof value !== 'string' || !value.startsWith('/images/')) return null
  try {
    const path = decodeURIComponent(value)
    if (
      hasControlCharacters(path) ||
      /[\\?#]/u.test(path) ||
      path.split('/').some((part) => part === '.' || part === '..')
    ) {
      return null
    }
    return value
  } catch {
    return null
  }
}

export function stringArray(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}
