import type { Locale, TranslatableField } from '@/types'

/**
 * Get translated value from a translatable field
 */
export function getTranslation(
  field: TranslatableField | string | null | undefined,
  locale: Locale = 'ru',
  fallbackLocale: Locale = 'ru'
): string {
  if (!field) return ''

  // If it's a string, return as is
  if (typeof field === 'string') return field

  // If it's a JSON object, get the translated value
  if (typeof field === 'object') {
    return field[locale] || field[fallbackLocale] || field.ru || field.en || ''
  }

  return ''
}

/**
 * Parse JSON field safely
 */
export function parseJsonField<T>(field: unknown): T | null {
  if (!field) return null

  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T
    } catch {
      return null
    }
  }

  return field as T
}

/**
 * Create a translatable field
 */
export function createTranslatableField(
  value: string,
  locale: Locale = 'ru'
): TranslatableField {
  return { [locale]: value }
}

/**
 * Update a translatable field
 */
export function updateTranslatableField(
  existing: TranslatableField | null,
  value: string,
  locale: Locale
): TranslatableField {
  return {
    ...(existing || {}),
    [locale]: value,
  }
}

/**
 * Get all available translations
 */
export function getAllTranslations(field: TranslatableField | null): Record<Locale, string> {
  const locales: Locale[] = ['ru', 'en', 'kg', 'kz', 'uz', 'ar']
  const result: Record<string, string> = {}

  for (const locale of locales) {
    result[locale] = field?.[locale] || ''
  }

  return result as Record<Locale, string>
}

/**
 * Supported locales configuration
 */
export const SUPPORTED_LOCALES: { code: Locale; name: string; nativeName: string }[] = [
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'kg', name: 'Kyrgyz', nativeName: 'Кыргызча' },
  { code: 'kz', name: 'Kazakh', nativeName: 'Қазақша' },
  { code: 'uz', name: 'Uzbek', nativeName: 'O\'zbek' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
]
