import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Users } from 'lucide-react'
import { getTranslation } from '@/lib/utils/multilingual'
import { headers } from 'next/headers'
import type { Locale } from '@/types'
import type { Metadata } from 'next'

const VALID_FEDERATION_CODES = ['kg', 'kz', 'uz', 'ru', 'ae', 'tj', 'tm']

interface PageProps {
  params: Promise<{ federation: string }>
  searchParams: Promise<{
    status?: string
    level?: string
    year?: string
    page?: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { federation: code } = await params
  const federation = await prisma.federation.findFirst({
    where: { code, status: 'ACTIVE' },
  })
  return {
    title: federation ? `Соревнования - ${federation.name}` : 'Соревнования',
  }
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  ANNOUNCED: 'Анонсировано',
  REGISTRATION_OPEN: 'Регистрация',
  REGISTRATION_CLOSED: 'Регистрация закрыта',
  IN_PROGRESS: 'Идёт',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  ANNOUNCED: 'outline',
  REGISTRATION_OPEN: 'default',
  REGISTRATION_CLOSED: 'secondary',
  IN_PROGRESS: 'default',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
}

const levelLabels: Record<string, string> = {
  CLUB: 'Клубные',
  REGIONAL: 'Региональные',
  NATIONAL: 'Национальные',
  INTERNATIONAL: 'Международные',
}

export default async function FederationCompetitionsPage({ params, searchParams }: PageProps) {
  const { federation: federationCode } = await params
  const searchParamsData = await searchParams

  if (!VALID_FEDERATION_CODES.includes(federationCode)) {
    notFound()
  }

  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'ru'

  // Get federation
  const federation = await prisma.federation.findFirst({
    where: { code: federationCode, status: 'ACTIVE', deletedAt: null },
  })

  if (!federation) {
    notFound()
  }

  const status = searchParamsData.status
  const level = searchParamsData.level
  const year = searchParamsData.year ? parseInt(searchParamsData.year) : undefined
  const page = parseInt(searchParamsData.page || '1')
  const limit = 12
  const baseUrl = `/${federationCode}/competitions`

  // Build where clause
  const where: Record<string, unknown> = {
    federationId: federation.id,
    deletedAt: null,
    status: { not: 'DRAFT' },
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
  const [competitions, total] = await Promise.all([
    prisma.competition.findMany({
      where,
      include: {
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
  ])

  const totalPages = Math.ceil(total / limit)

  // Get years for filter
  const years = await prisma.competition.groupBy({
    by: ['startDate'],
    where: {
      federationId: federation.id,
      deletedAt: null,
      status: { not: 'DRAFT' },
    },
  }).then(results => {
    const uniqueYears = new Set<number>(results.map(r => new Date(r.startDate).getFullYear()))
    return Array.from(uniqueYears).sort((a: number, b: number) => b - a)
  })

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Соревнования</h1>
          <p className="text-muted-foreground mt-1">
            {total} {total === 1 ? 'соревнование' : 'соревнований'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href={baseUrl}>
          <Badge variant={!status && !level && !year ? 'default' : 'outline'} className="cursor-pointer">
            Все
          </Badge>
        </Link>
        {Object.entries(statusLabels).filter(([key]) => key !== 'DRAFT').map(([key, label]) => (
          <Link key={key} href={`${baseUrl}?status=${key}`}>
            <Badge
              variant={status === key ? 'default' : 'outline'}
              className="cursor-pointer"
            >
              {label}
            </Badge>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(levelLabels).map(([key, label]) => (
          <Link key={key} href={`${baseUrl}?level=${key}`}>
            <Badge
              variant={level === key ? 'default' : 'outline'}
              className="cursor-pointer"
            >
              {label}
            </Badge>
          </Link>
        ))}
        {years.slice(0, 5).map((y) => (
          <Link key={y} href={`${baseUrl}?year=${y}`}>
            <Badge
              variant={year === y ? 'default' : 'outline'}
              className="cursor-pointer"
            >
              {y}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Competitions Grid */}
      {competitions.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((competition) => {
            const title = getTranslation(competition.title as Record<string, string>, locale as Locale)
            const location = competition.city
              ? (locale === 'en' ? competition.city.nameEn : competition.city.nameRu)
              : null

            return (
              <Card key={competition.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{levelLabels[competition.level] || competition.level}</Badge>
                    <Badge variant={statusColors[competition.status]}>
                      {statusLabels[competition.status] || competition.status}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{title}</CardTitle>
                  <CardDescription className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(competition.startDate).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    {location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {competition.country?.flagEmoji} {location}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {competition._count.registrations} участников
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild className="w-full">
                    <Link href={`/${federationCode}/competitions/${competition.id}`}>
                      Подробнее
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Соревнования не найдены</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Button asChild variant="outline">
              <Link href={`${baseUrl}?page=${page - 1}${status ? `&status=${status}` : ''}${level ? `&level=${level}` : ''}${year ? `&year=${year}` : ''}`}>
                Назад
              </Link>
            </Button>
          )}
          <span className="flex items-center px-4">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Button asChild variant="outline">
              <Link href={`${baseUrl}?page=${page + 1}${status ? `&status=${status}` : ''}${level ? `&level=${level}` : ''}${year ? `&year=${year}` : ''}`}>
                Вперёд
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
