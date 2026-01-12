import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getFederationContext } from '@/lib/federation'
import prisma from '@/lib/prisma'
import { Scale, Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

async function getActiveCompetitions(federationId: number) {
  return prisma.competition.findMany({
    where: {
      federationId,
      status: {
        in: ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'DRAW_COMPLETED', 'ONGOING'],
      },
    },
    orderBy: { startDate: 'asc' },
    include: {
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  })
}

export default async function WeighInPage() {
  const { federation } = await getFederationContext()

  if (!federation) {
    return <div>Федерация не найдена</div>
  }

  const competitions = await getActiveCompetitions(federation.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Взвешивание</h1>
        <p className="text-muted-foreground">
          Проведение взвешивания участников соревнований
        </p>
      </div>

      {competitions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {competitions.map((competition) => {
            const totalRegistrations = competition._count.registrations
            // WeighIn count would need separate query - showing 0 for now
            const weighedCount = 0
            const progress = 0

            return (
              <Card key={competition.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {typeof competition.title === 'string'
                          ? competition.title
                          : (competition.title as Record<string, string>)?.ru ||
                            (competition.title as Record<string, string>)?.en ||
                            'Соревнование'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(competition.startDate).toLocaleDateString('ru-RU')}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        competition.status === 'ONGOING'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {competition.status === 'REGISTRATION_OPEN' && 'Регистрация открыта'}
                      {competition.status === 'REGISTRATION_CLOSED' && 'Регистрация закрыта'}
                      {competition.status === 'DRAW_COMPLETED' && 'Жеребьёвка завершена'}
                      {competition.status === 'ONGOING' && 'Идёт'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {totalRegistrations} участников
                    </span>
                    <span className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-muted-foreground" />
                      {weighedCount} взвешено
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Прогресс взвешивания</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={`/admin/competitions/${competition.id}/weighin`}>
                        <Scale className="mr-2 h-4 w-4" />
                        Взвешивание
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/admin/competitions/${competition.id}`}>
                        Подробнее
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Scale className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Нет активных соревнований</h3>
            <p className="text-muted-foreground mb-4">
              Создайте соревнование для проведения взвешивания
            </p>
            <Button asChild>
              <Link href="/admin/competitions/new">
                Создать соревнование
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Инструкция по взвешиванию</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Инициализация</p>
                <p className="text-sm text-muted-foreground">
                  Нажмите "Инициализировать" для создания записей взвешивания по всем зарегистрированным участникам
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-500 font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Взвешивание</p>
                <p className="text-sm text-muted-foreground">
                  Введите фактический вес каждого участника. Система автоматически проверит соответствие категории
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-500 font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Завершение</p>
                <p className="text-sm text-muted-foreground">
                  После взвешивания всех участников нажмите "Подтвердить всех" для завершения процесса
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
