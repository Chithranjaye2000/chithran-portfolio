import { Router } from 'express'
import { createQaEvidenceControllers } from '../controllers/qaEvidenceController.js'

export function createQaEvidenceRouter({ databasePool } = {}) {
  const router = Router()
  const controllers = createQaEvidenceControllers({ databasePool })
  router.get('/', controllers.list)
  router.get('/:id', controllers.detail)
  return router
}
