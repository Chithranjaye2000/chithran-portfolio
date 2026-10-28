import { ApiError } from '../middleware/apiError.js'
import { getProjectById, listProjects } from '../services/projectService.js'
import { validateCatalogueId, validateCatalogueQuery } from '../validators/catalogueValidation.js'

export function createProjectControllers(dependencies = {}) {
  return {
    async list(request, response) {
      const query = validateCatalogueQuery(request.query, { category: 80 })
      const result = await listProjects(query, dependencies)
      response.set('Cache-Control', 'no-store').json(result)
    },
    async detail(request, response) {
      const id = validateCatalogueId(request.params.id)
      const project = await getProjectById(id, dependencies)
      if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'No public project was found.')
      response.set('Cache-Control', 'no-store').json({ data: project })
    },
  }
}
