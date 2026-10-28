import mysql from 'mysql2/promise'
import { readDatabaseConfig } from './environment.js'

let pool

export function createDatabasePool(configuration = readDatabaseConfig()) {
  return mysql.createPool({
    ...configuration,
    charset: 'utf8mb4',
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 60_000,
    queueLimit: 20,
    connectTimeout: 5_000,
    enableKeepAlive: true,
    multipleStatements: false,
  })
}

// Pool creation is lazy: importing the Express app neither connects nor requires DB credentials.
export function getDatabasePool() {
  pool ??= createDatabasePool()
  return pool
}

export async function closeDatabasePool() {
  const current = pool
  pool = undefined
  if (current) await current.end()
}
