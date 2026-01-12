import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/superadmin/locations/regions
export async function GET(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const countryId = searchParams.get('countryId')

  const regions = await prisma.region.findMany({
    where: countryId ? { countryId: parseInt(countryId) } : undefined,
    orderBy: { nameRu: 'asc' },
    include: {
      country: {
        select: { code: true, nameRu: true, nameEn: true },
      },
      _count: {
        select: { cities: true },
      },
    },
  })

  return NextResponse.json(regions)
}

// POST /api/superadmin/locations/regions
export async function POST(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { code, nameRu, nameEn, countryId, ordering, isActive } = body

    if (!countryId) {
      return NextResponse.json(
        { error: 'Country ID is required' },
        { status: 400 }
      )
    }

    // Check if code already exists (if provided)
    if (code) {
      const existing = await prisma.region.findFirst({
        where: { code: code.toLowerCase() },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Регион с таким кодом уже существует' },
          { status: 400 }
        )
      }
    }

    const region = await prisma.region.create({
      data: {
        code: code ? code.toLowerCase() : null,
        nameRu,
        nameEn: nameEn || null,
        countryId: parseInt(countryId),
        ordering: ordering || 0,
        isActive: isActive !== false,
      },
    })

    return NextResponse.json(region, { status: 201 })
  } catch (error) {
    console.error('Failed to create region:', error)
    return NextResponse.json(
      { error: 'Failed to create region' },
      { status: 500 }
    )
  }
}
