import Link from 'next/link'
import { getFederationContext } from '@/lib/federation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Trophy, Medal, Users, Search, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Рейтинг спортсменов',
  description: 'Рейтинг спортсменов Таеквон-До ИТФ',
}

interface RatingsPageProps {
  searchParams: Promise<{
    discipline?: string
    gender?: string
    ageGroup?: string
    search?: string
    page?: string
  }>
}

const disciplineLabels: Record<string, string> = {
  SPARRING: 'Спарринг',
  PATTERNS: 'Туль',
  SPECIAL_TECHNIQUE: 'Спец. техника',
  POWER_BREAKING: 'Сила удара',
}

const genderLabels: Record<string, string> = {
  MALE: 'Мужчины',
  FEMALE: 'Женщины',
}

const ageGroupLabels: Record<string, string> = {
  CHILDREN: 'Дети',
  CADETS: 'Кадеты',
  JUNIORS: 'Юниоры',
  ADULTS: 'Взрослые',
  VETERANS: 'Ветераны',
}

export default async function RatingsPage({ searchParams }: RatingsPageProps) {
  const { federation, locale } = await getFederationContext()
  const params = await searchParams

  const discipline = params.discipline || 'SPARRING'
  const gender = params.gender
  const ageGroup = params.ageGroup
  const search = params.search
  const page = parseInt(params.page || '1')
  const limit = 50

  // Build where clause for sportsmen with rating
  const where: Record<string, unknown> = {
    rating: { gt: 0 },
  }

  if (federation) {
    where.federationId = federation.id
  }

  if (gender) {
    // sex: 0 = male, 1 = female
    where.sex = gender === 'MALE' ? 0 : 1
  }

  if (search) {
    where.OR = [
      { lastName: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Get rated sportsmen
  const [sportsmen, total] = await Promise.all([
    prisma.sportsman.findMany({
      where,
      include: {
        federation: { select: { code: true, name: true } },
        country: { select: { nameRu: true, nameEn: true, flagEmoji: true } },
        club: { select: { title: true } },
      },
      orderBy: { rating: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sportsman.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Рейтинг спортсменов</h1>
          <p className="text-muted-foreground mt-1">
            {total} спортсменов в рейтинге
          </p>
        </div>
      </div>

      {/* Discipline Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(disciplineLabels).map(([key, label]) => (
          <Link key={key} href={`/ratings?discipline=${key}${gender ? `&gender=${gender}` : ''}${ageGroup ? `&ageGroup=${ageGroup}` : ''}`}>
            <Badge
              variant={discipline === key ? 'default' : 'outline'}
              className="cursor-pointer"
            >
              {label}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Gender Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href={`/ratings?discipline=${discipline}${ageGroup ? `&ageGroup=${ageGroup}` : ''}`}>
          <Badge variant={!gender ? 'default' : 'outline'} className="cursor-pointer">
            Все
          </Badge>
        </Link>
        {Object.entries(genderLabels).map(([key, label]) => (
          <Link key={key} href={`/ratings?discipline=${discipline}&gender=${key}${ageGroup ? `&ageGroup=${ageGroup}` : ''}`}>
            <Badge
              variant={gender === key ? 'default' : 'outline'}
              className="cursor-pointer"
            >
              {label}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Age Group Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href={`/ratings?discipline=${discipline}${gender ? `&gender=${gender}` : ''}`}>
          <Badge variant={!ageGroup ? 'default' : 'outline'} className="cursor-pointer">
            Все возрасты
          </Badge>
        </Link>
        {Object.entries(ageGroupLabels).map(([key, label]) => (
          <Link key={key} href={`/ratings?discipline=${discipline}${gender ? `&gender=${gender}` : ''}&ageGroup=${key}`}>
            <Badge
              variant={ageGroup === key ? 'default' : 'outline'}
              className="cursor-pointer"
            >
              {label}
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
            placeholder="Поиск по имени..."
            defaultValue={search}
            className="pl-10"
          />
          <input type="hidden" name="discipline" value={discipline} />
          {gender && <input type="hidden" name="gender" value={gender} />}
          {ageGroup && <input type="hidden" name="ageGroup" value={ageGroup} />}
        </div>
      </form>

      {/* Rating Table */}
      {sportsmen.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium w-16">#</th>
                    <th className="text-left p-4 font-medium">Спортсмен</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Клуб</th>
                    <th className="text-left p-4 font-medium hidden sm:table-cell">Страна</th>
                    <th className="text-right p-4 font-medium">Рейтинг</th>
                  </tr>
                </thead>
                <tbody>
                  {sportsmen.map((sportsman, index) => {
                    const rank = (page - 1) * limit + index + 1
                    const clubTitle = sportsman.club
                      ? getTranslation(sportsman.club.title as Record<string, string>, locale as Locale)
                      : null

                    return (
                      <tr key={sportsman.id} className="border-b hover:bg-muted/30">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {rank <= 3 ? (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                rank === 2 ? 'bg-gray-100 text-gray-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                <Medal className="h-4 w-4" />
                              </div>
                            ) : (
                              <span className="w-8 text-center font-medium text-muted-foreground">
                                {rank}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/sportsmen/${sportsman.id}`}
                            className="font-medium hover:underline"
                          >
                            {sportsman.lastName} {sportsman.firstName}
                          </Link>
                          {sportsman.dan && sportsman.dan > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {sportsman.dan} дан
                            </span>
                          )}
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          {clubTitle ? (
                            <span className="text-sm text-muted-foreground">{clubTitle}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-4 hidden sm:table-cell">
                          {sportsman.country && (
                            <span className="text-sm">
                              {sportsman.country.flagEmoji}{' '}
                              {locale === 'en' ? sportsman.country.nameEn : sportsman.country.nameRu}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-bold text-primary">
                            {sportsman.rating}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Спортсмены не найдены</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Button asChild variant="outline">
              <Link href={`/ratings?discipline=${discipline}&page=${page - 1}${gender ? `&gender=${gender}` : ''}${ageGroup ? `&ageGroup=${ageGroup}` : ''}${search ? `&search=${search}` : ''}`}>
                Назад
              </Link>
            </Button>
          )}
          <span className="flex items-center px-4">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Button asChild variant="outline">
              <Link href={`/ratings?discipline=${discipline}&page=${page + 1}${gender ? `&gender=${gender}` : ''}${ageGroup ? `&ageGroup=${ageGroup}` : ''}${search ? `&search=${search}` : ''}`}>
                Вперёд
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
