import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getFederationContext } from '@/lib/federation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, Trophy, UserCog, TrendingUp, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Дашборд',
  description: 'Панель управления федерацией',
}

async function getStats(federationId?: number) {
  const where = federationId ? { federationId } : {}
  
  const [
    sportsmenCount,
    clubsCount,
    trainersCount,
    competitionsCount,
    upcomingCompetitions,
    recentRegistrations,
  ] = await Promise.all([
    prisma.sportsman.count({ where }),
    prisma.club.count({ where }),
    prisma.trainer.count({ where }),
    prisma.competition.count({ where }),
    prisma.competition.count({
      where: { ...where, startDate: { gte: new Date() } },
    }),
    prisma.sportsman.count({
      where: {
        ...where,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  return {
    sportsmenCount,
    clubsCount,
    trainersCount,
    competitionsCount,
    upcomingCompetitions,
    recentRegistrations,
  }
}

export default async function AdminDashboardPage() {
  const { federation } = await getFederationContext()
  const stats = await getStats(federation?.id)

  const cards = [
    {
      title: 'Спортсмены',
      value: stats.sportsmenCount,
      description: `+${stats.recentRegistrations} за месяц`,
      icon: Users,
      href: '/admin/sportsmen',
    },
    {
      title: 'Клубы',
      value: stats.clubsCount,
      description: 'Зарегистрированных клубов',
      icon: Building2,
      href: '/admin/clubs',
    },
    {
      title: 'Тренеры',
      value: stats.trainersCount,
      description: 'Активных тренеров',
      icon: UserCog,
      href: '/admin/trainers',
    },
    {
      title: 'Соревнования',
      value: stats.competitionsCount,
      description: `${stats.upcomingCompetitions} предстоящих`,
      icon: Trophy,
      href: '/admin/competitions',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Дашборд</h1>
        <p className="text-muted-foreground">
          Добро пожаловать в панель управления {federation?.name || 'GTF'}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Предстоящие соревнования
            </CardTitle>
            <CardDescription>
              Ближайшие запланированные мероприятия
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.upcomingCompetitions > 0 ? (
              <p className="text-sm text-muted-foreground">
                {stats.upcomingCompetitions} соревнований запланировано
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Нет запланированных соревнований
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Активность
            </CardTitle>
            <CardDescription>
              Статистика за последний месяц
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats.recentRegistrations} новых спортсменов зарегистрировано
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}