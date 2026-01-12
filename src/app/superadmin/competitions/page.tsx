import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/prisma'
import { Plus, Trophy, Calendar, MapPin, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'

async function getCompetitions() {
  return prisma.competition.findMany({
    orderBy: { startDate: 'desc' },
    include: {
      federation: {
        select: { code: true, name: true },
      },
      _count: {
        select: {
          registrations: true,
          categories: true,
        },
      },
    },
  })
}

export default async function CompetitionsPage() {
  const competitions = await getCompetitions()

  // Group competitions
  const upcomingCompetitions = competitions.filter(
    (c) => new Date(c.startDate) >= new Date()
  )
  const pastCompetitions = competitions.filter(
    (c) => new Date(c.startDate) < new Date()
  )

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-500',
    PUBLISHED: 'bg-blue-500',
    REGISTRATION_OPEN: 'bg-green-500',
    REGISTRATION_CLOSED: 'bg-yellow-500',
    DRAW_COMPLETED: 'bg-indigo-500',
    ONGOING: 'bg-orange-500',
    COMPLETED: 'bg-purple-500',
    CANCELLED: 'bg-red-500',
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'Черновик',
    PUBLISHED: 'Опубликовано',
    REGISTRATION_OPEN: 'Регистрация открыта',
    REGISTRATION_CLOSED: 'Регистрация закрыта',
    DRAW_COMPLETED: 'Жеребьёвка завершена',
    ONGOING: 'Идёт',
    COMPLETED: 'Завершено',
    CANCELLED: 'Отменено',
  }

  const getTitle = (title: unknown): string => {
    if (!title) return 'Без названия'
    if (typeof title === 'string') return title
    if (typeof title === 'object') {
      const t = title as Record<string, string>
      return t.ru || t.en || Object.values(t)[0] || 'Без названия'
    }
    return 'Без названия'
  }

  const getVenue = (venue: unknown): string | null => {
    if (!venue) return null
    if (typeof venue === 'string') return venue
    if (typeof venue === 'object') {
      const v = venue as Record<string, string>
      return v.ru || v.en || Object.values(v)[0] || null
    }
    return null
  }

  const CompetitionList = ({ items, title }: { items: typeof competitions; title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{items.length} соревнований</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {items.map((competition) => (
            <div
              key={competition.id}
              className="flex items-center justify-between py-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/superadmin/competitions/${competition.id}`}
                      className="font-medium hover:underline"
                    >
                      {getTitle(competition.title)}
                    </Link>
                    <Badge className={statusColors[competition.status]}>
                      {statusLabels[competition.status] || competition.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(competition.startDate).toLocaleDateString('ru-RU')}
                    </span>
                    {getVenue(competition.venue) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {getVenue(competition.venue)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {competition._count.registrations} участников
                    </span>
                    <span>
                      {competition.federation?.code.toUpperCase() || 'GTF'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/superadmin/competitions/${competition.id}`}>
                    Подробнее
                  </Link>
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Нет соревнований
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Соревнования</h1>
          <p className="text-muted-foreground">
            Все соревнования в системе GTF
          </p>
        </div>
        <Button asChild>
          <Link href="/superadmin/competitions/new">
            <Plus className="mr-2 h-4 w-4" />
            Создать соревнование
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        <CompetitionList items={upcomingCompetitions} title="Предстоящие соревнования" />
        <CompetitionList items={pastCompetitions} title="Прошедшие соревнования" />
      </div>
    </div>
  )
}
