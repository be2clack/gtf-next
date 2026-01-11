import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Building2, MapPin, Users, Star,
  Instagram, Trophy, Medal
} from 'lucide-react'
import { getTranslation } from '@/lib/utils/multilingual'
import { getClubLogoUrl, getSportsmanPhotoUrl, getTrainerPhotoUrl } from '@/lib/utils/images'
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
  const club = await prisma.club.findUnique({
    where: { id: parseInt(id) },
    select: { title: true },
  })

  if (!club) return { title: 'Клуб не найден' }

  const title = getTranslation(club.title as Record<string, string>, 'ru')
  return {
    title,
    description: `Информация о клубе: ${title}`,
  }
}

export default async function FederationClubPage({ params }: PageProps) {
  const { federation: federationCode, id } = await params

  if (!VALID_FEDERATION_CODES.includes(federationCode)) {
    notFound()
  }

  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'ru'
  const isSubdomain = headersList.get('x-is-subdomain') === 'true'
  const t = getT(locale)
  const urlPrefix = isSubdomain ? '' : `/${federationCode}`

  const club = await prisma.club.findUnique({
    where: { id: parseInt(id) },
    include: {
      federation: { select: { code: true, name: true } },
      country: { select: { nameRu: true, nameEn: true, flagEmoji: true } },
      region: { select: { nameRu: true, nameEn: true } },
      city: { select: { nameRu: true, nameEn: true } },
      trainers: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photo: true,
          rank: true,
        },
        take: 10,
      },
      sportsmen: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photo: true,
          rating: true,
          dan: true,
          goldMedals: true,
          silverMedals: true,
          bronzeMedals: true,
        },
        orderBy: { rating: 'desc' },
        take: 20,
      },
      _count: {
        select: {
          sportsmen: true,
          trainers: true,
        },
      },
    },
  })

  if (!club) {
    notFound()
  }

  // Verify club belongs to federation
  if (club.federation?.code !== federationCode) {
    notFound()
  }

  const title = getTranslation(club.title as Record<string, string>, locale as Locale)
  const description = getTranslation(club.description as Record<string, string>, locale as Locale)
  const address = getTranslation(club.address as Record<string, string>, locale as Locale)

  const location = club.city
    ? (locale === 'en' ? club.city.nameEn : club.city.nameRu)
    : club.region
    ? (locale === 'en' ? club.region.nameEn : club.region.nameRu)
    : null

  // Calculate club stats
  const totalMedals = club.sportsmen.reduce(
    (acc, s) => ({
      gold: acc.gold + (s.goldMedals || 0),
      silver: acc.silver + (s.silverMedals || 0),
      bronze: acc.bronze + (s.bronzeMedals || 0),
    }),
    { gold: 0, silver: 0, bronze: 0 }
  )

  const totalRating = club.sportsmen.reduce((acc, s) => acc + (s.rating || 0), 0)
  const clubLogo = getClubLogoUrl(club.logo)

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href={urlPrefix || '/'} className="hover:text-foreground">{t.home}</Link>
        <span>/</span>
        <Link href={`${urlPrefix}/clubs`} className="hover:text-foreground">{t.clubs}</Link>
        <span>/</span>
        <span className="text-foreground">{title}</span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Club Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {clubLogo ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={clubLogo}
                      alt={title || 'Club'}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
                    {club.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{club.rating}</span>
                      </div>
                    )}
                  </div>
                  {description && (
                    <p className="text-muted-foreground mt-2">{description}</p>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
                    {location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {club.country?.flagEmoji} {location}
                      </div>
                    )}
                    {club.federation && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Trophy className="h-4 w-4" />
                        {club.federation.name}
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
                <Users className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{club._count.sportsmen}</p>
                <p className="text-sm text-muted-foreground">{t.athletes}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Medal className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-2xl font-bold">{totalMedals.gold}</p>
                <p className="text-sm text-muted-foreground">{t.goldMedals}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Medal className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-2xl font-bold">{totalMedals.silver}</p>
                <p className="text-sm text-muted-foreground">{t.silverMedals}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Medal className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold">{totalMedals.bronze}</p>
                <p className="text-sm text-muted-foreground">{t.bronzeMedals}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="sportsmen" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sportsmen">{t.athletes}</TabsTrigger>
              <TabsTrigger value="trainers">{t.trainers}</TabsTrigger>
            </TabsList>

            <TabsContent value="sportsmen">
              <Card>
                <CardHeader>
                  <CardTitle>{t.clubAthletes}</CardTitle>
                  <CardDescription>
                    {t.topByRating} ({Math.min(20, club.sportsmen.length)})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {club.sportsmen.length > 0 ? (
                    <div className="space-y-3">
                      {club.sportsmen.map((sportsman, index) => (
                        <div
                          key={sportsman.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 text-center text-sm text-muted-foreground">
                              {index + 1}
                            </span>
                            <Avatar>
                              <AvatarImage src={getSportsmanPhotoUrl(sportsman.photo) || ''} />
                              <AvatarFallback>
                                {sportsman.lastName?.[0]}{sportsman.firstName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Link
                                href={`${urlPrefix}/sportsmen/${sportsman.id}`}
                                className="font-medium hover:underline"
                              >
                                {sportsman.lastName} {sportsman.firstName}
                              </Link>
                              {sportsman.dan > 0 && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {sportsman.dan} {t.dan}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-sm">
                              {sportsman.goldMedals > 0 && (
                                <span className="text-yellow-500">{sportsman.goldMedals}G</span>
                              )}
                              {sportsman.silverMedals > 0 && (
                                <span className="text-gray-400">{sportsman.silverMedals}S</span>
                              )}
                              {sportsman.bronzeMedals > 0 && (
                                <span className="text-orange-500">{sportsman.bronzeMedals}B</span>
                              )}
                            </div>
                            <span className="font-bold text-primary">
                              {sportsman.rating || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-6">
                      {t.noAthletesInClub}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trainers">
              <Card>
                <CardHeader>
                  <CardTitle>{t.coachingStaff}</CardTitle>
                </CardHeader>
                <CardContent>
                  {club.trainers.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {club.trainers.map((trainer) => (
                        <div
                          key={trainer.id}
                          className="flex items-center gap-3 p-3 rounded-lg border"
                        >
                          <Avatar>
                            <AvatarImage src={getTrainerPhotoUrl(trainer.photo) || ''} />
                            <AvatarFallback>
                              {trainer.lastName?.[0]}{trainer.firstName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">
                              {trainer.lastName} {trainer.firstName}
                            </span>
                            {trainer.rank && (
                              <p className="text-sm text-muted-foreground">
                                {trainer.rank}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-6">
                      {t.noTrainersInfo}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t.contacts}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <p>{address}</p>
                </div>
              )}
              {club.instagram && (
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5 text-muted-foreground" />
                  <a
                    href={`https://instagram.com/${club.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    @{club.instagram}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle>{t.statistics}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.athletes}</span>
                <span className="font-medium">{club._count.sportsmen}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.trainers}</span>
                <span className="font-medium">{club._count.trainers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.totalRating}</span>
                <span className="font-medium">{totalRating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.totalMedals}</span>
                <span className="font-medium">
                  {totalMedals.gold + totalMedals.silver + totalMedals.bronze}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
