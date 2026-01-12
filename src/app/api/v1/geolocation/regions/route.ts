import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/v1/geolocation/regions - Get regions for current federation's country
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    const countryId = searchParams.get('countryId')

    let where: Record<string, unknown> = {
      isActive: true,
    }

    // If countryId specified, use it
    if (countryId) {
      where.countryId = parseInt(countryId)
    } else if (user?.federationId) {
      // Get federation's country
      const federation = await prisma.federation.findUnique({
        where: { id: user.federationId },
        select: { countryId: true },
      })

      if (federation?.countryId) {
        where.countryId = federation.countryId
      }
    }

    const regions = await prisma.region.findMany({
      where,
      select: {
        id: true,
        nameRu: true,
        nameEn: true,
        nameKg: true,
        title: true,
        countryId: true,
      },
      orderBy: { nameRu: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: regions,
    })
  } catch (error) {
    console.error('Get regions error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch regions' },
      { status: 500 }
    )
  }
}
