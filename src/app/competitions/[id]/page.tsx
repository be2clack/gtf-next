import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFederationContext } from '@/lib/federation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, MapPin, Users, Trophy, Clock, FileText, Building2 } from 'lucide-react'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'
import type { Metadata } from 'next'

interface CompetitionPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CompetitionPageProps): Promise<Metadata> {
  const { id } = await params
  const competition = await prisma.competition.findUnique({
    where: { id: parseInt(id) },
    select: { title: true },
  })

  if (!competition) return { title: 'Соревнование не найдено' }

  const title = getTranslation(competition.title as Record<string, string>, 'ru')
  return {
    title,
    description: `Информация о соревновании: ${title}`,
  }
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  ANNOUNCED: 'Анонсировано',
  REGISTRATION_OPEN: 'Регистрация открыта',
  REGISTRATION_CLOSED: 'Регистрация закрыта',
  IN_PROGRESS: 'Идёт',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
}

const levelLabels: Record<string, string> = {
  CLUB: 'Клубные',
  REGIONAL: 'Региональные',
  NATIONAL: 'Национальные',
  INTERNATIONAL: 'Международные',
}

export default async function CompetitionPage({ params }: CompetitionPageProps) {
  const { id } = await params
  const { locale } = await getFederationContext()

  const competition = await prisma.competition.findUnique({
    where: { id: parseInt(id), deletedAt: null },
    include: {
      federation: { select: { code: true, name: true } },
      country: { select: { nameRu: true, nameEn: true, flagEmoji: true } },
      region: { select: { nameRu: true, nameEn: true } },
      city: { select: { nameRu: true, nameEn: true } },
      categories: {
        include: {
          discipline: true,
          ageCategory: true,
          weightCategory: true,
          beltCategory: true,
        },
        orderBy: { id: 'asc' },
      },
      registrations: {
        where: { status: 'APPROVED' },
        include: {
          sportsman: {
            select: {
              id: true,
              lastName: true,
              firstName: true,
              club: { select: { title: true } },
            },
          },
        },
        take: 20,
      },
      _count: {
        select: {
          registrations: { where: { status: 'APPROVED' } },
          categories: true,
        },
      },
    },
  })

  if (!competition) {
    notFound()
  }

  const title = getTranslation(competition.title as Record<string, string>, locale as Locale)
  const description = getTranslation(competition.description as Record<string, string>, locale as Locale)
  const location = competition.city
    ? (locale === 'en' ? competition.city.nameEn : competition.city.nameRu)
    : null

  const canRegister = competition.status === 'REGISTRATION_OPEN'

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Главная</Link>
        <span>/</span>
        <Link href="/competitions" className="hover:text-foreground">Соревнования</Link>
        <span>/</span>
        <span className="text-foreground">{title}</span>
      </nav>

      {/* Header */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">{levelLabels[competition.level] || competition.level}</Badge>
              <Badge>{statusLabels[competition.status] || competition.status}</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-4">{title}</h1>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Дата проведения</p>
                    <p className="text-muted-foreground">
                      {new Date(competition.startDate).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {competition.endDate && competition.endDate !== competition.startDate && (
                        <>
                          {' - '}
                          {new Date(competition.endDate).toLocaleDateString(locale, {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {location && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Место проведения</p>
                      <p className="text-muted-foreground">
                        {competition.country?.flagEmoji} {location}
                        {competition.region && `, ${locale === 'en' ? competition.region.nameEn : competition.region.nameRu}`}
                      </p>
                      {competition.venue && (
                        <p className="text-sm text-muted-foreground">{getTranslation(competition.venue as Record<string, string>, locale as Locale)}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Участники</p>
                    <p className="text-muted-foreground">
                      {competition._count.registrations} зарегистрировано
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Trophy className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Дисциплины</p>
                    <p className="text-muted-foreground">
                      {competition._count.categories} категорий
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="info" className="space-y-4">
            <TabsList>
              <TabsTrigger value="info">Информация</TabsTrigger>
              <TabsTrigger value="categories">Категории</TabsTrigger>
              <TabsTrigger value="participants">Участники</TabsTrigger>
              {competition.status === 'COMPLETED' && (
                <TabsTrigger value="results">Результаты</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              {competition.registrationDeadline && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Сроки регистрации
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      До {new Date(competition.registrationDeadline).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="categories">
              <Card>
                <CardHeader>
                  <CardTitle>Категории соревнований</CardTitle>
                </CardHeader>
                <CardContent>
                  {competition.categories.length > 0 ? (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {competition.categories.map((cc) => (
                        <div
                          key={cc.id}
                          className="p-3 rounded-lg border bg-muted/50"
                        >
                          <p className="font-medium">
                            {cc.name || (cc.discipline ? (locale === 'en' && cc.discipline.nameEn ? cc.discipline.nameEn : cc.discipline.name) : 'Категория')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {cc.gender === 'MALE' ? 'М' : cc.gender === 'FEMALE' ? 'Ж' : 'Смеш'}
                            {cc.ageCategory && ` / ${cc.ageCategory.minAge}-${cc.ageCategory.maxAge || '+'} лет`}
                            {cc.weightCategory && ` / ${cc.weightCategory.minWeight}-${cc.weightCategory.maxWeight || '+'} кг`}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Категории ещё не добавлены</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="participants">
              <Card>
                <CardHeader>
                  <CardTitle>Зарегистрированные участники</CardTitle>
                  <CardDescription>
                    Показаны первые 20 участников
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {competition.registrations.length > 0 ? (
                    <div className="space-y-2">
                      {competition.registrations.filter(reg => reg.sportsman).map((reg) => (
                        <div
                          key={reg.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div>
                            <Link
                              href={`/sportsmen/${reg.sportsman!.id}`}
                              className="font-medium hover:underline"
                            >
                              {reg.sportsman!.lastName} {reg.sportsman!.firstName}
                            </Link>
                            {reg.sportsman!.club && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {getTranslation(reg.sportsman!.club.title as Record<string, string>, locale as Locale)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Пока нет зарегистрированных участников</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {competition.status === 'COMPLETED' && (
              <TabsContent value="results">
                <Card>
                  <CardContent className="py-12 text-center">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Результаты будут доступны после обработки
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Регистрация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canRegister ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Регистрация открыта до {competition.registrationDeadline
                      ? new Date(competition.registrationDeadline).toLocaleDateString(locale)
                      : 'даты начала соревнований'}
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/competitions/${competition.id}/register`}>
                      Зарегистрироваться
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {competition.status === 'COMPLETED'
                    ? 'Соревнование завершено'
                    : competition.status === 'CANCELLED'
                    ? 'Соревнование отменено'
                    : competition.status === 'REGISTRATION_CLOSED'
                    ? 'Регистрация закрыта'
                    : 'Регистрация ещё не открыта'}
                </p>
              )}
            </CardContent>
          </Card>

          {competition.federation && (
            <Card>
              <CardHeader>
                <CardTitle>Организатор</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{competition.federation.name}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
