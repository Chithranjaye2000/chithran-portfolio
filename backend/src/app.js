import express from 'express'
import { readApiConfig } from './config/environment.js'
import { createApiRouter } from './routes/index.js'
import { createCorsMiddleware } from './middleware/cors.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

export function createApp(configuration = readApiConfig(), dependencies = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.use(createCorsMiddleware(configuration.frontendOrigin, configuration.additionalOrigins))
  app.use(express.json({ limit: '32kb', strict: true }))
  app.use('/api', createApiRouter(dependencies))
  app.use(notFound)
  app.use(errorHandler)
  return app
}

// Vercel Services imports this handler; only server.js opens a local development listener.
export default createApp()
