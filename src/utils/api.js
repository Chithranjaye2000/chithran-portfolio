export class ApiRequestError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.fields = fields
  }
}

export function resolveApiBase(environment = import.meta.env ?? {}) {
  const value =
    environment.VITE_API_BASE_URL?.trim() ?? (environment.DEV ? 'http://127.0.0.1:3001' : '')
  if (!value) return ''
  try {
    const url = new URL(value)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new Error()
    }
    return value.replace(/\/+$/, '')
  } catch {
    throw new ApiRequestError('The API address is not configured correctly.')
  }
}

export function resolveContactApiBase(environment = import.meta.env ?? {}) {
  return environment.VITE_CONTACT_API_BASE_URL === undefined
    ? resolveApiBase(environment)
    : resolveApiBase({ ...environment, VITE_API_BASE_URL: environment.VITE_CONTACT_API_BASE_URL })
}

export async function requestJson(
  path,
  {
    method = 'GET',
    body,
    signal,
    timeoutMs = 35_000,
    fetcher = globalThis.fetch,
    baseUrl = resolveApiBase(),
  } = {},
) {
  const controller = new AbortController()
  const cancel = () => controller.abort()
  if (signal?.aborted) cancel()
  signal?.addEventListener('abort', cancel, { once: true })
  const timer = setTimeout(cancel, timeoutMs)
  try {
    const response = await fetcher(`${baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    })
    let result
    try {
      result = await response.json()
    } catch {
      throw new ApiRequestError('The API returned an unreadable response.', response.status)
    }
    if (!response.ok) {
      const safeStatuses = [400, 413, 415, 422, 429, 503]
      const message =
        safeStatuses.includes(response.status) && typeof result?.error?.message === 'string'
          ? result.error.message
          : 'The service could not complete the request. Please try again.'
      throw new ApiRequestError(message, response.status, result?.error?.fields ?? {})
    }
    return { result, status: response.status }
  } catch (error) {
    if (error instanceof ApiRequestError) throw error
    if (controller.signal.aborted) {
      throw new ApiRequestError(
        'The request timed out or was cancelled. Its result could not be confirmed.',
      )
    }
    throw new ApiRequestError('The API could not be reached. Please try again later.')
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}

export async function fetchCollection(path, { validateItem = () => true, ...options } = {}) {
  const records = []
  const ids = new Set()
  let page = 1
  let pages = 1
  let total = 0
  let size = 0
  do {
    const separator = path.includes('?') ? '&' : '?'
    const { result } = await requestJson(`${path}${separator}page=${page}&pageSize=50`, options)
    const pagination = result?.pagination
    if (
      !Array.isArray(result?.data) ||
      !pagination ||
      pagination.page !== page ||
      !Number.isSafeInteger(pagination.totalPages) ||
      pagination.totalPages < 0 ||
      !Number.isSafeInteger(pagination.total) ||
      pagination.total < 0 ||
      !Number.isSafeInteger(pagination.pageSize) ||
      pagination.pageSize < 1 ||
      pagination.totalPages !== Math.ceil(pagination.total / pagination.pageSize) ||
      result.data.length > pagination.pageSize ||
      (page > 1 &&
        (pagination.total !== total ||
          pagination.pageSize !== size ||
          pagination.totalPages !== pages)) ||
      result.data.some((item) => !validateItem(item))
    ) {
      throw new ApiRequestError('The portfolio data could not be read. Please try again.')
    }
    for (const item of result.data) {
      if (ids.has(item.id))
        throw new ApiRequestError('The portfolio data could not be read. Please try again.')
      ids.add(item.id)
      records.push(item)
    }
    pages = pagination.totalPages
    total = pagination.total
    size = pagination.pageSize
    page += 1
  } while (page <= pages)
  if (records.length !== total)
    throw new ApiRequestError('The portfolio data could not be read. Please try again.')
  return records
}
