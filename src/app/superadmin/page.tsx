import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/prisma'
import { Building, Users, Trophy, Scale, Globe, TrendingUp } from 'lucide-react'
import Link from 'next/link'

async function getStats() {
  const [
    federationsCount,
    sportsmenCount,
    clubsCount,
    competitionsCount,
    judgesCount,
    countriesCount,
  ] = await Promise.all([
    prisma.federation.count(),
    prisma.sportsman.count(),
    prisma.club.count(),
    prisma.competition.count(),
    prisma.judge.count(),
    prisma.country.count(),
  ])

  // Get recent federations
  const recentFederations = await prisma.federation.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      _count: {
        select: {
          sportsmen: true,
          clubs: true,
        },
      },
    },
  })

  // Get upcoming competitions
  const upcomingCompetitions = await prisma.competition.findMany({
    where: {
      startDate: { gte: new Date() },
    },
    take: 5,
    orderBy: { startDate: 'asc' },
    include: {
      federation: {
        select: { code: true, name: true },
      },
    },
  })

  return {
    federationsCount,
    sportsmenCount,
    clubsCount,
    competitionsCount,
    judgesCount,
    countriesCount,
    recentFederations,
    upcomingCompetitions,
  }
}

export default async function SuperAdminDashboard() {
  const stats = await getStats()

  const getTitle = (title: unknown): string => {
    if (!title) return 'Без названия'
    if (typeof title === 'string') return title
    if (typeof title === 'object') {
      const t = title as Record<string, string>
      return t.ru || t.en || Object.values(t)[0] || 'Без названия'
    }
    return 'Без названия'
  }

  const statCards = [
    {
      title: 'Федерации',
      value: stats.federationsCount,
      icon: Building,
      href: '/superadmin/federations',
      color: 'text-blue-500',
    },
    {
      title: 'Спортсмены',
      value: stats.sportsmenCount,
      icon: Users,
      color: 'text-green-500',
    },
    {
      title: 'Клубы',
      value: stats.clubsCount,
      icon: Building,
      color: 'text-purple-500',
    },
    {
      title: 'Соревнования',
      value: stats.competitionsCount,
      icon: Trophy,
      href: '/superadmin/competitions',
      color: 'text-orange-500',
    },
    {
      title: 'Судьи',
      value: stats.judgesCount,
      icon: Scale,
      href: '/superadmin/judges',
      color: 'text-red-500',
    },
    {
      title: 'Страны',
      value: stats.countriesCount,
      icon: Globe,
      href: '/superadmin/locations/countries',
      color: 'text-cyan-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">GTF Control Panel</h1>
        <p className="text-muted-foreground">
          Глобальная панель управления федерациями тхэквондо
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            {stat.href ? (
              <Link href={stat.href}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                </CardContent>
              </Link>
            ) : (
              <>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Federations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Федерации
            </CardTitle>
            <CardDescription>Последние добавленные федерации</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentFederations.map((federation) => (
                <div
                  key={federation.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <Link
                      href={`/superadmin/federations/${federation.id}`}
                      className="font-medium hover:underline"
                    >
                      {federation.code.toUpperCase()} - {federation.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {federation._count.sportsmen} спортсменов, {federation._count.clubs} клубов
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      federation.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {federation.status}
                  </span>
                </div>
              ))}
              {stats.recentFederations.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Нет федераций
                </p>
              )}
            </div>
            <div className="mt-4">
              <Link
                href="/superadmin/federations"
                className="text-sm text-primary hover:underline"
              >
                Все федерации
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Competitions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Ближайшие соревнования
            </CardTitle>
            <CardDescription>Международные и национальные турниры</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingCompetitions.map((competition) => (
                <div
                  key={competition.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <Link
                      href={`/superadmin/competitions/${competition.id}`}
                      className="font-medium hover:underline"
                    >
                      {getTitle(competition.title)}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {competition.federation?.code.toUpperCase() || 'GTF'} |{' '}
                      {new Date(competition.startDate).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {competition.status}
                  </span>
                </div>
              ))}
              {stats.upcomingCompetitions.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Нет предстоящих соревнований
                </p>
              )}
            </div>
            <div className="mt-4">
              <Link
                href="/superadmin/competitions"
                className="text-sm text-primary hover:underline"
              >
                Все соревнования
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
