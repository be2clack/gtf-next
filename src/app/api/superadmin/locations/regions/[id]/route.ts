import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/superadmin/locations/regions/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const region = await prisma.region.findUnique({
    where: { id: parseInt(id) },
    include: {
      country: {
        select: { id: true, code: true, nameRu: true, nameEn: true },
      },
      _count: {
        select: { cities: true },
      },
    },
  })

  if (!region) {
    return NextResponse.json({ error: 'Регион не найден' }, { status: 404 })
  }

  return NextResponse.json(region)
}

// PUT /api/superadmin/locations/regions/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { code, nameRu, nameEn, countryId, ordering, isActive } = body

    // Check if code is being changed and if new code exists
    if (code) {
      const existing = await prisma.region.findFirst({
        where: {
          code: code.toLowerCase(),
          NOT: { id: parseInt(id) },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Регион с таким кодом уже существует' },
          { status: 400 }
        )
      }
    }

    const region = await prisma.region.update({
      where: { id: parseInt(id) },
      data: {
        ...(code !== undefined && { code: code ? code.toLowerCase() : null }),
        ...(nameRu !== undefined && { nameRu }),
        ...(nameEn !== undefined && { nameEn: nameEn || null }),
        ...(countryId && { countryId: parseInt(countryId) }),
        ...(ordering !== undefined && { ordering }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(region)
  } catch (error) {
    console.error('Failed to update region:', error)
    return NextResponse.json(
      { error: 'Failed to update region' },
      { status: 500 }
    )
  }
}

// DELETE /api/superadmin/locations/regions/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if region has cities
    const region = await prisma.region.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { cities: true },
        },
      },
    })

    if (!region) {
      return NextResponse.json({ error: 'Регион не найден' }, { status: 404 })
    }

    if (region._count.cities > 0) {
      return NextResponse.json(
        { error: `Невозможно удалить: есть связанные города (${region._count.cities})` },
        { status: 400 }
      )
    }

    await prisma.region.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete region:', error)
    return NextResponse.json(
      { error: 'Failed to delete region' },
      { status: 500 }
    )
  }
}
