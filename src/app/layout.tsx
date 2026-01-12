import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { I18nProvider } from '@/lib/i18n'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getCurrentUser } from '@/lib/auth'
import { getFederationContext } from '@/lib/federation'
import { getUrlPrefix } from '@/lib/url'
import { getFederationLogoUrl } from '@/lib/utils/images'
import type { Locale } from '@/types'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'GTF - Global Taekwondo Federation',
    template: '%s | GTF',
  },
  description: 'Международная федерация Таеквон-До ИТФ. Соревнования, рейтинги, клубы и спортсмены.',
  keywords: ['taekwondo', 'ITF', 'martial arts', 'federation', 'competition', 'rating'],
  authors: [{ name: 'GTF' }],
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'GTF - Global Taekwondo Federation',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [user, { federation, locale }, urlPrefix] = await Promise.all([
    getCurrentUser(),
    getFederationContext(),
    getUrlPrefix(),
  ])

  return (
    <html lang={locale || 'ru'} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
        <I18nProvider initialLocale={(locale || 'ru') as Locale}>
        <Header
          user={user ? {
            id: user.id,
            name: user.name,
            type: user.type,
            federationId: user.federationId,
            federation: federation ? { code: federation.code, name: federation.name } : null,
          } : null}
          federation={federation ? {
            code: federation.code,
            name: federation.name,
            logo: getFederationLogoUrl(federation.logo),
            siteTitle: federation.siteTitle as Record<string, string> | null,
          } : null}
          urlPrefix={urlPrefix}
          locale={locale}
        />
        <main className="flex-1">
          {children}
        </main>
        <Footer
          federation={federation ? {
            name: federation.name,
            contactEmail: federation.contactEmail,
            contactPhone: federation.contactPhone,
            instagram: federation.instagram,
            facebook: federation.facebook,
            youtube: federation.youtube,
          } : null}
        />
        <Toaster position="top-right" richColors />
        </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}