import cors from 'cors'

export function createCorsMiddleware(frontendOrigin, additionalOrigins = []) {
  const allowedOrigins = new Set([frontendOrigin, ...additionalOrigins])
  return cors({
    origin(origin, callback) {
      if (!origin) return callback(null, false)
      if (allowedOrigins.has(origin)) return callback(null, true)
      const error = new Error('Origin not permitted.')
      error.code = 'ORIGIN_NOT_PERMITTED'
      callback(error)
    },
    methods: ['GET', 'HEAD', 'OPTIONS', 'POST'],
    credentials: false,
    maxAge: 600,
  })
}
