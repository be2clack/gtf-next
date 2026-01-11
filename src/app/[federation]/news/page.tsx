import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Newspaper } from 'lucide-react'
import { getTranslation } from '@/lib/utils/multilingual'
import { getNewsPhotoUrl } from '@/lib/utils/images'
import { headers } from 'next/headers'
import type { Locale } from '@/types'
import type { Metadata } from 'next'

const VALID_FEDERATION_CODES = ['kg', 'kz', 'uz', 'ru', 'ae', 'tj', 'tm']

interface PageProps {
  params: Promise<{ federation: string }>
  searchParams: Promise<{
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
    title: federation ? `Новости - ${federation.name}` : 'Новости',
  }
}

export default async function FederationNewsPage({ params, searchParams }: PageProps) {
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

  const year = searchParamsData.year ? parseInt(searchParamsData.year) : undefined
  const page = parseInt(searchParamsData.page || '1')
  const limit = 12
  const baseUrl = `/${federationCode}/news`

  // Build where clause
  const where: Record<string, unknown> = {
    federationId: federation.id,
    published: true,
  }

  if (year) {
    where.date = {
      gte: new Date(year, 0, 1),
      lt: new Date(year + 1, 0, 1),
    }
  }

  // Get news
  const [news, total] = await Promise.all([
    prisma.news.findMany({
      where,
      include: {
        federation: { select: { code: true, name: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.news.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  // Get years for filter
  const years = await prisma.news.groupBy({
    by: ['date'],
    where: {
      federationId: federation.id,
      published: true,
    },
  }).then(results => {
    const uniqueYears = new Set<number>(results.filter(r => r.date).map(r => new Date(r.date!).getFullYear()))
    return Array.from(uniqueYears).sort((a: number, b: number) => b - a)
  })

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Новости</h1>
          <p className="text-muted-foreground mt-1">
            {total} {total === 1 ? 'новость' : total < 5 ? 'новости' : 'новостей'}
          </p>
        </div>
      </div>

      {/* Year Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href={baseUrl}>
          <Badge variant={!year ? 'default' : 'outline'} className="cursor-pointer">
            Все годы
          </Badge>
        </Link>
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

      {/* News Grid */}
      {news.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => {
            const title = getTranslation(item.title as Record<string, string>, locale as Locale)
            const announce = getTranslation(item.announce as Record<string, string>, locale as Locale)

            return (
              <Card key={item.id} className="flex flex-col overflow-hidden">
                {getNewsPhotoUrl(item.photo) && (
                  <div className="relative aspect-video">
                    <Image
                      src={getNewsPhotoUrl(item.photo)!}
                      alt={title || 'News image'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <CardHeader className={!item.photo ? 'pt-6' : ''}>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    {item.date && new Date(item.date).toLocaleDateString(locale, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <CardTitle className="line-clamp-2">{title}</CardTitle>
                  {announce && (
                    <CardDescription className="line-clamp-3">
                      {announce}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/${federationCode}/news/${item.id}`}>
                      Читать далее
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
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Новости не найдены</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Button asChild variant="outline">
              <Link href={`${baseUrl}?page=${page - 1}${year ? `&year=${year}` : ''}`}>
                Назад
              </Link>
            </Button>
          )}
          <span className="flex items-center px-4">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Button asChild variant="outline">
              <Link href={`${baseUrl}?page=${page + 1}${year ? `&year=${year}` : ''}`}>
                Вперёд
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
