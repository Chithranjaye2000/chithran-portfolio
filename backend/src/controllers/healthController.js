import { getHealthStatus } from '../services/healthService.js'

export function healthController(_request, response) {
  response.set('Cache-Control', 'no-store').status(200).json(getHealthStatus())
}
