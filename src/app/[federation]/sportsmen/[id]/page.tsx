import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  User, MapPin, Building2, Calendar, Trophy, Medal,
  Star, Award, Clock
} from 'lucide-react'
import { getTranslation } from '@/lib/utils/multilingual'
import { getSportsmanPhotoUrl } from '@/lib/utils/images'
import { getT } from '@/lib/translations'
import { headers } from 'next/headers'
import type { Locale } from '@/types'
import type { Metadata } from 'next'

const VALID_FEDERATION_CODES = ['kg', 'kz', 'uz', 'ru', 'ae', 'tj', 'tm']

interface PageProps {
  params: Promise<{ federation: string; id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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

export default async function FederationSportsmanPage({ params }: PageProps) {
  const { federation: federationCode, id } = await params

  if (!VALID_FEDERATION_CODES.includes(federationCode)) {
    notFound()
  }

  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'ru'
  const isSubdomain = headersList.get('x-is-subdomain') === 'true'
  const t = getT(locale)
  const urlPrefix = isSubdomain ? '' : `/${federationCode}`

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

  // Verify sportsman belongs to federation
  if (sportsman.federation?.code !== federationCode) {
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

  const photoUrl = getSportsmanPhotoUrl(sportsman.photo)

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href={urlPrefix || '/'} className="hover:text-foreground">{t.home}</Link>
        <span>/</span>
        <Link href={`${urlPrefix}/ratings`} className="hover:text-foreground">{t.ratings}</Link>
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
                  <AvatarImage src={photoUrl || ''} alt={`${sportsman.lastName} ${sportsman.firstName}`} />
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
                    {sportsman.dan > 0 && (
                      <Badge variant="default">{sportsman.dan} {t.dan}</Badge>
                    )}
                    {sportsman.gyp > 0 && sportsman.gyp < 10 && (
                      <Badge variant="outline">{sportsman.gyp} {t.gup}</Badge>
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
                        <Link href={`${urlPrefix}/clubs/${sportsman.club?.id}`} className="hover:text-foreground">
                          {clubTitle}
                        </Link>
                      </div>
                    )}
                    {sportsman.dateOfBirth && age && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {age} {t.years}
                      </div>
                    )}
                    {sportsman.sex !== null && sportsman.sex !== undefined && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        {sportsman.sex === 1 ? t.female : t.male}
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
                <p className="text-sm text-muted-foreground">{t.rating}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Medal className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-2xl font-bold">{sportsman.goldMedals || 0}</p>
                <p className="text-sm text-muted-foreground">{t.gold}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Medal className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-2xl font-bold">{sportsman.silverMedals || 0}</p>
                <p className="text-sm text-muted-foreground">{t.silver}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Medal className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold">{sportsman.bronzeMedals || 0}</p>
                <p className="text-sm text-muted-foreground">{t.bronze}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="competitions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="competitions">{t.competitions}</TabsTrigger>
              <TabsTrigger value="achievements">{t.achievements}</TabsTrigger>
            </TabsList>

            <TabsContent value="competitions">
              <Card>
                <CardHeader>
                  <CardTitle>{t.competitionHistory}</CardTitle>
                  <CardDescription>{t.last10Competitions}</CardDescription>
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
                                href={`${urlPrefix}/competitions/${reg.competition.id}`}
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
                              {reg.competition.status === 'COMPLETED' ? t.completed : t.upcoming}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-6">
                      {t.noRegisteredCompetitions}
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
                    {t.achievementsWillBeShown}
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
                <CardTitle>{t.physicalData}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sportsman.weight && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.weight}</span>
                    <span className="font-medium">{sportsman.weight} {t.kg}</span>
                  </div>
                )}
                {sportsman.height && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.height}</span>
                    <span className="font-medium">{sportsman.height} {t.cm}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Trainer */}
          {sportsman.trainer && (
            <Card>
              <CardHeader>
                <CardTitle>{t.trainer}</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="font-medium">
                  {sportsman.trainer.lastName} {sportsman.trainer.firstName}
                </span>
              </CardContent>
            </Card>
          )}

          {/* Club */}
          {sportsman.club && (
            <Card>
              <CardHeader>
                <CardTitle>{t.club}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`${urlPrefix}/clubs/${sportsman.club.id}`}
                  className="font-medium hover:underline"
                >
                  {clubTitle}
                </Link>
                <p className="text-sm text-muted-foreground mt-1">
                  {sportsman.club._count.sportsmen} {t.athletes.toLowerCase()}
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
                  {t.memberSince}
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
