'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  Trophy,
  ClipboardList,
  UserCog,
  Scale,
  Newspaper,
  Settings,
  ChevronDown,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useState } from 'react'

interface AdminSidebarProps {
  federationName?: string
  federationCode?: string
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Спортсмены',
    href: '/admin/sportsmen',
    icon: Users,
  },
  {
    name: 'Клубы',
    href: '/admin/clubs',
    icon: Building2,
  },
  {
    name: 'Тренеры',
    href: '/admin/trainers',
    icon: UserCog,
  },
  {
    name: 'Судьи',
    href: '/admin/judges',
    icon: Scale,
  },
  {
    name: 'Соревнования',
    icon: Trophy,
    children: [
      { name: 'Все соревнования', href: '/admin/competitions' },
      { name: 'Регистрации', href: '/admin/registrations' },
      { name: 'Категории', href: '/admin/categories' },
      { name: 'Сетки', href: '/admin/brackets' },
    ],
  },
  {
    name: 'Новости',
    href: '/admin/news',
    icon: Newspaper,
  },
  {
    name: 'Настройки',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminSidebar({ federationName, federationCode }: AdminSidebarProps) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>(['Соревнования'])

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <div className="flex h-full flex-col border-r bg-muted/10">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-xl font-bold">
            {federationCode?.toUpperCase() || 'GTF'}
          </span>
          <span className="text-sm text-muted-foreground">Admin</span>
        </Link>
      </div>

      {/* Federation name */}
      {federationName && (
        <div className="border-b px-6 py-3">
          <p className="text-sm text-muted-foreground truncate">{federationName}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            if (item.children) {
              const isOpen = openMenus.includes(item.name)
              const isActive = item.children.some((child) => pathname === child.href)

              return (
                <li key={item.name}>
                  <Collapsible open={isOpen} onOpenChange={() => toggleMenu(item.name)}>
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span className="flex-1 text-left">{item.name}</span>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform',
                            isOpen && 'rotate-180'
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ul className="ml-7 mt-1 space-y-1 border-l pl-3">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                'block rounded-lg px-3 py-2 text-sm transition-colors',
                                pathname === child.href
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              )}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                </li>
              )
            }

            const isActive = pathname === item.href

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </Button>
      </div>
    </div>
  )
}
