import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getFederationContext } from '@/lib/federation'
import prisma from '@/lib/prisma'
import { Trophy, Medal, Users, Building2 } from 'lucide-react'
import Link from 'next/link'

async function getRatings(federationId: number) {
  // Get sportsmen ratings
  const sportsmenRatings = await prisma.sportsman.findMany({
    where: { federationId },
    orderBy: { rating: 'desc' },
    take: 50,
    select: {
      id: true,
      fio: true,
      firstName: true,
      lastName: true,
      rating: true,
      club: {
        select: { id: true, title: true },
      },
    },
  })

  // Get club ratings
  const clubRatings = await prisma.club.findMany({
    where: { federationId },
    select: {
      id: true,
      title: true,
      rating: true,
      sportsmen: {
        select: {
          rating: true,
        },
      },
    },
  })

  // Helper to get club name from title JSON
  const getClubName = (title: unknown): string => {
    if (!title) return 'Без названия'
    if (typeof title === 'string') return title
    if (typeof title === 'object') {
      const t = title as Record<string, string>
      return t.ru || t.en || t.kg || Object.values(t)[0] || 'Без названия'
    }
    return 'Без названия'
  }

  // Calculate club totals
  const clubsWithPoints = clubRatings.map((club) => ({
    id: club.id,
    name: getClubName(club.title),
    totalPoints: club.rating || club.sportsmen.reduce((sum, s) => sum + (s.rating || 0), 0),
    athleteCount: club.sportsmen.length,
  })).sort((a, b) => b.totalPoints - a.totalPoints)

  return {
    sportsmen: sportsmenRatings,
    clubs: clubsWithPoints,
  }
}

export default async function RatingsPage() {
  const { federation } = await getFederationContext()

  if (!federation) {
    return <div>Федерация не найдена</div>
  }

  const { sportsmen, clubs } = await getRatings(federation.id)

  const getMedalColor = (position: number) => {
    if (position === 1) return 'text-yellow-500'
    if (position === 2) return 'text-gray-400'
    if (position === 3) return 'text-amber-600'
    return 'text-muted-foreground'
  }

  const getSportsmanName = (sportsman: { fio: string | null; firstName: string | null; lastName: string | null }) => {
    return sportsman.fio || `${sportsman.lastName || ''} ${sportsman.firstName || ''}`.trim() || 'Без имени'
  }

  const getClubNameFromTitle = (title: unknown): string => {
    if (!title) return 'Без клуба'
    if (typeof title === 'string') return title
    if (typeof title === 'object') {
      const t = title as Record<string, string>
      return t.ru || t.en || t.kg || Object.values(t)[0] || 'Без клуба'
    }
    return 'Без клуба'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Рейтинги</h1>
          <p className="text-muted-foreground">
            Рейтинги спортсменов и клубов федерации
          </p>
        </div>
      </div>

      <Tabs defaultValue="sportsmen" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sportsmen" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Спортсмены
          </TabsTrigger>
          <TabsTrigger value="clubs" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Клубы
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sportsmen">
          <Card>
            <CardHeader>
              <CardTitle>Рейтинг спортсменов</CardTitle>
              <CardDescription>
                Топ-50 спортсменов по рейтинговым очкам
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {sportsmen.map((sportsman, index) => (
                  <div
                    key={sportsman.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 text-center font-bold ${getMedalColor(index + 1)}`}>
                        {index < 3 ? (
                          <Medal className="h-5 w-5 mx-auto" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/admin/sportsmen/${sportsman.id}`}
                          className="font-medium hover:underline"
                        >
                          {getSportsmanName(sportsman)}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {getClubNameFromTitle(sportsman.club?.title)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="font-mono">
                        {sportsman.rating || 0} pts
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {sportsmen.length === 0 && (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Нет данных о рейтинге
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clubs">
          <Card>
            <CardHeader>
              <CardTitle>Рейтинг клубов</CardTitle>
              <CardDescription>
                Клубы отсортированы по суммарным очкам спортсменов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {clubs.map((club, index) => (
                  <div
                    key={club.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 text-center font-bold ${getMedalColor(index + 1)}`}>
                        {index < 3 ? (
                          <Medal className="h-5 w-5 mx-auto" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/admin/clubs/${club.id}`}
                          className="font-medium hover:underline"
                        >
                          {club.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {club.athleteCount} спортсменов
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="font-mono">
                        {club.totalPoints} pts
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {clubs.length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Нет данных о рейтинге клубов
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
