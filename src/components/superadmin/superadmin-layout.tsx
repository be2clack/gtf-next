'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building,
  Globe,
  MapPin,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Trophy,
  Users,
  Scale,
  BookOpen,
  Languages,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

interface SuperAdminLayoutProps {
  children: React.ReactNode
  user?: {
    name: string
    type: string
  } | null
}

const navigation = [
  { name: 'Дашборд', href: '/superadmin', icon: LayoutDashboard },
  { name: 'Федерации', href: '/superadmin/federations', icon: Building },
  { name: 'Судьи', href: '/superadmin/judges', icon: Scale },
  { name: 'Соревнования', href: '/superadmin/competitions', icon: Trophy },
  {
    name: 'Справочники',
    icon: BookOpen,
    children: [
      { name: 'Дисциплины', href: '/superadmin/references/disciplines' },
      { name: 'Возрастные категории', href: '/superadmin/references/age-categories' },
      { name: 'Весовые категории', href: '/superadmin/references/weight-categories' },
      { name: 'Пояса', href: '/superadmin/references/belt-categories' },
    ],
  },
  {
    name: 'Локации',
    icon: MapPin,
    children: [
      { name: 'Страны', href: '/superadmin/locations/countries' },
      { name: 'Регионы', href: '/superadmin/locations/regions' },
      { name: 'Города', href: '/superadmin/locations/cities' },
    ],
  },
  { name: 'Языки', href: '/superadmin/languages', icon: Languages },
  { name: 'Настройки', href: '/superadmin/settings', icon: Settings },
]

export function SuperAdminLayout({ children, user }: SuperAdminLayoutProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  const [openMenus, setOpenMenus] = React.useState<string[]>(['Справочники', 'Локации'])

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/superadmin" className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          <span className={cn(
            'font-bold text-xl transition-all',
            collapsed && !mobile && 'hidden'
          )}>
            GTF Control
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            // Item with children (submenu)
            if ('children' in item && item.children) {
              const isOpen = openMenus.includes(item.name)
              const isActive = item.children.some((child) =>
                pathname === child.href || pathname.startsWith(`${child.href}/`)
              )

              if (collapsed && !mobile) {
                // Collapsed mode - show only icon
                return (
                  <div key={item.name} className="relative group">
                    <button
                      className={cn(
                        'flex items-center justify-center w-full rounded-lg px-2 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                      title={item.name}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                    </button>
                    {/* Tooltip with submenu */}
                    <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50">
                      <div className="bg-popover border rounded-lg shadow-lg py-1 min-w-[160px]">
                        <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {item.name}
                        </div>
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'block px-3 py-2 text-sm transition-colors',
                              pathname === child.href || pathname.startsWith(`${child.href}/`)
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted'
                            )}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      'flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">{item.name}</span>
                    <ChevronRight className={cn(
                      'h-4 w-4 transition-transform',
                      isOpen && 'rotate-90'
                    )} />
                  </button>
                  {isOpen && (
                    <div className="ml-6 mt-1 space-y-1 border-l pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'block rounded-lg px-3 py-2 text-sm transition-colors',
                            pathname === child.href || pathname.startsWith(`${child.href}/`)
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            // Regular item
            const isActive = pathname === item.href ||
              (item.href !== '/superadmin' && pathname.startsWith(`${item.href}/`))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && !mobile && 'justify-center px-2'
                )}
                title={collapsed && !mobile ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className={cn(collapsed && !mobile && 'hidden')}>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="border-t p-4">
        <div className={cn(
          'flex items-center gap-3',
          collapsed && !mobile && 'justify-center'
        )}>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </span>
          </div>
          <div className={cn('flex-1 overflow-hidden', collapsed && !mobile && 'hidden')}>
            <p className="text-sm font-medium truncate">{user?.name || 'Super Admin'}</p>
            <p className="text-xs text-muted-foreground">GTF Global</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className={cn(collapsed && !mobile && 'hidden')}
            title="Выйти"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-card transition-all duration-300 relative',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <NavContent />
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-20 right-0 translate-x-1/2 rounded-full border bg-background shadow-md z-10"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <NavContent mobile />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Super Admin Panel</span>
          </div>

          <div className="flex-1" />

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Back to site */}
          <Button variant="outline" size="sm" asChild>
            <Link href="/">На сайт</Link>
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
