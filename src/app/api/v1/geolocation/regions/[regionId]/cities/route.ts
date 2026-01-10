import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/v1/geolocation/regions/:regionId/cities - List cities by region
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ regionId: string }> }
) {
  try {
    const { regionId } = await params
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const locale = searchParams.get('locale') || 'ru'

    const where: Record<string, unknown> = {
      regionId: parseInt(regionId),
    }

    if (activeOnly) {
      where.isActive = true
    }

    const cities = await prisma.city.findMany({
      where,
      orderBy: [{ isCapital: 'desc' }, { sortOrder: 'asc' }, { nameRu: 'asc' }],
      select: {
        id: true,
        nameEn: true,
        nameRu: true,
        nameKg: true,
        nameAr: true,
        latitude: true,
        longitude: true,
        postalCode: true,
        population: true,
        isCapital: true,
        isActive: true,
      },
    })

    // Transform to include localized name
    const data = cities.map((city: typeof cities[number]) => ({
      ...city,
      name: getLocalizedName(city, locale),
      coordinates: city.latitude && city.longitude
        ? { lat: Number(city.latitude), lng: Number(city.longitude) }
        : null,
    }))

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get cities error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cities' },
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
