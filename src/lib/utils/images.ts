/**
 * Image URL utilities for GTF
 * Handles both local and production image paths
 * Fixes subdomain URLs (kg.gtf.global -> gtf.global)
 */

const PRODUCTION_URL = 'https://gtf.global'

/**
 * Fix subdomain URLs - kg.gtf.global, kz.gtf.global, etc. -> gtf.global
 */
function fixSubdomainUrl(url: string): string {
  // Fix subdomain URLs (kg.gtf.global -> gtf.global)
  return url.replace(/https?:\/\/\w+\.gtf\.global\//, `${PRODUCTION_URL}/`)
}

/**
 * Fix sportsman photo URL - add /sportsman/ directory if missing
 */
function fixSportsmanUrl(url: string): string {
  const fixed = fixSubdomainUrl(url)
  // If URL is /uploads/xxx.jpg, change to /uploads/sportsman/xxx.jpg
  return fixed.replace(/\/uploads\/([^/]+\.(jpg|jpeg|png|gif))$/i, '/uploads/sportsman/$1')
}

/**
 * Fix trainer photo URL - add /trainer/ directory if missing
 */
function fixTrainerUrl(url: string): string {
  const fixed = fixSubdomainUrl(url)
  // If URL is /uploads/xxx.jpg, change to /uploads/trainer/xxx.jpg
  return fixed.replace(/\/uploads\/([^/]+\.(jpg|jpeg|png|gif))$/i, '/uploads/trainer/$1')
}

/**
 * Get the full URL for a federation logo
 * Fixes incorrect subdomain URLs stored in database
 */
export function getFederationLogoUrl(logo: string | null | undefined): string | null {
  if (!logo) return null
  if (logo.startsWith('http')) return fixSubdomainUrl(logo)
  return `${PRODUCTION_URL}/uploads/federations/${logo}`
}

/**
 * Get the full URL for a competition photo/poster
 */
export function getCompetitionPhotoUrl(photo: string | null | undefined): string | null {
  if (!photo) return null
  if (photo.startsWith('http')) return fixSubdomainUrl(photo)
  if (photo.includes('/')) return `${PRODUCTION_URL}/${photo}`
  return `${PRODUCTION_URL}/storage/competitions/${photo}`
}

/**
 * Get the full URL for a news photo
 */
export function getNewsPhotoUrl(photo: string | null | undefined): string | null {
  if (!photo) return null
  if (photo.startsWith('http')) return fixSubdomainUrl(photo)
  if (photo.includes('/')) return `${PRODUCTION_URL}/${photo}`
  return `${PRODUCTION_URL}/uploads/news/${photo}`
}

/**
 * Get the full URL for a sportsman photo
 */
export function getSportsmanPhotoUrl(photo: string | null | undefined): string | null {
  if (!photo) return null
  if (photo.startsWith('http')) return fixSportsmanUrl(photo)
  if (photo.includes('/')) return `${PRODUCTION_URL}/${photo}`
  return `${PRODUCTION_URL}/uploads/sportsman/${photo}`
}

/**
 * Get the full URL for a trainer photo
 */
export function getTrainerPhotoUrl(photo: string | null | undefined): string | null {
  if (!photo) return null
  if (photo.startsWith('http')) return fixTrainerUrl(photo)
  if (photo.includes('/')) return `${PRODUCTION_URL}/${photo}`
  return `${PRODUCTION_URL}/uploads/trainer/${photo}`
}

/**
 * Get the full URL for a club logo
 * Fixes incorrect subdomain URLs stored in database (kg.gtf.global -> gtf.global)
 */
export function getClubLogoUrl(logo: string | null | undefined): string | null {
  if (!logo) return null
  if (logo.startsWith('http')) return fixSubdomainUrl(logo)
  if (logo.includes('/')) return `${PRODUCTION_URL}/${logo}`
  return `${PRODUCTION_URL}/uploads/club/${logo}`
}

/**
 * Get the full URL for a judge photo
 */
export function getJudgePhotoUrl(photo: string | null | undefined): string | null {
  if (!photo) return null
  if (photo.startsWith('http')) return fixSubdomainUrl(photo)
  if (photo.includes('/')) return `${PRODUCTION_URL}/${photo}`
  return `${PRODUCTION_URL}/storage/judges/${photo}`
}

/**
 * Get the full URL for a hero background
 */
export function getHeroBackgroundUrl(background: string | null | undefined): string {
  const defaultBg = 'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=1920&q=80'
  if (!background) return defaultBg
  if (background.startsWith('http')) return fixSubdomainUrl(background)
  if (background.includes('/')) return `${PRODUCTION_URL}/${background}`
  return `${PRODUCTION_URL}/uploads/federations/${background}`
}

/**
 * Get the full URL for the main site logo
 */
export function getSiteLogoUrl(logo: string | null | undefined): string | null {
  if (!logo) return '/logo.png'
  if (logo.startsWith('http')) return fixSubdomainUrl(logo)
  if (logo.includes('/')) return `${PRODUCTION_URL}/${logo}`
  return `${PRODUCTION_URL}/uploads/settings/${logo}`
}
