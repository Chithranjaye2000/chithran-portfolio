import { Router } from 'express'
import { createContactController } from '../controllers/contactController.js'
import { createContactRateLimiter } from '../middleware/contactRateLimit.js'

export function createContactRouter({ databasePool, notify, rateLimiter } = {}) {
  const router = Router()
  router.post(
    '/',
    rateLimiter ?? createContactRateLimiter(),
    createContactController({ databasePool, notify }),
  )
  return router
}
