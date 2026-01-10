import Link from 'next/link'
import { getFederationContext } from '@/lib/federation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users, Building2, Calendar } from 'lucide-react'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'

export default async function HomePage() {
  const { federation, isGlobal, locale } = await getFederationContext()

  // Get stats
  const [sportsmenCount, clubsCount, competitionsCount, upcomingCompetitions] = await Promise.all([
    prisma.sportsman.count({
      where: federation ? { federationId: federation.id } : {},
    }),
    prisma.club.count({
      where: federation ? { federationId: federation.id } : {},
    }),
    prisma.competition.count({
      where: {
        ...(federation ? { federationId: federation.id } : {}),
        deletedAt: null,
      },
    }),
    prisma.competition.findMany({
      where: {
        ...(federation ? { federationId: federation.id } : {}),
        startDate: { gte: new Date() },
        status: { not: 'DRAFT' },
        deletedAt: null,
      },
      orderBy: { startDate: 'asc' },
      take: 3,
      include: {
        federation: { select: { code: true, name: true } },
      },
    }),
  ])

  const title = federation
    ? getTranslation(federation.siteTitle as Record<string, string>, locale as Locale) || federation.name
    : 'Global Taekwondo Federation'

  const description = federation
    ? getTranslation(federation.description as Record<string, string>, locale as Locale)
    : 'International federation for Taekwondo ITF'

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-primary/10 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-xl text-muted-foreground">
                {description}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/competitions">
                  <Trophy className="mr-2 h-5 w-5" />
                  Соревнования
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/ratings">
                  Рейтинг спортсменов
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold">{sportsmenCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  Спортсменов
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold">{clubsCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-muted-foreground">
                  <Building2 className="mr-2 h-4 w-4" />
                  Клубов
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold">{competitionsCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-muted-foreground">
                  <Trophy className="mr-2 h-4 w-4" />
                  Соревнований
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold">{upcomingCompetitions.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  Предстоящих
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Upcoming Competitions */}
      {upcomingCompetitions.length > 0 && (
        <section className="py-12">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Предстоящие соревнования</h2>
              <Button asChild variant="ghost">
                <Link href="/competitions">Все соревнования &rarr;</Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {upcomingCompetitions.map((competition) => (
                <Card key={competition.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{competition.level}</Badge>
                      <Badge>{competition.status}</Badge>
                    </div>
                    <CardTitle className="line-clamp-2">
                      {getTranslation(competition.title as Record<string, string>, locale as Locale)}
                    </CardTitle>
                    <CardDescription>
                      {new Date(competition.startDate).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href={`/competitions/${competition.id}`}>
                        Подробнее
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-muted">
        <div className="container text-center">
          <h2 className="text-2xl font-bold mb-4">Хотите зарегистрировать спортсмена?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Войдите в систему для регистрации на соревнования, просмотра результатов и управления профилем спортсмена.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/login">Войти</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/clubs">Найти клуб</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
