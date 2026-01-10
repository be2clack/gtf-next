// Re-export Prisma types
export * from '@prisma/client'

// Custom types for the application

export type Locale = 'ru' | 'en' | 'kg' | 'kz' | 'uz' | 'ar'

export interface TranslatableField {
  ru?: string
  en?: string
  kg?: string
  kz?: string
  uz?: string
  ar?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// User session type
export interface SessionUser {
  id: number
  name: string
  email?: string
  phone?: string
  type: 'ADMIN' | 'JUDGE' | 'ARBITER' | 'SPORTSMAN' | 'REPRESENTATIVE' | 'TRAINER'
  federationId?: number
  federationCode?: string
}

// Federation context
export interface FederationContext {
  id: number
  code: string
  name: string
  domain: string
  currency: string
  timezone: string
  languages: string[]
  primaryLanguage: string
  settings: Record<string, unknown>
}

// Competition types
export interface CompetitionFilters {
  status?: string
  level?: string
  federationId?: number
  startDate?: Date
  endDate?: Date
}

// Sportsman types
export interface SportsmanFilters {
  federationId?: number
  clubId?: number
  trainerId?: number
  beltLevel?: number
  gender?: 'male' | 'female'
  ageMin?: number
  ageMax?: number
}

// Belt level helpers
export type BeltLevel = 10 | 9 | 8 | 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 | -1 | -2 | -3 | -4 | -5 | -6 | -7 | -8 | -9

export const BELT_NAMES: Record<number, { ru: string; en: string }> = {
  10: { ru: '10 гып (белый)', en: '10th gup (white)' },
  9: { ru: '9 гып (белый с желтой полосой)', en: '9th gup (white-yellow)' },
  8: { ru: '8 гып (желтый)', en: '8th gup (yellow)' },
  7: { ru: '7 гып (желтый с зеленой полосой)', en: '7th gup (yellow-green)' },
  6: { ru: '6 гып (зеленый)', en: '6th gup (green)' },
  5: { ru: '5 гып (зеленый с синей полосой)', en: '5th gup (green-blue)' },
  4: { ru: '4 гып (синий)', en: '4th gup (blue)' },
  3: { ru: '3 гып (синий с красной полосой)', en: '3rd gup (blue-red)' },
  2: { ru: '2 гып (красный)', en: '2nd gup (red)' },
  1: { ru: '1 гып (красный с черной полосой)', en: '1st gup (red-black)' },
  0: { ru: '1 дан', en: '1st dan' },
  [-1]: { ru: '2 дан', en: '2nd dan' },
  [-2]: { ru: '3 дан', en: '3rd dan' },
  [-3]: { ru: '4 дан', en: '4th dan' },
  [-4]: { ru: '5 дан', en: '5th dan' },
  [-5]: { ru: '6 дан', en: '6th dan' },
  [-6]: { ru: '7 дан', en: '7th dan' },
  [-7]: { ru: '8 дан', en: '8th dan' },
  [-8]: { ru: '9 дан', en: '9th dan' },
}

// Gender helpers
export const GENDER_NAMES = {
  0: { ru: 'Мужской', en: 'Male' },
  1: { ru: 'Женский', en: 'Female' },
} as const
