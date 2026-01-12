import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getTranslation } from '@/lib/utils/multilingual'

// GET /api/v1/clubs/:id - Get single club
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const club = await prisma.club.findUnique({
      where: { id: parseInt(id) },
      include: {
        federation: { select: { id: true, code: true, name: true } },
        country: { select: { id: true, code: true, nameRu: true, nameEn: true } },
        region: { select: { id: true, nameRu: true, nameEn: true } },
        city: { select: { id: true, nameRu: true, nameEn: true } },
        trainers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fio: true,
            photo: true,
            rank: true,
          },
          take: 20,
        },
        _count: {
          select: {
            sportsmen: true,
            trainers: true,
          },
        },
      },
    })

    if (!club) {
      return NextResponse.json(
        { success: false, error: 'Club not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...club,
        sportsmenCount: club._count.sportsmen,
        trainersCount: club._count.trainers,
      },
    })
  } catch (error) {
    console.error('Get club error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch club' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/clubs/:id - Update club
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Check if club exists
    const existing = await prisma.club.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Club not found' },
        { status: 404 }
      )
    }

    // Check federation access
    if (user.federationId && existing.federationId !== user.federationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const {
      title,
      description,
      address,
      instagram,
      phone,
      regionId,
      cityId,
    } = body

    // Update club
    const club = await prisma.club.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && {
          title: typeof title === 'string' ? { ru: title } : title,
        }),
        ...(description !== undefined && {
          description: description
            ? typeof description === 'string'
              ? { ru: description }
              : description
            : null,
        }),
        ...(address !== undefined && {
          address: address
            ? typeof address === 'string'
              ? { ru: address }
              : address
            : null,
        }),
        ...(instagram !== undefined && { instagram }),
        ...(phone !== undefined && { phone }),
        ...(regionId !== undefined && { regionId: regionId ? parseInt(regionId) : null }),
        ...(cityId !== undefined && { cityId: cityId ? parseInt(cityId) : null }),
      },
      include: {
        region: { select: { id: true, nameRu: true } },
        city: { select: { id: true, nameRu: true } },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'clubs',
        description: `Updated club: ${getTranslation(club.title as Record<string, string>, 'ru')}`,
        subjectType: 'Club',
        subjectId: club.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'update', changes: body },
      },
    })

    return NextResponse.json({
      success: true,
      data: club,
    })
  } catch (error) {
    console.error('Update club error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update club' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/clubs/:id - Delete club
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params

    const club = await prisma.club.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: { select: { sportsmen: true, trainers: true } },
      },
    })

    if (!club) {
      return NextResponse.json(
        { success: false, error: 'Club not found' },
        { status: 404 }
      )
    }

    // Check federation access
    if (user.federationId && club.federationId !== user.federationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if club has sportsmen or trainers
    if (club._count.sportsmen > 0 || club._count.trainers > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Невозможно удалить клуб: ${club._count.sportsmen} спортсмен(ов), ${club._count.trainers} тренер(ов)`
        },
        { status: 400 }
      )
    }

    // Delete club
    await prisma.club.delete({
      where: { id: parseInt(id) },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'clubs',
        description: `Deleted club: ${getTranslation(club.title as Record<string, string>, 'ru')}`,
        subjectType: 'Club',
        subjectId: club.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'delete' },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Club deleted successfully',
    })
  } catch (error) {
    console.error('Delete club error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete club' },
      { status: 500 }
    )
  }
}
