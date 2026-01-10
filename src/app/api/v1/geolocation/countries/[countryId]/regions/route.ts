import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/v1/geolocation/countries/:countryId/regions - List regions by country
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ countryId: string }> }
) {
  try {
    const { countryId } = await params
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const locale = searchParams.get('locale') || 'ru'

    const where: Record<string, unknown> = {
      countryId: parseInt(countryId),
    }

    if (activeOnly) {
      where.isActive = true
    }

    const regions = await prisma.region.findMany({
      where,
      orderBy: [{ ordering: 'asc' }, { nameRu: 'asc' }],
      select: {
        id: true,
        title: true,
        nameEn: true,
        nameRu: true,
        nameKg: true,
        nameAr: true,
        code: true,
        type: true,
        isActive: true,
        _count: {
          select: { cities: true },
        },
      },
    })

    // Transform to include localized name
    const data = regions.map((region: typeof regions[number]) => ({
      ...region,
      name: getLocalizedName(region, locale),
      citiesCount: region._count.cities,
    }))

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get regions error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch regions' },
      { status: 500 }
    )
  }
}

function getLocalizedName(
  entity: { nameRu?: string | null; nameEn?: string | null; nameKg?: string | null; nameAr?: string | null; title?: string | null },
  locale: string
): string {
  switch (locale) {
    case 'ru':
      return entity.nameRu || entity.title || entity.nameEn || ''
    case 'kg':
      return entity.nameKg || entity.nameRu || entity.title || entity.nameEn || ''
    case 'ar':
      return entity.nameAr || entity.nameEn || ''
    default:
      return entity.nameEn || entity.nameRu || entity.title || ''
  }
}
