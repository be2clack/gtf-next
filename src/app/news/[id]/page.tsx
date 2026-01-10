import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getFederationContext } from '@/lib/federation'
import prisma from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowLeft, Share2 } from 'lucide-react'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'
import type { Metadata } from 'next'

interface NewsDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const news = await prisma.news.findUnique({
    where: { id: parseInt(id) },
    select: { title: true, announce: true, photo: true },
  })

  if (!news) return { title: 'Новость не найдена' }

  const title = getTranslation(news.title as Record<string, string>, 'ru')
  const description = getTranslation(news.announce as Record<string, string>, 'ru')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: news.photo ? [news.photo] : [],
    },
  }
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id } = await params
  const { locale } = await getFederationContext()

  const news = await prisma.news.findUnique({
    where: { id: parseInt(id), published: true },
    include: {
      federation: { select: { code: true, name: true } },
    },
  })

  if (!news) {
    notFound()
  }

  const title = getTranslation(news.title as Record<string, string>, locale as Locale)
  const announce = getTranslation(news.announce as Record<string, string>, locale as Locale)
  const content = getTranslation(news.content as Record<string, string>, locale as Locale)

  // Get related news
  const relatedNews = await prisma.news.findMany({
    where: {
      id: { not: news.id },
      federationId: news.federationId,
      published: true,
    },
    orderBy: { date: 'desc' },
    take: 3,
    select: {
      id: true,
      title: true,
      photo: true,
      date: true,
    },
  })

  return (
    <div className="container py-8">
      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/news">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к новостям
        </Link>
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        <article className="lg:col-span-2 space-y-6">
          {/* Header */}
          <header>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Calendar className="h-4 w-4" />
              {news.date && new Date(news.date).toLocaleDateString(locale, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              {news.federation && (
                <>
                  <span>•</span>
                  <span>{news.federation.name}</span>
                </>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
            {announce && (
              <p className="text-xl text-muted-foreground mt-4">{announce}</p>
            )}
          </header>

          {/* Featured Image */}
          {news.photo && (
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <Image
                src={news.photo}
                alt={title || 'News image'}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            </div>
          )}

          {/* Content */}
          {content && (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}

          {/* Share */}
          <div className="flex items-center gap-4 pt-6 border-t">
            <span className="text-sm text-muted-foreground">Поделиться:</span>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Поделиться
            </Button>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-6">
          {relatedNews.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Другие новости</h3>
                <div className="space-y-4">
                  {relatedNews.map((item) => {
                    const itemTitle = getTranslation(item.title as Record<string, string>, locale as Locale)
                    return (
                      <Link
                        key={item.id}
                        href={`/news/${item.id}`}
                        className="block group"
                      >
                        <div className="flex gap-3">
                          {item.photo && (
                            <div className="relative w-20 h-14 rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={item.photo}
                                alt={itemTitle || 'News thumbnail'}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                              {itemTitle}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.date && new Date(item.date).toLocaleDateString(locale, {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
