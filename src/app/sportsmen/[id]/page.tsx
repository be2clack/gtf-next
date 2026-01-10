import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFederationContext } from '@/lib/federation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  User, MapPin, Building2, Calendar, Trophy, Medal,
  Phone, Star, Award, Clock
} from 'lucide-react'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'
import type { Metadata } from 'next'

interface SportsmanPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: SportsmanPageProps): Promise<Metadata> {
  const { id } = await params
  const sportsman = await prisma.sportsman.findUnique({
    where: { id: parseInt(id) },
    select: { firstName: true, lastName: true },
  })

  if (!sportsman) return { title: 'Спортсмен не найден' }

  return {
    title: `${sportsman.lastName} ${sportsman.firstName}`,
    description: `Профиль спортсмена: ${sportsman.lastName} ${sportsman.firstName}`,
  }
}

const beltColors: Record<string, string> = {
  WHITE: 'bg-white border',
  YELLOW: 'bg-yellow-400',
  GREEN: 'bg-green-500',
  BLUE: 'bg-blue-500',
  RED: 'bg-red-500',
  BLACK: 'bg-black',
}

const genderLabels: Record<string, string> = {
  MALE: 'Мужской',
  FEMALE: 'Женский',
}

export default async function SportsmanPage({ params }: SportsmanPageProps) {
  const { id } = await params
  const { locale } = await getFederationContext()

  const sportsman = await prisma.sportsman.findUnique({
    where: { id: parseInt(id) },
    include: {
      federation: { select: { code: true, name: true } },
      country: { select: { nameRu: true, nameEn: true, flagEmoji: true } },
      region: { select: { nameRu: true, nameEn: true } },
      city: { select: { nameRu: true, nameEn: true } },
      club: {
        select: {
          id: true,
          title: true,
          _count: { select: { sportsmen: true } }
        }
      },
      trainer: { select: { id: true, firstName: true, lastName: true } },
      registrations: {
        where: { status: 'APPROVED' },
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
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!sportsman) {
    notFound()
  }

  const clubTitle = sportsman.club
    ? getTranslation(sportsman.club.title as Record<string, string>, locale as Locale)
    : null

  const location = sportsman.city
    ? (locale === 'en' ? sportsman.city.nameEn : sportsman.city.nameRu)
    : sportsman.region
    ? (locale === 'en' ? sportsman.region.nameEn : sportsman.region.nameRu)
    : null

  // Calculate age
  const age = sportsman.dateOfBirth
    ? Math.floor((Date.now() - new Date(sportsman.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Главная</Link>
        <span>/</span>
        <Link href="/ratings" className="hover:text-foreground">Рейтинг</Link>
        <span>/</span>
        <span className="text-foreground">{sportsman.lastName} {sportsman.firstName}</span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={sportsman.photo || ''} alt={`${sportsman.lastName} ${sportsman.firstName}`} />
                  <AvatarFallback className="text-2xl">
                    {sportsman.lastName?.[0]}{sportsman.firstName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {sportsman.lastName} {sportsman.firstName}
                    {sportsman.middleName && ` ${sportsman.middleName}`}
                  </h1>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {sportsman.dan && sportsman.dan > 0 && (
                      <Badge variant="default">{sportsman.dan} дан</Badge>
                    )}
                    {sportsman.gyp && sportsman.gyp < 10 && (
                      <Badge variant="outline">{sportsman.gyp} гуп</Badge>
                    )}
                    {sportsman.beltLevel && sportsman.beltLevel > 0 && (
                      <Badge variant="secondary">Уровень: {sportsman.beltLevel}</Badge>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
                    {location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {sportsman.country?.flagEmoji} {location}
                      </div>
                    )}
                    {clubTitle && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <Link href={`/clubs/${sportsman.club?.id}`} className="hover:text-foreground">
                          {clubTitle}
                        </Link>
                      </div>
                    )}
                    {sportsman.dateOfBirth && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {age} лет ({new Date(sportsman.dateOfBirth).toLocaleDateString(locale)})
                      </div>
                    )}
                    {sportsman.sex !== null && sportsman.sex !== undefined && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        {sportsman.sex === 1 ? 'Женский' : 'Мужской'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Trophy className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{sportsman.rating || 0}</p>
                <p className="text-sm text-muted-foreground">Рейтинг</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Medal className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-2xl font-bold">{sportsman.goldMedals || 0}</p>
                <p className="text-sm text-muted-foreground">Золото</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Medal className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-2xl font-bold">{sportsman.silverMedals || 0}</p>
                <p className="text-sm text-muted-foreground">Серебро</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Medal className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold">{sportsman.bronzeMedals || 0}</p>
                <p className="text-sm text-muted-foreground">Бронза</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="competitions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="competitions">Соревнования</TabsTrigger>
              <TabsTrigger value="achievements">Достижения</TabsTrigger>
            </TabsList>

            <TabsContent value="competitions">
              <Card>
                <CardHeader>
                  <CardTitle>История соревнований</CardTitle>
                  <CardDescription>Последние 10 соревнований</CardDescription>
                </CardHeader>
                <CardContent>
                  {sportsman.registrations.length > 0 ? (
                    <div className="space-y-3">
                      {sportsman.registrations.map((reg) => {
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
                              <p className="text-sm text-muted-foreground">
                                {new Date(reg.competition.startDate).toLocaleDateString(locale, {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                            <Badge variant={reg.competition.status === 'COMPLETED' ? 'secondary' : 'outline'}>
                              {reg.competition.status === 'COMPLETED' ? 'Завершено' : 'Предстоит'}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-6">
                      Нет зарегистрированных соревнований
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements">
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Достижения будут отображаться здесь
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Physical Params */}
          {(sportsman.weight || sportsman.height) && (
            <Card>
              <CardHeader>
                <CardTitle>Физические данные</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sportsman.weight && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Вес</span>
                    <span className="font-medium">{sportsman.weight} кг</span>
                  </div>
                )}
                {sportsman.height && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Рост</span>
                    <span className="font-medium">{sportsman.height} см</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Trainer */}
          {sportsman.trainer && (
            <Card>
              <CardHeader>
                <CardTitle>Тренер</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/trainers/${sportsman.trainer.id}`}
                  className="font-medium hover:underline"
                >
                  {sportsman.trainer.lastName} {sportsman.trainer.firstName}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Club */}
          {sportsman.club && (
            <Card>
              <CardHeader>
                <CardTitle>Клуб</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/clubs/${sportsman.club.id}`}
                  className="font-medium hover:underline"
                >
                  {clubTitle}
                </Link>
                <p className="text-sm text-muted-foreground mt-1">
                  {sportsman.club._count.sportsmen} спортсменов
                </p>
              </CardContent>
            </Card>
          )}

          {/* Member Since */}
          {sportsman.createdAt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  В системе с
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  {new Date(sportsman.createdAt).toLocaleDateString(locale, {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
