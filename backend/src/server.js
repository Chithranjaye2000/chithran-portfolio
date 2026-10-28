import { createServer } from 'node:http'
import { readApiConfig } from './config/environment.js'
import { closeDatabasePool } from './config/database.js'
import { closeContactDatabasePool } from './config/contactDatabase.js'

try {
  const { default: app } = await import('./app.js')
  const { port } = readApiConfig()
  const server = createServer(app)
  let stopping = false

  server.on('error', () => {
    console.error('API startup failed. Check the configured port and local environment.')
    process.exitCode = 1
  })
  server.listen(port, '127.0.0.1', () => {
    console.log(`Portfolio API listening at http://127.0.0.1:${port}`)
  })

  function shutdown() {
    if (stopping) return
    stopping = true
    const timeout = setTimeout(() => {
      server.closeAllConnections()
      process.exitCode = 1
    }, 10_000)
    timeout.unref()
    server.close(async () => {
      try {
        const results = await Promise.allSettled([closeDatabasePool(), closeContactDatabasePool()])
        if (results.some((result) => result.status === 'rejected')) throw new Error()
      } catch {
        console.error('Database shutdown could not complete.')
        process.exitCode = 1
      } finally {
        clearTimeout(timeout)
      }
    })
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
} catch {
  console.error('API startup failed. Check backend environment configuration.')
  process.exitCode = 1
}
