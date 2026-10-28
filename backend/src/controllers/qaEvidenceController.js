import { ApiError } from '../middleware/apiError.js'
import { getQaEvidenceById, listQaEvidence } from '../services/qaEvidenceService.js'
import { validateCatalogueId, validateCatalogueQuery } from '../validators/catalogueValidation.js'

export function createQaEvidenceControllers(dependencies = {}) {
  return {
    async list(request, response) {
      const query = validateCatalogueQuery(request.query, {
        category: 80,
        tool: 100,
        context: 255,
      })
      const result = await listQaEvidence(query, dependencies)
      response.set('Cache-Control', 'no-store').json(result)
    },
    async detail(request, response) {
      const id = validateCatalogueId(request.params.id)
      const report = await getQaEvidenceById(id, dependencies)
      if (!report) {
        throw new ApiError(404, 'QA_EVIDENCE_NOT_FOUND', 'No public QA evidence was found.')
      }
      response.set('Cache-Control', 'no-store').json({ data: report })
    },
  }
}
