import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/superadmin/locations/countries
export async function GET() {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const countries = await prisma.country.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          regions: true,
          federations: true,
        },
      },
    },
  })

  return NextResponse.json(countries)
}

// POST /api/superadmin/locations/countries
export async function POST(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { code, nameRu, nameEn, phoneCode, flagEmoji, sortOrder, isActive } = body

    // Check if code already exists
    const existing = await prisma.country.findFirst({
      where: { code: code.toUpperCase() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Страна с таким кодом уже существует' },
        { status: 400 }
      )
    }

    const country = await prisma.country.create({
      data: {
        code: code.toUpperCase(),
        nameRu,
        nameEn,
        phoneCode: phoneCode || null,
        flagEmoji: flagEmoji || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
      },
    })

    return NextResponse.json(country, { status: 201 })
  } catch (error) {
    console.error('Failed to create country:', error)
    return NextResponse.json(
      { error: 'Failed to create country' },
      { status: 500 }
    )
  }
}
