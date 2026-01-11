import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, isSuperAdmin, isFederationAdmin } from '@/lib/auth'
import { getFederationContext } from '@/lib/federation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  User, Trophy, Calendar, Settings, Bell, FileText,
  Users, Building2, Medal, Clock, ChevronRight, Shield, Globe, LayoutDashboard
} from 'lucide-react'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Личный кабинет',
  description: 'Управление профилем и данными',
}

export default async function CabinetPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { federation, locale } = await getFederationContext()

  // Check admin status
  const superAdmin = await isSuperAdmin()
  const fedAdmin = await isFederationAdmin()
  const isAdminUser = superAdmin || fedAdmin

  // Get user's federation name
  const userFederation = user.federationId
    ? await prisma.federation.findUnique({
        where: { id: user.federationId },
        select: { name: true },
      })
    : null

  // Get user's sportsmen
  // - For SPORTSMAN type users: find by entityId
  // - For REPRESENTATIVE type: find through representative relation
  interface SportsmanWithRelations {
    id: number
    firstName: string | null
    lastName: string | null
    photo: string | null
    rating: number
    club: { title: unknown } | null
    registrations: Array<{
      id: number
      status: string
      competition: {
        id: number
        title: unknown
        startDate: Date
        status: string
      }
    }>
  }
  let sportsmen: SportsmanWithRelations[] = []

  if (user.type === 'SPORTSMAN') {
    // Find sportsman linked via user's entityId
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { entityId: true },
    })
    if (fullUser?.entityId) {
      const result = await prisma.sportsman.findMany({
        where: { id: fullUser.entityId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photo: true,
          rating: true,
          club: { select: { title: true } },
          registrations: {
            where: {
              competition: {
                startDate: { gte: new Date() },
                status: { not: 'CANCELLED' },
              },
            },
            include: {
              competition: {
                select: {
                  id: true,
                  title: true,
                  startDate: true,
                  status: true,
                },
              },
            },
            take: 5,
          },
        },
      })
      sportsmen = result as unknown as SportsmanWithRelations[]
    }
  } else if (user.type === 'REPRESENTATIVE') {
    // Find sportsmen through representative relation
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { entityId: true },
    })
    if (fullUser?.entityId) {
      const relations = await prisma.sportsmanRepresentative.findMany({
        where: { representativeId: fullUser.entityId },
        include: {
          sportsman: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photo: true,
              rating: true,
              club: { select: { title: true } },
              registrations: {
                where: {
                  competition: {
                    startDate: { gte: new Date() },
                    status: { not: 'CANCELLED' },
                  },
                },
                include: {
                  competition: {
                    select: {
                      id: true,
                      title: true,
                      startDate: true,
                      status: true,
                    },
                  },
                },
                take: 5,
              },
            },
          },
        },
      })
      sportsmen = relations.map(r => r.sportsman) as unknown as SportsmanWithRelations[]
    }
  }

  // Get recent activity
  const recentActivity = await prisma.activityLog.findMany({
    where: {
      causerId: user.id,
      causerType: 'User',
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Get notifications count
  const unreadNotifications = await prisma.notificationLog.count({
    where: {
      userId: user.id,
      readAt: null,
    },
  })

  // For admin users, show admin-specific interface
  if (isAdminUser) {
    return (
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="secondary" className="text-sm">
                {superAdmin ? 'Суперадмин' : 'Админ федерации'}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold">Панель управления</h1>
            <p className="text-muted-foreground mt-1">
              Добро пожаловать, {user.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/cabinet/settings">
                <Settings className="mr-2 h-4 w-4" />
                Настройки
              </Link>
            </Button>
            <Button asChild variant="outline" className="relative">
              <Link href="/cabinet/notifications">
                <Bell className="mr-2 h-4 w-4" />
                Уведомления
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                    {unreadNotifications}
                  </Badge>
                )}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Admin Panel Button */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/40 transition-colors">
            <CardContent className="pt-6">
              <Link href="/admin" className="block">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-primary text-primary-foreground">
                    <LayoutDashboard className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Админ панель</h3>
                    <p className="text-muted-foreground text-sm">
                      {superAdmin ? 'Глобальное управление' : 'Управление федерацией'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center text-sm text-primary font-medium">
                    Перейти в админку
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Superadmin: All Federations */}
          {superAdmin && (
            <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10 hover:border-purple-500/40 transition-colors">
              <CardContent className="pt-6">
                <Link href="/admin/federations" className="block">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-purple-500 text-white">
                      <Globe className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Федерации</h3>
                      <p className="text-muted-foreground text-sm">
                        Все федерации системы
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                      Управление федерациями
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Competitions */}
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-6">
              <Link href="/admin/competitions" className="block">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-amber-500 text-white">
                    <Trophy className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Соревнования</h3>
                    <p className="text-muted-foreground text-sm">
                      Управление турнирами
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center text-sm text-muted-foreground">
                    Открыть раздел
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Sportsmen */}
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-6">
              <Link href="/admin/sportsmen" className="block">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-blue-500 text-white">
                    <Users className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Спортсмены</h3>
                    <p className="text-muted-foreground text-sm">
                      База спортсменов
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center text-sm text-muted-foreground">
                    Открыть раздел
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Clubs */}
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-6">
              <Link href="/admin/clubs" className="block">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-green-500 text-white">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Клубы</h3>
                    <p className="text-muted-foreground text-sm">
                      Спортивные клубы
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center text-sm text-muted-foreground">
                    Открыть раздел
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-6">
              <Link href="/admin/settings" className="block">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-gray-500 text-white">
                    <Settings className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Настройки</h3>
                    <p className="text-muted-foreground text-sm">
                      SMS, Telegram, система
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center text-sm text-muted-foreground">
                    Открыть раздел
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* User info card */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-muted-foreground">{user.phone}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={superAdmin ? 'default' : 'secondary'}>
                    {superAdmin ? 'Суперадмин' : 'Админ'}
                  </Badge>
                  {userFederation && (
                    <Badge variant="outline">{userFederation.name}</Badge>
                  )}
                </div>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/cabinet/profile">
                  Редактировать
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Regular user interface
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Личный кабинет</h1>
          <p className="text-muted-foreground mt-1">
            Добро пожаловать, {user.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/cabinet/settings">
              <Settings className="mr-2 h-4 w-4" />
              Настройки
            </Link>
          </Button>
          <Button asChild variant="outline" className="relative">
            <Link href="/cabinet/notifications">
              <Bell className="mr-2 h-4 w-4" />
              Уведомления
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                  {unreadNotifications}
                </Badge>
              )}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{user.name}</h2>
                  <p className="text-muted-foreground">{user.phone}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{user.type}</Badge>
                    {userFederation && (
                      <Badge variant="secondary">{userFederation.name}</Badge>
                    )}
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/cabinet/profile">
                    Редактировать
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sportsmen */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Мои спортсмены
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/cabinet/sportsmen">
                    Все
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sportsmen.length > 0 ? (
                <div className="space-y-4">
                  {sportsmen.map((sportsman) => {
                    const clubTitle = sportsman.club
                      ? getTranslation(sportsman.club.title as Record<string, string>, locale as Locale)
                      : null

                    return (
                      <div
                        key={sportsman.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={sportsman.photo || ''} />
                            <AvatarFallback>
                              {sportsman.lastName?.[0]}{sportsman.firstName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link
                              href={`/sportsmen/${sportsman.id}`}
                              className="font-medium hover:underline"
                            >
                              {sportsman.lastName} {sportsman.firstName}
                            </Link>
                            {clubTitle && (
                              <p className="text-sm text-muted-foreground">{clubTitle}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{sportsman.rating || 0}</p>
                            <p className="text-xs text-muted-foreground">Рейтинг</p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/cabinet/sportsmen/${sportsman.id}`}>
                              Управление
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    У вас пока нет привязанных спортсменов
                  </p>
                  <Button asChild>
                    <Link href="/cabinet/sportsmen/add">
                      Добавить спортсмена
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Competitions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Предстоящие соревнования
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sportsmen.some((s: typeof sportsmen[number]) => s.registrations.length > 0) ? (
                <div className="space-y-3">
                  {sportsmen.flatMap((sportsman: typeof sportsmen[number]) =>
                    sportsman.registrations.map((reg: typeof sportsman.registrations[number]) => ({
                      ...reg,
                      sportsman: { id: sportsman.id, lastName: sportsman.lastName, firstName: sportsman.firstName },
                    }))
                  ).slice(0, 5).map((reg) => {
                    const compTitle = getTranslation(
                      reg.competition.title as Record<string, string>,
                      locale as Locale
                    )
                    return (
                      <div
                        key={reg.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <Link
                            href={`/competitions/${reg.competition.id}`}
                            className="font-medium hover:underline"
                          >
                            {compTitle}
                          </Link>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(reg.competition.startDate).toLocaleDateString(locale)}
                            <span>•</span>
                            <span>{reg.sportsman.lastName} {reg.sportsman.firstName}</span>
                          </div>
                        </div>
                        <Badge>{reg.status}</Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6">
                  Нет предстоящих соревнований
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/competitions?status=REGISTRATION_OPEN">
                  <Trophy className="mr-2 h-4 w-4" />
                  Найти соревнование
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/cabinet/sportsmen/add">
                  <Users className="mr-2 h-4 w-4" />
                  Добавить спортсмена
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/cabinet/documents">
                  <FileText className="mr-2 h-4 w-4" />
                  Мои документы
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Недавняя активность
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="text-sm">
                      <p className="text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.createdAt).toLocaleDateString(locale, {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Нет недавней активности</p>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Спортсменов</span>
                <span className="font-medium">{sportsmen.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Регистраций</span>
                <span className="font-medium">
                  {sportsmen.reduce((acc, s) => acc + s.registrations.length, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Общий рейтинг</span>
                <span className="font-medium">
                  {sportsmen.reduce((acc, s) => acc + (s.rating || 0), 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
