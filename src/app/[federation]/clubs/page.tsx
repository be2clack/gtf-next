import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Building2, Users, MapPin, Star, Search } from 'lucide-react'
import { getTranslation } from '@/lib/utils/multilingual'
import { getClubLogoUrl } from '@/lib/utils/images'
import { getT } from '@/lib/translations'
import { headers } from 'next/headers'
import type { Locale } from '@/types'
import type { Metadata } from 'next'

const VALID_FEDERATION_CODES = ['kg', 'kz', 'uz', 'ru', 'ae', 'tj', 'tm']

interface PageProps {
  params: Promise<{ federation: string }>
  searchParams: Promise<{
    regionId?: string
    search?: string
    page?: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { federation: code } = await params
  const federation = await prisma.federation.findFirst({
    where: { code, status: 'ACTIVE' },
  })
  return {
    title: federation ? `Клубы - ${federation.name}` : 'Клубы',
  }
}

export default async function FederationClubsPage({ params, searchParams }: PageProps) {
  const { federation: federationCode } = await params
  const searchParamsData = await searchParams

  if (!VALID_FEDERATION_CODES.includes(federationCode)) {
    notFound()
  }

  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'ru'
  const isSubdomain = headersList.get('x-is-subdomain') === 'true'
  const t = getT(locale)

  // Get federation
  const federation = await prisma.federation.findFirst({
    where: { code: federationCode, status: 'ACTIVE', deletedAt: null },
  })

  if (!federation) {
    notFound()
  }

  const regionId = searchParamsData.regionId ? parseInt(searchParamsData.regionId) : undefined
  const search = searchParamsData.search
  const page = parseInt(searchParamsData.page || '1')
  const limit = 12
  const urlPrefix = isSubdomain ? '' : `/${federationCode}`
  const baseUrl = `${urlPrefix}/clubs`

  // Build where clause
  const where: Record<string, unknown> = {
    federationId: federation.id,
  }

  if (regionId) {
    where.regionId = regionId
  }

  if (search) {
    where.OR = [
      { title: { path: ['ru'], string_contains: search } },
      { title: { path: ['en'], string_contains: search } },
    ]
  }

  // Get clubs
  const [clubs, total, regions] = await Promise.all([
    prisma.club.findMany({
      where,
      include: {
        federation: { select: { code: true, name: true } },
        country: { select: { nameRu: true, nameEn: true, flagEmoji: true } },
        region: { select: { id: true, nameRu: true, nameEn: true } },
        city: { select: { nameRu: true, nameEn: true } },
        _count: {
          select: {
            sportsmen: true,
            trainers: true,
          },
        },
      },
      orderBy: { rating: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.club.count({ where }),
    prisma.region.findMany({
      where: { countryId: federation.countryId },
      select: { id: true, nameRu: true, nameEn: true },
      orderBy: { nameRu: 'asc' },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t.clubs}</h1>
          <p className="text-muted-foreground mt-1">
            {total} {t.clubs.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href={baseUrl}>
          <Badge variant={!regionId ? 'default' : 'outline'} className="cursor-pointer">
            {t.all}
          </Badge>
        </Link>
        {regions.slice(0, 10).map((region) => (
          <Link key={region.id} href={`${baseUrl}?regionId=${region.id}`}>
            <Badge
              variant={regionId === region.id ? 'default' : 'outline'}
              className="cursor-pointer"
            >
              {locale === 'en' ? region.nameEn : region.nameRu}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Search */}
      <form className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            name="search"
            placeholder={`${t.search}...`}
            defaultValue={search}
            className="pl-10"
          />
        </div>
      </form>

      {/* Clubs Grid */}
      {clubs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => {
            const title = getTranslation(club.title as Record<string, string>, locale as Locale)
            const description = getTranslation(club.description as Record<string, string>, locale as Locale)
            const location = club.city
              ? (locale === 'en' ? club.city.nameEn : club.city.nameRu)
              : club.region
              ? (locale === 'en' ? club.region.nameEn : club.region.nameRu)
              : null

            return (
              <Card key={club.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    {getClubLogoUrl(club.logo) ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                        <Image
                          src={getClubLogoUrl(club.logo)!}
                          alt={title || 'Club'}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <Building2 className="h-8 w-8 text-primary" />
                    )}
                    {club.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{club.rating}</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2">{title}</CardTitle>
                  {description && (
                    <CardDescription className="line-clamp-2">
                      {description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  {location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {club.country?.flagEmoji} {location}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {club._count.sportsmen} {t.athletes.toLowerCase()}
                    </div>
                  </div>
                  <Button asChild className="w-full">
                    <Link href={`${urlPrefix}/clubs/${club.id}`}>
                      {t.viewDetails}
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
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t.clubsNotFound}</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Button asChild variant="outline">
              <Link href={`${baseUrl}?page=${page - 1}${regionId ? `&regionId=${regionId}` : ''}${search ? `&search=${search}` : ''}`}>
                {t.back}
              </Link>
            </Button>
          )}
          <span className="flex items-center px-4">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Button asChild variant="outline">
              <Link href={`${baseUrl}?page=${page + 1}${regionId ? `&regionId=${regionId}` : ''}${search ? `&search=${search}` : ''}`}>
                {t.forward}
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
