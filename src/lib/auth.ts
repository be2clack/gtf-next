import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import prisma from './prisma'
import type { UserType } from '@prisma/client'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'your-secret-key'
)

export interface AuthUser {
  id: number
  name: string
  phone: string | null
  type: UserType
  federationId: number | null
  federationCode?: string
}

/**
 * Get current authenticated user from request
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    return {
      id: payload.userId as number,
      name: payload.name as string,
      phone: payload.phone as string | null,
      type: payload.type as UserType,
      federationId: payload.federationId as number | null,
      federationCode: payload.federationCode as string | undefined,
    }
  } catch {
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Check if user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.type === 'ADMIN'
}

/**
 * Check if user is federation admin
 */
export async function isFederationAdmin(federationId?: number): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user || user.type !== 'ADMIN') {
    return false
  }

  if (federationId) {
    return user.federationId === federationId
  }

  return user.federationId !== null
}

/**
 * Check if user is super admin (no federation)
 */
export async function isSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.type === 'ADMIN' && user.federationId === null
}

/**
 * Get full user with relations
 */
export async function getFullUser(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      federation: true,
    },
  })
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}

/**
 * Require admin role - throws if not admin
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()

  if (user.type !== 'ADMIN') {
    throw new Error('Admin access required')
  }

  return user
}
