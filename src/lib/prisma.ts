import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPrismaClient() {
  // Use DIRECT_DATABASE_URL for direct connection to Postgres
  const directUrl = process.env.DIRECT_DATABASE_URL

  if (!directUrl) {
    throw new Error('DIRECT_DATABASE_URL environment variable is not set')
  }

  // Create PostgreSQL connection pool
  const pool = globalForPrisma.pool ?? new Pool({
    connectionString: directUrl,
    max: 10,
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pool = pool
  }

  // Create Prisma adapter
  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
