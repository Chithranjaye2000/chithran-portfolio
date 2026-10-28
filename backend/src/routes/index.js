import { Router } from 'express'
import { healthController } from '../controllers/healthController.js'
import { createContactRouter } from './contactRoutes.js'
import { createProjectRouter } from './projectRoutes.js'
import { createQaEvidenceRouter } from './qaEvidenceRoutes.js'

export function createApiRouter(dependencies = {}) {
  const router = Router()
  router.get('/health', healthController)
  router.use('/contact', createContactRouter(dependencies.contact))
  router.use('/projects', createProjectRouter(dependencies.projects))
  router.use('/qa-evidence', createQaEvidenceRouter(dependencies.qaEvidence))
  return router
}
