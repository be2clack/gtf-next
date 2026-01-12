import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/prisma'
import { Building, Users, Trophy, Scale, Globe, TrendingUp, Calendar, Flag, Award } from 'lucide-react'

async function getDetailedStats() {
  // Basic counts
  const [
    federationsCount,
    activeFederationsCount,
    sportsmenCount,
    activeSportsmenCount,
    clubsCount,
    competitionsCount,
    completedCompetitionsCount,
    judgesCount,
    internationalJudgesCount,
    countriesCount,
    regionsCount,
    citiesCount,
    disciplinesCount,
    ageCategoriesCount,
    weightCategoriesCount,
    beltCategoriesCount,
  ] = await Promise.all([
    prisma.federation.count(),
    prisma.federation.count({ where: { status: 'ACTIVE' } }),
    prisma.sportsman.count(),
    prisma.sportsman.count(), // Active sportsmen placeholder
    prisma.club.count(),
    prisma.competition.count(),
    prisma.competition.count({ where: { status: 'COMPLETED' } }),
    prisma.judge.count(),
    prisma.judge.count({ where: { judgeCategory: 'INTERNATIONAL' } }),
    prisma.country.count(),
    prisma.region.count(),
    prisma.city.count(),
    prisma.discipline.count(),
    prisma.ageCategory.count(),
    prisma.weightCategory.count(),
    prisma.beltCategory.count(),
  ])

  // Federations by country
  const federationsByCountry = await prisma.federation.groupBy({
    by: ['countryId'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  })

  const countryIds = federationsByCountry.map(f => f.countryId).filter(Boolean) as number[]
  const countries = await prisma.country.findMany({
    where: { id: { in: countryIds } },
    select: { id: true, nameRu: true, code: true },
  })

  const federationsByCountryWithNames = federationsByCountry.map(f => ({
    country: countries.find(c => c.id === f.countryId)?.nameRu || 'Не указана',
    count: f._count.id,
  }))

  // Competitions by month (last 12 months)
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)

  const competitionsByMonth = await prisma.competition.groupBy({
    by: ['startDate'],
    _count: { id: true },
    where: {
      startDate: { gte: twelveMonthsAgo },
    },
  })

  // Group by month
  const monthlyCompetitions: Record<string, number> = {}
  competitionsByMonth.forEach(c => {
    const date = new Date(c.startDate)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyCompetitions[key] = (monthlyCompetitions[key] || 0) + c._count.id
  })

  // Top federations by athletes
  const topFederations = await prisma.federation.findMany({
    take: 10,
    orderBy: {
      sportsmen: { _count: 'desc' },
    },
    select: {
      id: true,
      code: true,
      name: true,
      _count: {
        select: {
          sportsmen: true,
          clubs: true,
          competitions: true,
        },
      },
    },
  })

  // Judges by category
  const judgesByCategory = await prisma.judge.groupBy({
    by: ['judgeCategory'],
    _count: { id: true },
  })

  return {
    federationsCount,
    activeFederationsCount,
    sportsmenCount,
    activeSportsmenCount,
    clubsCount,
    competitionsCount,
    completedCompetitionsCount,
    judgesCount,
    internationalJudgesCount,
    countriesCount,
    regionsCount,
    citiesCount,
    disciplinesCount,
    ageCategoriesCount,
    weightCategoriesCount,
    beltCategoriesCount,
    federationsByCountryWithNames,
    monthlyCompetitions,
    topFederations,
    judgesByCategory,
  }
}

export default async function StatisticsPage() {
  const stats = await getDetailedStats()

  const judgeCategoryLabels: Record<string, string> = {
    INTERNATIONAL: 'Международные',
    NATIONAL: 'Национальные',
    REGIONAL: 'Региональные',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Статистика GTF</h1>
        <p className="text-muted-foreground">
          Детальная статистика по платформе
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Федерации</CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.federationsCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeFederationsCount} активных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Спортсмены</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sportsmenCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSportsmenCount.toLocaleString()} активных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Клубы</CardTitle>
            <Building className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clubsCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.federationsCount > 0 ? Math.round(stats.clubsCount / stats.federationsCount) : 0} на федерацию
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Соревнования</CardTitle>
            <Trophy className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.competitionsCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedCompetitionsCount} завершено
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Судьи</CardTitle>
            <Scale className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.judgesCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.internationalJudgesCount} международных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">География</CardTitle>
            <Globe className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.countriesCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.regionsCount} регионов, {stats.citiesCount} городов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Дисциплины</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.disciplinesCount}</div>
            <p className="text-xs text-muted-foreground">
              виды соревнований
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Категории</CardTitle>
            <Flag className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.ageCategoriesCount + stats.weightCategoriesCount + stats.beltCategoriesCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.ageCategoriesCount} возр., {stats.weightCategoriesCount} вес., {stats.beltCategoriesCount} пояс.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Federations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Топ федераций по спортсменам
            </CardTitle>
            <CardDescription>10 крупнейших федераций</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topFederations.map((federation, index) => (
                <div key={federation.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">
                        {federation.code.toUpperCase()} - {federation.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {federation._count.clubs} клубов, {federation._count.competitions} соревн.
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-primary">
                    {federation._count.sportsmen.toLocaleString()}
                  </span>
                </div>
              ))}
              {stats.topFederations.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Federations by Country */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Федерации по странам
            </CardTitle>
            <CardDescription>Распределение по географии</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.federationsByCountryWithNames.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <p className="font-medium">{item.country}</p>
                  </div>
                  <span className="font-bold text-primary">{item.count}</span>
                </div>
              ))}
              {stats.federationsByCountryWithNames.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Judges by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Судьи по категориям
            </CardTitle>
            <CardDescription>Распределение судейского состава</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.judgesByCategory.map((item) => (
                <div key={item.judgeCategory} className="flex items-center justify-between">
                  <p className="font-medium">
                    {judgeCategoryLabels[item.judgeCategory || ''] || item.judgeCategory || 'Не указана'}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${(item._count.id / stats.judgesCount) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="font-bold text-primary w-12 text-right">
                      {item._count.id}
                    </span>
                  </div>
                </div>
              ))}
              {stats.judgesByCategory.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Competitions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Соревнования по месяцам
            </CardTitle>
            <CardDescription>За последние 12 месяцев</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.monthlyCompetitions)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 12)
                .map(([month, count]) => {
                  const [year, monthNum] = month.split('-')
                  const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
                  const monthName = monthNames[parseInt(monthNum) - 1]
                  const maxCount = Math.max(...Object.values(stats.monthlyCompetitions))

                  return (
                    <div key={month} className="flex items-center justify-between">
                      <p className="font-medium text-sm w-24">
                        {monthName} {year}
                      </p>
                      <div className="flex items-center gap-2 flex-1 ml-4">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{
                              width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="font-bold w-8 text-right">{count}</span>
                      </div>
                    </div>
                  )
                })}
              {Object.keys(stats.monthlyCompetitions).length === 0 && (
                <p className="text-muted-foreground text-center py-4">Нет данных за этот период</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
