'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

interface FooterProps {
  federation?: {
    name: string
    contactEmail?: string | null
    contactPhone?: string | null
    instagram?: string | null
    facebook?: string | null
    youtube?: string | null
  } | null
}

export function Footer({ federation }: FooterProps) {
  const { t } = useI18n()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('footer.about')}</h3>
            <p className="text-sm text-muted-foreground">
              {federation?.name || 'Global Taekwondo Federation'} - {t('footer.aboutText')}
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('footer.navigation')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/competitions" className="text-muted-foreground hover:text-foreground">
                  {t('nav.competitions')}
                </Link>
              </li>
              <li>
                <Link href="/ratings" className="text-muted-foreground hover:text-foreground">
                  {t('nav.ratings')}
                </Link>
              </li>
              <li>
                <Link href="/clubs" className="text-muted-foreground hover:text-foreground">
                  {t('nav.clubs')}
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-muted-foreground hover:text-foreground">
                  {t('nav.news')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('footer.contacts')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {federation?.contactEmail && (
                <li>
                  <a href={`mailto:${federation.contactEmail}`} className="hover:text-foreground">
                    {federation.contactEmail}
                  </a>
                </li>
              )}
              {federation?.contactPhone && (
                <li>
                  <a href={`tel:${federation.contactPhone}`} className="hover:text-foreground">
                    {federation.contactPhone}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('footer.social')}</h3>
            <div className="flex space-x-4">
              {federation?.instagram && (
                <a
                  href={`https://instagram.com/${federation.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Instagram
                </a>
              )}
              {federation?.facebook && (
                <a
                  href={federation.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Facebook
                </a>
              )}
              {federation?.youtube && (
                <a
                  href={federation.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  YouTube
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} {federation?.name || 'GTF'}. {t('section.allRights')}.</p>
        </div>
      </div>
    </footer>
  )
}
