import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/superadmin/federations/[id] - Get federation details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const federation = await prisma.federation.findUnique({
    where: { id: parseInt(id) },
    include: {
      country: true,
      admins: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          sportsmen: true,
          clubs: true,
          competitions: true,
          trainers: true,
          judges: true,
        },
      },
    },
  })

  if (!federation) {
    return NextResponse.json({ error: 'Federation not found' }, { status: 404 })
  }

  return NextResponse.json(federation)
}

// PUT /api/superadmin/federations/[id] - Update federation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { name, countryId, currency, timezone, domain, status } = body

    const federation = await prisma.federation.update({
      where: { id: parseInt(id) },
      data: {
        name,
        countryId: countryId ? parseInt(countryId) : undefined,
        currency,
        timezone,
        domain,
        status,
      },
    })

    return NextResponse.json(federation)
  } catch (error) {
    console.error('Failed to update federation:', error)
    return NextResponse.json(
      { error: 'Failed to update federation' },
      { status: 500 }
    )
  }
}

// DELETE /api/superadmin/federations/[id] - Delete federation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if federation has any data
    const federation = await prisma.federation.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            sportsmen: true,
            clubs: true,
            competitions: true,
          },
        },
      },
    })

    if (!federation) {
      return NextResponse.json({ error: 'Federation not found' }, { status: 404 })
    }

    const totalData =
      federation._count.sportsmen +
      federation._count.clubs +
      federation._count.competitions

    if (totalData > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete federation with existing data. Please delete all sportsmen, clubs, and competitions first.',
        },
        { status: 400 }
      )
    }

    await prisma.federation.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete federation:', error)
    return NextResponse.json(
      { error: 'Failed to delete federation' },
      { status: 500 }
    )
  }
}
