import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Supported locales
const LOCALES = ['ru', 'en', 'kg', 'kz', 'uz', 'ar']
const DEFAULT_LOCALE = 'ru'

// Federation codes that are valid subdomains
const VALID_FEDERATION_CODES = ['kg', 'kz', 'uz', 'ru', 'ae']

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl

  // Skip static files and API routes that don't need federation context
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/health') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  // Extract federation code from subdomain or path
  let federationCode: string | null = null
  let locale = DEFAULT_LOCALE

  // Check subdomain first (e.g., kg.gtf.global)
  const subdomain = extractSubdomain(hostname)
  if (subdomain && VALID_FEDERATION_CODES.includes(subdomain)) {
    federationCode = subdomain
  }

  // Check path prefix (e.g., /kg/competitions)
  const pathParts = pathname.split('/').filter(Boolean)
  if (pathParts[0] && VALID_FEDERATION_CODES.includes(pathParts[0])) {
    federationCode = pathParts[0]
  }

  // Get locale from header or cookie
  const acceptLanguage = request.headers.get('accept-language')
  const localeCookie = request.cookies.get('locale')?.value

  if (localeCookie && LOCALES.includes(localeCookie)) {
    locale = localeCookie
  } else if (acceptLanguage) {
    const preferredLocale = acceptLanguage.split(',')[0].split('-')[0]
    if (LOCALES.includes(preferredLocale)) {
      locale = preferredLocale
    }
  }

  // Create response with federation context headers
  const response = NextResponse.next()

  // Set federation context headers for use in server components
  response.headers.set('x-federation-code', federationCode || 'global')
  response.headers.set('x-locale', locale)
  response.headers.set('x-pathname', pathname)

  return response
}

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

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
