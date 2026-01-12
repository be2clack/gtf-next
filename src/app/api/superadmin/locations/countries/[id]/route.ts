import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/superadmin/locations/countries/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const country = await prisma.country.findUnique({
    where: { id: parseInt(id) },
    include: {
      _count: {
        select: {
          regions: true,
          federations: true,
        },
      },
    },
  })

  if (!country) {
    return NextResponse.json({ error: 'Страна не найдена' }, { status: 404 })
  }

  return NextResponse.json(country)
}

// PUT /api/superadmin/locations/countries/[id]
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
    const { code, nameRu, nameEn, phoneCode, flagEmoji, sortOrder, isActive } = body

    // Check if code is being changed and if new code exists
    if (code) {
      const existing = await prisma.country.findFirst({
        where: {
          code: code.toUpperCase(),
          NOT: { id: parseInt(id) },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Страна с таким кодом уже существует' },
          { status: 400 }
        )
      }
    }

    const country = await prisma.country.update({
      where: { id: parseInt(id) },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(nameRu !== undefined && { nameRu }),
        ...(nameEn !== undefined && { nameEn }),
        ...(phoneCode !== undefined && { phoneCode: phoneCode || null }),
        ...(flagEmoji !== undefined && { flagEmoji: flagEmoji || null }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(country)
  } catch (error) {
    console.error('Failed to update country:', error)
    return NextResponse.json(
      { error: 'Failed to update country' },
      { status: 500 }
    )
  }
}

// DELETE /api/superadmin/locations/countries/[id]
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
    // Check if country has regions or federations
    const country = await prisma.country.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            regions: true,
            federations: true,
          },
        },
      },
    })

    if (!country) {
      return NextResponse.json({ error: 'Страна не найдена' }, { status: 404 })
    }

    if (country._count.regions > 0) {
      return NextResponse.json(
        { error: `Невозможно удалить: есть связанные регионы (${country._count.regions})` },
        { status: 400 }
      )
    }

    if (country._count.federations > 0) {
      return NextResponse.json(
        { error: `Невозможно удалить: есть связанные федерации (${country._count.federations})` },
        { status: 400 }
      )
    }

    await prisma.country.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete country:', error)
    return NextResponse.json(
      { error: 'Failed to delete country' },
      { status: 500 }
    )
  }
}
