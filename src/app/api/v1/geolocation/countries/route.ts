import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/v1/geolocation/countries - List countries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const locale = searchParams.get('locale') || 'ru'

    const where = activeOnly ? { isActive: true } : {}

    const countries = await prisma.country.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
      select: {
        id: true,
        code: true,
        codeAlpha3: true,
        nameEn: true,
        nameRu: true,
        nameKg: true,
        nameAr: true,
        phoneCode: true,
        currency: true,
        flagEmoji: true,
        isActive: true,
      },
    })

    // Transform to include localized name
    const data = countries.map((country: typeof countries[number]) => ({
      ...country,
      name: getLocalizedName(country, locale),
    }))

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get countries error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch countries' },
      { status: 500 }
    )
  }
}

function getLocalizedName(
  entity: { nameRu?: string | null; nameEn?: string | null; nameKg?: string | null; nameAr?: string | null },
  locale: string
): string {
  switch (locale) {
    case 'ru':
      return entity.nameRu || entity.nameEn || ''
    case 'kg':
      return entity.nameKg || entity.nameRu || entity.nameEn || ''
    case 'ar':
      return entity.nameAr || entity.nameEn || ''
    default:
      return entity.nameEn || entity.nameRu || ''
  }
}
