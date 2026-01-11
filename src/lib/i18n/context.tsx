'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Locale } from '@/types'
import { translations, t as translate, SUPPORTED_LOCALES } from './translations'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  locales: typeof SUPPORTED_LOCALES
}

const I18nContext = createContext<I18nContextType | null>(null)

const LOCALE_COOKIE_NAME = 'locale'

export function I18nProvider({
  children,
  initialLocale = 'ru'
}: {
  children: ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  // Read locale from cookie on mount
  useEffect(() => {
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${LOCALE_COOKIE_NAME}=`))
      ?.split('=')[1] as Locale | undefined

    if (cookieLocale && SUPPORTED_LOCALES.some(l => l.code === cookieLocale)) {
      setLocaleState(cookieLocale)
    }
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    // Set cookie for 1 year
    document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    // Refresh page to apply server-side locale changes
    window.location.reload()
  }, [])

  const t = useCallback((key: string) => {
    return translate(key, locale)
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, locales: SUPPORTED_LOCALES }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export function useTranslation() {
  return useI18n()
}
