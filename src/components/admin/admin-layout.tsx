'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users,
  Building2,
  Trophy,
  Medal,
  Newspaper,
  Settings,
  LayoutDashboard,
  UserCog,
  Scale,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Database,
  Award,
  TrendingUp,
  Handshake,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: React.ReactNode
  user?: {
    name: string
    type: string
  } | null
  federation?: {
    name: string
    code: string
  } | null
}

const navigation = [
  { name: 'Дашборд', href: '/admin', icon: LayoutDashboard },
  { name: 'Спортсмены', href: '/admin/sportsmen', icon: Users },
  { name: 'Клубы', href: '/admin/clubs', icon: Building2 },
  { name: 'Тренеры', href: '/admin/trainers', icon: UserCog },
  { name: 'Судьи', href: '/admin/judges', icon: Medal },
  { name: 'Соревнования', href: '/admin/competitions', icon: Trophy },
  { name: 'Взвешивание', href: '/admin/weighin', icon: Scale },
  { name: 'Аттестации', href: '/admin/attestations', icon: Award },
  { name: 'Рейтинги', href: '/admin/ratings', icon: TrendingUp },
  { name: 'Новости', href: '/admin/news', icon: Newspaper },
  { name: 'Партнёры', href: '/admin/partners', icon: Handshake },
  { name: 'Миграция', href: '/admin/migration', icon: Database },
  { name: 'Настройки', href: '/admin/settings', icon: Settings },
]

export function AdminLayout({ children, user, federation }: AdminLayoutProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <span className={cn(
            'font-bold text-xl transition-all',
            collapsed && !mobile && 'hidden'
          )}>
            {federation?.code?.toUpperCase() || 'GTF'}
          </span>
          {collapsed && !mobile && (
            <span className="font-bold text-xl">
              {federation?.code?.charAt(0).toUpperCase() || 'G'}
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
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
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div className={cn('flex-1 overflow-hidden', collapsed && !mobile && 'hidden')}>
            <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {federation?.name || 'GTF'}
            </p>
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
          'hidden md:flex flex-col border-r bg-card transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <NavContent />
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-20 right-0 translate-x-1/2 rounded-full border bg-background shadow-md"
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