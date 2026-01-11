import Link from 'next/link'
import Image from 'next/image'
import { getFederationContext } from '@/lib/federation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Medal,
  Flag,
  Globe,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  ArrowLeft,
  ArrowRight,
  Flame,
  Star,
  CalendarDays,
} from 'lucide-react'
import { getTranslation } from '@/lib/utils/multilingual'
import { getCompetitionPhotoUrl } from '@/lib/utils/images'
import { getT } from '@/lib/translations'
import type { Locale } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Соревнования',
  description: 'Список соревнований по Таеквон-До ИТФ',
}

interface CompetitionsPageProps {
  searchParams: Promise<{
    status?: string
    level?: string
    year?: string
    search?: string
    page?: string
  }>
}

// Иконки для статусов
const statusIcons: Record<string, React.ReactNode> = {
  ANNOUNCED: <AlertCircle className="h-3.5 w-3.5" />,
  REGISTRATION_OPEN: <Flame className="h-3.5 w-3.5" />,
  REGISTRATION_CLOSED: <Clock className="h-3.5 w-3.5" />,
  WEIGH_IN: <Users className="h-3.5 w-3.5" />,
  DRAW_PENDING: <Clock className="h-3.5 w-3.5" />,
  DRAW_COMPLETED: <CheckCircle2 className="h-3.5 w-3.5" />,
  ONGOING: <Flame className="h-3.5 w-3.5" />,
  COMPLETED: <CheckCircle2 className="h-3.5 w-3.5" />,
  CANCELLED: <XCircle className="h-3.5 w-3.5" />,
}

