'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, User, LogOut, Settings, Trophy, Building2, Globe } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

interface HeaderProps {
  user?: {
    id: number
    name: string
    type: string
    federation?: {
      code: string
      name: string
    } | null
  } | null
  federation?: {
    code: string
    name: string
    logo?: string | null
    siteTitle?: Record<string, string> | null
  } | null
  urlPrefix?: string
  locale?: string
}

export function Header({ user, federation, urlPrefix = '' }: HeaderProps) {
  const pathname = usePathname()
  const { t, locale, setLocale, locales } = useI18n()

  // Build navigation with proper URL prefix
  const navigation = [
    { name: t('nav.home'), href: urlPrefix || '/', icon: null },
    { name: t('nav.competitions'), href: `${urlPrefix}/competitions`, icon: Trophy },
    { name: t('nav.ratings'), href: `${urlPrefix}/ratings`, icon: null },
    { name: t('nav.clubs'), href: `${urlPrefix}/clubs`, icon: Building2 },
    { name: t('nav.news'), href: `${urlPrefix}/news`, icon: null },
  ]

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' })
    window.location.href = urlPrefix || '/'
  }

  const currentLocale = locales.find(l => l.code === locale)

  // Get federation logo URL - fix incorrect subdomain URLs (kg.gtf.global -> gtf.global)
  const federationLogo = federation?.logo
    ? (federation.logo.startsWith('http')
        ? federation.logo.replace(/https?:\/\/\w+\.gtf\.global\/uploads\//, 'https://gtf.global/uploads/federations/')
        : `https://gtf.global/uploads/federations/${federation.logo}`)
    : null

  // Get federation title based on locale
  const getFederationTitle = () => {
    if (!federation) return null

    if (federation.siteTitle) {
      // Try locale-specific title
      const localeKey = locale === 'kg' ? 'ky' : locale === 'kz' ? 'kk' : locale
      return federation.siteTitle[localeKey] || federation.siteTitle['ru'] || federation.name
    }

    return federation.name
  }

  const federationTitle = getFederationTitle()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            {/* Mobile Logo Section */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <Image
                src="/logo.png"
                alt="GTF"
                width={40}
                height={40}
                className="rounded-full"
              />
              {federationLogo && (
                <Image
                  src={federationLogo}
                  alt={federation?.name || 'Federation'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
            </div>
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo Section */}
        <Link href={urlPrefix || '/'} className="flex items-center gap-3 mr-6">
          {/* GTF Global Logo */}
          <Image
            src="/logo.png"
            alt="GTF"
            width={36}
            height={36}
            className="rounded-full"
          />

          {/* Federation Logo (if exists) */}
          {federationLogo && (
            <Image
              src={federationLogo}
              alt={federation?.name || 'Federation'}
              width={36}
              height={36}
              className="rounded-full"
            />
          )}

          {/* Title */}
          <div className="hidden sm:flex flex-col">
            <span className="text-xs text-muted-foreground leading-tight">
              Taekwon-Do Federation
            </span>
            <span className="font-semibold leading-tight">
              {federationTitle || 'GTF Global'}
            </span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href || (item.href !== (urlPrefix || '/') && pathname.startsWith(item.href))
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center space-x-2">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{currentLocale?.name || locale.toUpperCase()}</span>
                <span className="sm:hidden">{locale.toUpperCase()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {locales.map((loc) => (
                <DropdownMenuItem
                  key={loc.code}
                  onClick={() => setLocale(loc.code)}
                  className={cn(
                    'cursor-pointer',
                    locale === loc.code && 'bg-accent font-medium'
                  )}
                >
                  <span className="mr-2">{loc.flag}</span>
                  {loc.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu or login */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user.name} />
                    <AvatarFallback>
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.federation?.name || 'GTF'}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`${urlPrefix}/cabinet`}>
                    <User className="mr-2 h-4 w-4" />
                    {t('nav.cabinet')}
                  </Link>
                </DropdownMenuItem>
                {user.type === 'ADMIN' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Settings className="mr-2 h-4 w-4" />
                      {t('nav.admin')}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href={`${urlPrefix}/login`}>{t('nav.login')}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
