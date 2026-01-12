import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/superadmin/locations/cities
export async function GET(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const regionId = searchParams.get('regionId')

  const cities = await prisma.city.findMany({
    where: regionId ? { regionId: parseInt(regionId) } : undefined,
    take: 100,
    orderBy: { nameRu: 'asc' },
    include: {
      region: {
        include: {
          country: {
            select: { code: true, nameRu: true, nameEn: true },
          },
        },
      },
    },
  })

  return NextResponse.json(cities)
}

// POST /api/superadmin/locations/cities
export async function POST(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { nameRu, nameEn, regionId, sortOrder, isActive } = body

    if (!regionId) {
      return NextResponse.json(
        { error: 'Region ID is required' },
        { status: 400 }
      )
    }

    if (!nameRu) {
      return NextResponse.json(
        { error: 'Название обязательно' },
        { status: 400 }
      )
    }

    const city = await prisma.city.create({
      data: {
        nameRu,
        nameEn: nameEn || null,
        regionId: parseInt(regionId),
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
      },
    })

    return NextResponse.json(city, { status: 201 })
  } catch (error) {
    console.error('Failed to create city:', error)
    return NextResponse.json(
      { error: 'Failed to create city' },
      { status: 500 }
    )
  }
}