// Цвета для статусов
const statusStyles: Record<string, string> = {
  ANNOUNCED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  REGISTRATION_OPEN: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REGISTRATION_CLOSED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  WEIGH_IN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DRAW_PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  DRAW_COMPLETED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  ONGOING: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

// Иконки для уровней
const levelIcons: Record<string, React.ReactNode> = {
  CLUB: <Building2 className="h-3.5 w-3.5" />,
  REGIONAL: <Flag className="h-3.5 w-3.5" />,
  NATIONAL: <Medal className="h-3.5 w-3.5" />,
  INTERNATIONAL: <Globe className="h-3.5 w-3.5" />,
}

const levelStyles: Record<string, string> = {
  CLUB: 'border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400',
  REGIONAL: 'border-green-300 text-green-700 dark:border-green-700 dark:text-green-400',
  NATIONAL: 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400',
  INTERNATIONAL: 'border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-400',
}

export default async function CompetitionsPage({ searchParams }: CompetitionsPageProps) {
  const { federation, locale } = await getFederationContext()
  const params = await searchParams
  const t = getT(locale)

  const statusLabels: Record<string, string> = {
    DRAFT: t.statusDraft,
    ANNOUNCED: t.statusAnnounced,
    REGISTRATION_OPEN: t.statusRegistrationOpen,
    REGISTRATION_CLOSED: t.statusRegistrationClosed,
    WEIGH_IN: t.statusWeighIn,
    DRAW_PENDING: t.statusDrawPending,
    DRAW_COMPLETED: t.statusDrawCompleted,
    ONGOING: t.statusInProgress,
    COMPLETED: t.statusCompleted,
    CANCELLED: t.statusCancelled,
  }

  const levelLabels: Record<string, string> = {
    CLUB: t.clubLevel,
    REGIONAL: t.regionalLevel,
    NATIONAL: t.nationalLevel,
    INTERNATIONAL: t.internationalLevel,
  }

  const status = params.status
  const level = params.level
  const year = params.year ? parseInt(params.year) : undefined
  const search = params.search
  const page = parseInt(params.page || '1')
  const limit = 12

  // Build where clause
  const where: Record<string, unknown> = {
    deletedAt: null,
    status: { not: 'DRAFT' },
  }

  if (federation) {
    where.federationId = federation.id
  }

  if (status) {
    where.status = status
  }

  if (level) {
    where.level = level
  }

  if (year) {
    where.startDate = {
      gte: new Date(year, 0, 1),
      lt: new Date(year + 1, 0, 1),
    }
  }

  // Get competitions
  const [competitions, total, upcomingCount, activeCount] = await Promise.all([
    prisma.competition.findMany({
      where,
      select: {
        id: true,
        title: true,
        photo: true,
        level: true,
        status: true,
        startDate: true,
        endDate: true,
        venue: true,
        federation: { select: { code: true, name: true } },
        country: { select: { nameRu: true, nameEn: true, flagEmoji: true } },
        city: { select: { nameRu: true, nameEn: true } },
        _count: {
          select: {
            registrations: { where: { status: 'APPROVED' } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.competition.count({ where }),
    prisma.competition.count({
      where: {
        ...where,
        status: 'REGISTRATION_OPEN',
      },
    }),
    prisma.competition.count({
      where: {
        ...where,
        status: 'ONGOING',
      },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  // Get years for filter
  const years = await prisma.competition.groupBy({
    by: ['startDate'],
    where: {
      ...(federation ? { federationId: federation.id } : {}),
      deletedAt: null,
      status: { not: 'DRAFT' },
    },
  }).then(results => {
    const uniqueYears = new Set<number>(results.map(r => new Date(r.startDate).getFullYear()))
    return Array.from(uniqueYears).sort((a: number, b: number) => b - a)
  })

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b">
        <div className="container py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary">{federation?.name || 'GTF Global'}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{t.competitions}</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                {t.competitionsDescription || 'Официальные соревнования по Таеквон-До ИТФ'}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-4">
              <div className="bg-card rounded-xl p-4 border shadow-sm min-w-[120px]">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CalendarDays className="h-4 w-4" />
                  {t.total || 'Всего'}
                </div>
                <p className="text-3xl font-bold mt-1">{total}</p>
              </div>
              {upcomingCount > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 min-w-[120px]">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                    <Flame className="h-4 w-4" />
                    {t.open || 'Открыта'}
                  </div>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">{upcomingCount}</p>
                </div>
              )}
              {activeCount > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800 min-w-[120px]">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                    <Star className="h-4 w-4" />
                    {t.live || 'Live'}
                  </div>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-400 mt-1">{activeCount}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Level Filter Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              {t.level || 'Уровень'}:
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/competitions">
                <Button
                  variant={!level ? 'default' : 'outline'}
                  size="sm"
                  className="h-8"
                >
                  {t.all}
                </Button>
              </Link>
              {Object.entries(levelLabels).map(([key, label]) => (
                <Link key={key} href={`/competitions?level=${key}${status ? `&status=${status}` : ''}${year ? `&year=${year}` : ''}`}>
                  <Button
                    variant={level === key ? 'default' : 'outline'}
                    size="sm"
                    className={`h-8 gap-1.5 ${level !== key ? levelStyles[key] : ''}`}
                  >
                    {levelIcons[key]}
                    {label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {t.status || 'Статус'}:
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/competitions${level ? `?level=${level}` : ''}${year ? `${level ? '&' : '?'}year=${year}` : ''}`}>
                <Badge
                  variant={!status ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1"
                >
                  {t.all}
                </Badge>
              </Link>
              {Object.entries(statusLabels)
                .filter(([key]) => key !== 'DRAFT')
                .map(([key, label]) => (
                  <Link key={key} href={`/competitions?status=${key}${level ? `&level=${level}` : ''}${year ? `&year=${year}` : ''}`}>
                    <Badge
                      variant="outline"
                      className={`cursor-pointer px-3 py-1 gap-1.5 ${status === key ? statusStyles[key] : ''}`}
                    >
                      {statusIcons[key]}
                      {label}
                    </Badge>
                  </Link>
                ))}
            </div>
          </div>

          {/* Year Filter */}
          {years.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {t.year || 'Год'}:
              </div>
              <div className="flex flex-wrap gap-2">
                {years.slice(0, 6).map((y) => (
                  <Link key={y} href={`/competitions?year=${y}${level ? `&level=${level}` : ''}${status ? `&status=${status}` : ''}`}>
                    <Badge
                      variant={year === y ? 'default' : 'outline'}
                      className="cursor-pointer px-3 py-1"
                    >
                      {y}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Competitions Grid */}
        {competitions.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((competition) => {
              const title = getTranslation(competition.title as Record<string, string>, locale as Locale)
              const location = competition.city
                ? (locale === 'en' ? competition.city.nameEn : competition.city.nameRu)
                : null
              const photoUrl = getCompetitionPhotoUrl(competition.photo)
              const venue = getTranslation(competition.venue as Record<string, string> | null, locale as Locale)
              const isActive = competition.status === 'ONGOING'
              const isOpen = competition.status === 'REGISTRATION_OPEN'

              return (
                <Card
                  key={competition.id}
                  className={`group flex flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 ${
                    isActive ? 'ring-2 ring-red-500 ring-offset-2' : ''
                  } ${isOpen ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                >
                  {/* Competition Photo */}
                  <div className="relative">
                    {photoUrl ? (
                      <div className="relative w-full h-48 bg-muted overflow-hidden">
                        <Image
                          src={photoUrl}
                          alt={title || ''}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
                        <Trophy className="h-16 w-16 text-primary/40" />
                      </div>
                    )}

                    {/* Status Badge - Absolute positioned */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[competition.status]}`}>
                        {statusIcons[competition.status]}
                        {statusLabels[competition.status] || competition.status}
                      </span>
                    </div>

                    {/* Level Badge - Absolute positioned */}
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-black/70 border ${levelStyles[competition.level]}`}>
                        {levelIcons[competition.level]}
                        {levelLabels[competition.level] || competition.level}
                      </span>
                    </div>

                    {/* Live indicator */}
                    {isActive && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span className="text-white text-sm font-medium">LIVE</span>
                      </div>
                    )}
                  </div>

                  <CardHeader className="flex-1">
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {title}
                    </CardTitle>
                    <CardDescription className="space-y-2 mt-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary/60" />
                        <span>
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
                              })}
                            </>
                          )}
                        </span>
                      </div>
                      {(location || venue) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary/60" />
                          <span className="line-clamp-1">
                            {competition.country?.flagEmoji} {location || venue}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary/60" />
                        <span>
                          {competition._count.registrations} {t.participants.toLowerCase()}
                        </span>
                      </div>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <Button
                      asChild
                      className={`w-full ${isOpen ? 'bg-green-600 hover:bg-green-700' : ''} ${isActive ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    >
                      <Link href={`/competitions/${competition.id}`}>
                        {isOpen ? (t.register || 'Регистрация') : isActive ? (t.viewLive || 'Смотреть') : t.viewDetails}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t.competitionsNotFound}</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t.noCompetitionsDescription || 'Соревнований с выбранными фильтрами не найдено. Попробуйте изменить параметры поиска.'}
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/competitions">
                  {t.resetFilters || 'Сбросить фильтры'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <Button
              asChild
              variant="outline"
              disabled={page <= 1}
              className="gap-2"
            >
              <Link href={page > 1 ? `/competitions?page=${page - 1}${status ? `&status=${status}` : ''}${level ? `&level=${level}` : ''}${year ? `&year=${year}` : ''}` : '#'}>
                <ArrowLeft className="h-4 w-4" />
                {t.back}
              </Link>
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }

                return (
                  <Link
                    key={pageNum}
                    href={`/competitions?page=${pageNum}${status ? `&status=${status}` : ''}${level ? `&level=${level}` : ''}${year ? `&year=${year}` : ''}`}
                  >
                    <Button
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className="w-10 h-10"
                    >
                      {pageNum}
                    </Button>
                  </Link>
                )
              })}
            </div>

            <Button
              asChild
              variant="outline"
              disabled={page >= totalPages}
              className="gap-2"
            >
              <Link href={page < totalPages ? `/competitions?page=${page + 1}${status ? `&status=${status}` : ''}${level ? `&level=${level}` : ''}${year ? `&year=${year}` : ''}` : '#'}>
                {t.forward}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
