import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/superadmin/locations/cities/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const city = await prisma.city.findUnique({
    where: { id: parseInt(id) },
    include: {
      region: {
        include: {
          country: {
            select: { id: true, code: true, nameRu: true, nameEn: true },
          },
        },
      },
    },
  })

  if (!city) {
    return NextResponse.json({ error: 'Город не найден' }, { status: 404 })
  }

  return NextResponse.json(city)
}

// PUT /api/superadmin/locations/cities/[id]
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
    const { nameRu, nameEn, regionId, sortOrder, isActive } = body

    const city = await prisma.city.update({
      where: { id: parseInt(id) },
      data: {
        ...(nameRu !== undefined && { nameRu }),
        ...(nameEn !== undefined && { nameEn: nameEn || null }),
        ...(regionId && { regionId: parseInt(regionId) }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(city)
  } catch (error) {
    console.error('Failed to update city:', error)
    return NextResponse.json(
      { error: 'Failed to update city' },
      { status: 500 }
    )
  }
}

// DELETE /api/superadmin/locations/cities/[id]
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
    // Check if city is used somewhere (clubs, athletes, etc.)
    const city = await prisma.city.findUnique({
      where: { id: parseInt(id) },
    })

    if (!city) {
      return NextResponse.json({ error: 'Город не найден' }, { status: 404 })
    }

    // TODO: Add checks for related clubs, athletes, etc.

    await prisma.city.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete city:', error)
    return NextResponse.json(
      { error: 'Failed to delete city' },
      { status: 500 }
    )
  }
}
