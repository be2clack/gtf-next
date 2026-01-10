import Link from 'next/link'
import Image from 'next/image'
import { getFederationContext } from '@/lib/federation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Newspaper } from 'lucide-react'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Новости',
  description: 'Новости федерации Таеквон-До ИТФ',
}

interface NewsPageProps {
  searchParams: Promise<{
    year?: string
    page?: string
  }>
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { federation, locale } = await getFederationContext()
  const params = await searchParams

  const year = params.year ? parseInt(params.year) : undefined
  const page = parseInt(params.page || '1')
  const limit = 12

  // Build where clause
  const where: Record<string, unknown> = {
    published: true,
  }

  if (federation) {
    where.federationId = federation.id
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
      ...(federation ? { federationId: federation.id } : {}),
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
        <Link href="/news">
          <Badge variant={!year ? 'default' : 'outline'} className="cursor-pointer">
            Все годы
          </Badge>
        </Link>
        {years.slice(0, 5).map((y) => (
          <Link key={y} href={`/news?year=${y}`}>
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
                {item.photo && (
                  <div className="relative aspect-video">
                    <Image
                      src={item.photo}
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
                    <Link href={`/news/${item.id}`}>
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
              <Link href={`/news?page=${page - 1}${year ? `&year=${year}` : ''}`}>
                Назад
              </Link>
            </Button>
          )}
          <span className="flex items-center px-4">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Button asChild variant="outline">
              <Link href={`/news?page=${page + 1}${year ? `&year=${year}` : ''}`}>
                Вперёд
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
