import { headers } from 'next/headers'

/**
 * Get URL prefix for federation routes
 * - If accessing via subdomain (kg.gtf.global), returns empty string (no prefix needed)
 * - If accessing via path (/kg/...), returns the federation code prefix (e.g., '/kg')
 */
export async function getUrlPrefix(): Promise<string> {
  const headersList = await headers()
  const hostname = headersList.get('host') || ''
  const pathname = headersList.get('x-pathname') || ''

  // Check if accessing via subdomain
  const subdomain = extractSubdomain(hostname)
  if (subdomain && isValidFederationCode(subdomain)) {
    // Subdomain access - no prefix needed
    return ''
  }

  // Check if accessing via path prefix
  const pathParts = pathname.split('/').filter(Boolean)
  if (pathParts[0] && isValidFederationCode(pathParts[0])) {
    // Path-based access - return prefix
    return `/${pathParts[0]}`
  }

  // Global site - no prefix
  return ''
}

/**
 * Check if a code is a valid federation code
 */
export function isValidFederationCode(code: string): boolean {
  const VALID_CODES = ['kg', 'kz', 'uz', 'ru', 'ae', 'tj', 'tm']
  return VALID_CODES.includes(code.toLowerCase())
}

/**
 * Extract subdomain from hostname
 */
function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0]

  if (host === 'localhost' || host === '127.0.0.1') {
    return null
  }

  const parts = host.split('.')
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0]
  }

  return null
}

/**
 * Build full URL with proper prefix
 */
export function buildUrl(path: string, prefix: string = ''): string {
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  return prefix + path
}
