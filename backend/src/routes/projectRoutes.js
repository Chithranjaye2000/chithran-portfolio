import { Router } from 'express'
import { createProjectControllers } from '../controllers/projectController.js'

export function createProjectRouter({ databasePool } = {}) {
  const router = Router()
  const controllers = createProjectControllers({ databasePool })
  router.get('/', controllers.list)
  router.get('/:id', controllers.detail)
  return router
}
