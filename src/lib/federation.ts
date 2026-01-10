import { headers } from 'next/headers'
import prisma from './prisma'
import type { Federation } from '@prisma/client'

export interface FederationContext {
  federation: Federation | null
  isGlobal: boolean
  locale: string
}

/**
 * Get federation from request headers (set by middleware)
 */
export async function getFederationContext(): Promise<FederationContext> {
  const headersList = await headers()
  const federationCode = headersList.get('x-federation-code')
  const locale = headersList.get('x-locale') || 'ru'

  if (!federationCode || federationCode === 'global') {
    return {
      federation: null,
      isGlobal: true,
      locale,
    }
  }

  const federation = await prisma.federation.findFirst({
    where: {
      OR: [
        { code: federationCode },
        { domain: { contains: federationCode } },
      ],
      status: 'ACTIVE',
      deletedAt: null,
    },
    include: {
      country: true,
    },
  })

  return {
    federation,
    isGlobal: !federation,
    locale: federation?.primaryLanguage || locale,
  }
}

/**
 * Get federation by code
 */
export async function getFederationByCode(code: string): Promise<Federation | null> {
  return prisma.federation.findFirst({
    where: {
      code: code.toLowerCase(),
      status: 'ACTIVE',
      deletedAt: null,
    },
  })
}

/**
 * Get federation by domain
 */
export async function getFederationByDomain(domain: string): Promise<Federation | null> {
  // Extract subdomain from domain (e.g., kg.gtf.global -> kg)
  const subdomain = extractSubdomain(domain)

  if (!subdomain || subdomain === 'www') {
    return null
  }

  return prisma.federation.findFirst({
    where: {
      OR: [
        { code: subdomain },
        { domain: domain },
        { customDomain: domain },
      ],
      status: 'ACTIVE',
      deletedAt: null,
    },
  })
}

/**
 * Extract subdomain from hostname
 */
export function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0]

  // Check for localhost
  if (host === 'localhost' || host === '127.0.0.1') {
    return null
  }

  // Split by dots
  const parts = host.split('.')

  // If we have at least 3 parts (subdomain.domain.tld), return the subdomain
  if (parts.length >= 3) {
    // Exclude www
    if (parts[0] === 'www') {
      return parts.length > 3 ? parts[1] : null
    }
    return parts[0]
  }

  return null
}

/**
 * Get all active federations
 */
export async function getAllFederations(): Promise<Federation[]> {
  return prisma.federation.findMany({
    where: {
      status: 'ACTIVE',
      deletedAt: null,
    },
    orderBy: {
      name: 'asc',
    },
  })
}

/**
 * Build federation URL
 */
export function buildFederationUrl(
  federation: Federation | null,
  path: string = '/',
  baseUrl?: string
): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!federation) {
    return `${base}${path}`
  }

  // For production with subdomains
  if (process.env.NODE_ENV === 'production' && federation.domain) {
    return `https://${federation.domain}${path}`
  }

  // For development or fallback
  return `${base}/${federation.code}${path}`
}
