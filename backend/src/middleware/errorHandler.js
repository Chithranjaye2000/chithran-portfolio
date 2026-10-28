import { ApiError } from './apiError.js'

export function notFound(_request, response) {
  response.status(404).json({ error: { code: 'NOT_FOUND', message: 'API route not found.' } })
}

export function errorHandler(error, _request, response, next) {
  if (response.headersSent) return next(error)

  let status = 500
  let code = 'INTERNAL_ERROR'
  let message = 'An unexpected API error occurred.'
  if (error instanceof ApiError) {
    status = error.status
    code = error.code
    message = error.message
  } else if (error.type === 'entity.parse.failed') {
    status = 400
    code = 'INVALID_JSON'
    message = 'Request body must contain valid JSON.'
  } else if (error.type === 'entity.too.large') {
    status = 413
    code = 'BODY_TOO_LARGE'
    message = 'Request body exceeds the permitted size.'
  } else if (error.code === 'ORIGIN_NOT_PERMITTED') {
    status = 403
    code = 'ORIGIN_NOT_PERMITTED'
    message = 'Origin not permitted.'
  }
  if (status === 500) console.error('API request failed.')
  const body = { code, message }
  if (error instanceof ApiError && error.fields) body.fields = error.fields
  response.status(status).json({ error: body })
}
