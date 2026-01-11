import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getFederationContext } from '@/lib/federation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, MapPin, Users, Trophy, Clock, Building2 } from 'lucide-react'
import { getTranslation } from '@/lib/utils/multilingual'
import { getCompetitionPhotoUrl } from '@/lib/utils/images'
import { getT } from '@/lib/translations'
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

export default async function CompetitionPage({ params }: CompetitionPageProps) {
  const { id } = await params
  const { locale } = await getFederationContext()
  const t = getT(locale || 'ru')

  const statusLabels: Record<string, string> = {
    DRAFT: t.statusDraft,
    ANNOUNCED: t.statusAnnounced,
    REGISTRATION_OPEN: t.statusRegistrationOpen,
    REGISTRATION_CLOSED: t.statusRegistrationClosed,
    WEIGH_IN: t.statusWeighIn,
    DRAW_PENDING: t.statusDrawPending,
    DRAW_COMPLETED: t.statusDrawCompleted,
    IN_PROGRESS: t.statusInProgress,
    COMPLETED: t.statusCompleted,
    CANCELLED: t.statusCancelled,
  }

  const levelLabels: Record<string, string> = {
    CLUB: t.clubLevel,
    REGIONAL: t.regionalLevel,
    NATIONAL: t.nationalLevel,
    INTERNATIONAL: t.internationalLevel,
  }

  const competition = await prisma.competition.findUnique({
    where: { id: parseInt(id), deletedAt: null },
    select: {
      id: true,
      title: true,
      description: true,
      photo: true,
      level: true,
      status: true,
      startDate: true,
      endDate: true,
      venue: true,
      registrationDeadline: true,
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
  const photoUrl = getCompetitionPhotoUrl(competition.photo)

  const canRegister = competition.status === 'REGISTRATION_OPEN'

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">{t.home}</Link>
        <span>/</span>
        <Link href="/competitions" className="hover:text-foreground">{t.competitions}</Link>
        <span>/</span>
        <span className="text-foreground">{title}</span>
      </nav>

      {/* Competition Photo Banner */}
      {photoUrl && (
        <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden mb-8 bg-muted">
          <Image
            src={photoUrl}
            alt={title || ''}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

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
                    <p className="font-medium">{t.eventDate}</p>
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
                      <p className="font-medium">{t.venue}</p>
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
                    <p className="font-medium">{t.participants}</p>
                    <p className="text-muted-foreground">
                      {competition._count.registrations} {t.registered.toLowerCase()}
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
                    <p className="font-medium">{t.disciplines}</p>
                    <p className="text-muted-foreground">
                      {competition._count.categories} {t.categories.toLowerCase()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="info" className="space-y-4">
            <TabsList>
              <TabsTrigger value="info">{t.information}</TabsTrigger>
              <TabsTrigger value="categories">{t.categories}</TabsTrigger>
              <TabsTrigger value="participants">{t.participants}</TabsTrigger>
              {competition.status === 'COMPLETED' && (
                <TabsTrigger value="results">{t.results}</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              {competition.registrationDeadline && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {t.registrationDeadline}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      {t.until} {new Date(competition.registrationDeadline).toLocaleDateString(locale, {
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
                  <CardTitle>{t.competitionCategories}</CardTitle>
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
                            {cc.name || (cc.discipline ? (locale === 'en' && cc.discipline.nameEn ? cc.discipline.nameEn : cc.discipline.name) : t.category)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {cc.gender === 'MALE' ? t.male : cc.gender === 'FEMALE' ? t.female : t.mixed}
                            {cc.ageCategory && ` / ${cc.ageCategory.minAge}-${cc.ageCategory.maxAge || '+'} ${t.years}`}
                            {cc.weightCategory && ` / ${cc.weightCategory.minWeight}-${cc.weightCategory.maxWeight || '+'} ${t.kg}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{t.categoriesNotAdded}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="participants">
              <Card>
                <CardHeader>
                  <CardTitle>{t.registeredParticipants}</CardTitle>
                  <CardDescription>
                    {t.showingFirst20}
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
                    <p className="text-muted-foreground">{t.noRegisteredParticipants}</p>
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
                      {t.resultsAfterProcessing}
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
              <CardTitle>{t.registration}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canRegister ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {t.registrationOpenUntil} {competition.registrationDeadline
                      ? new Date(competition.registrationDeadline).toLocaleDateString(locale)
                      : t.competitionStartDate}
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/competitions/${competition.id}/register`}>
                      {t.register}
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {competition.status === 'COMPLETED'
                    ? t.competitionCompleted
                    : competition.status === 'CANCELLED'
                    ? t.competitionCancelled
                    : competition.status === 'REGISTRATION_CLOSED'
                    ? t.registrationClosed
                    : t.registrationNotOpen}
                </p>
              )}
            </CardContent>
          </Card>

          {competition.federation && (
            <Card>
              <CardHeader>
                <CardTitle>{t.organizer}</CardTitle>
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
