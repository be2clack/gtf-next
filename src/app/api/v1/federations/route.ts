import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'

// GET /api/v1/federations - List federations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const locale = (searchParams.get('locale') || 'ru') as Locale

    const where = activeOnly
      ? { status: 'ACTIVE' as const, deletedAt: null }
      : { deletedAt: null }

    const federations = await prisma.federation.findMany({
      where,
      include: {
        country: {
          select: {
            id: true,
            code: true,
            nameRu: true,
            nameEn: true,
            flagEmoji: true,
          },
        },
        _count: {
          select: {
            sportsmen: true,
            clubs: true,
            trainers: true,
            competitions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Transform for locale
    const data = federations.map((fed: typeof federations[number]) => ({
      id: fed.id,
      code: fed.code,
      name: fed.name,
      nameEn: fed.nameEn,
      fullName: getTranslation(fed.fullName as Record<string, string>, locale),
      domain: fed.domain,
      customDomain: fed.customDomain,
      logo: fed.logo,
      heroBackground: fed.heroBackground,
      description: getTranslation(fed.description as Record<string, string>, locale),
      siteTitle: getTranslation(fed.siteTitle as Record<string, string>, locale),
      status: fed.status,
      timezone: fed.timezone,
      currency: fed.currency,
      languages: fed.languages,
      primaryLanguage: fed.primaryLanguage,
      contactEmail: fed.contactEmail,
      contactPhone: fed.contactPhone,
      instagram: fed.instagram,
      facebook: fed.facebook,
      youtube: fed.youtube,
      foundedDate: fed.foundedDate,
      country: fed.country,
      stats: {
        sportsmenCount: fed._count.sportsmen,
        clubsCount: fed._count.clubs,
        trainersCount: fed._count.trainers,
        competitionsCount: fed._count.competitions,
      },
    }))

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get federations error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch federations' },
      { status: 500 }
    )
  }
}
