import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { transliterateName } from '@/lib/utils/transliterate'

// GET /api/v1/trainers/:id - Get single trainer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const trainer = await prisma.trainer.findUnique({
      where: { id: parseInt(id) },
      include: {
        federation: { select: { id: true, code: true, name: true } },
        club: { select: { id: true, title: true } },
        country: { select: { id: true, code: true, nameRu: true, nameEn: true } },
        region: { select: { id: true, nameRu: true, nameEn: true } },
        city: { select: { id: true, nameRu: true, nameEn: true } },
        sportsmen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fio: true,
            photo: true,
            gyp: true,
            dan: true,
          },
          take: 20,
        },
        attestations: {
          where: { status: true },
          orderBy: { examDate: 'desc' },
          take: 10,
        },
      },
    })

    if (!trainer) {
      return NextResponse.json(
        { success: false, error: 'Trainer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: trainer,
    })
  } catch (error) {
    console.error('Get trainer error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trainer' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/trainers/:id - Update trainer
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

    // Check if trainer exists
    const existing = await prisma.trainer.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Trainer not found' },
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
      firstName,
      lastName,
      middleName,
      phone,
      dateOfBirth,
      dateStart,
      clubId,
      regionId,
      cityId,
      rank,
      position,
      instagram,
      description,
      contacts,
    } = body

    // Generate Latin names if name changed
    const nameChanged =
      firstName !== existing.firstName ||
      lastName !== existing.lastName ||
      middleName !== existing.middleName

    const latinNames = nameChanged
      ? transliterateName(
          firstName || existing.firstName,
          lastName || existing.lastName,
          middleName || existing.middleName
        )
      : null

    // Update trainer
    const trainer = await prisma.trainer.update({
      where: { id: parseInt(id) },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(middleName !== undefined && { middleName }),
        ...(latinNames && {
          firstNameLatin: latinNames.firstNameLatin,
          lastNameLatin: latinNames.lastNameLatin,
          middleNameLatin: latinNames.middleNameLatin,
        }),
        ...((firstName || lastName) && {
          fio: `${lastName || existing.lastName} ${firstName || existing.firstName} ${middleName || existing.middleName || ''}`.trim(),
        }),
        ...(phone !== undefined && { phone }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        ...(dateStart !== undefined && { dateStart: dateStart ? new Date(dateStart) : null }),
        ...(clubId !== undefined && { clubId: clubId ? parseInt(clubId) : null }),
        ...(regionId !== undefined && { regionId: regionId ? parseInt(regionId) : null }),
        ...(cityId !== undefined && { cityId: cityId ? parseInt(cityId) : null }),
        ...(rank !== undefined && { rank: rank?.toUpperCase() || 'COACH' }),
        ...(position !== undefined && { position }),
        ...(instagram !== undefined && { instagram }),
        ...(description !== undefined && { description }),
        ...(contacts !== undefined && { contacts }),
      },
      include: {
        club: { select: { id: true, title: true } },
        region: { select: { id: true, nameRu: true } },
        city: { select: { id: true, nameRu: true } },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'trainers',
        description: `Updated trainer: ${trainer.lastName} ${trainer.firstName}`,
        subjectType: 'Trainer',
        subjectId: trainer.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'update', changes: body },
      },
    })

    return NextResponse.json({
      success: true,
      data: trainer,
    })
  } catch (error) {
    console.error('Update trainer error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update trainer' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/trainers/:id - Delete trainer
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

    const trainer = await prisma.trainer.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: { select: { sportsmen: true } },
      },
    })

    if (!trainer) {
      return NextResponse.json(
        { success: false, error: 'Trainer not found' },
        { status: 404 }
      )
    }

    // Check federation access
    if (user.federationId && trainer.federationId !== user.federationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if trainer has sportsmen
    if (trainer._count.sportsmen > 0) {
      return NextResponse.json(
        { success: false, error: `Невозможно удалить тренера: у него ${trainer._count.sportsmen} спортсмен(ов)` },
        { status: 400 }
      )
    }

    // Delete trainer
    await prisma.trainer.delete({
      where: { id: parseInt(id) },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'trainers',
        description: `Deleted trainer: ${trainer.lastName} ${trainer.firstName}`,
        subjectType: 'Trainer',
        subjectId: trainer.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'delete' },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Trainer deleted successfully',
    })
  } catch (error) {
    console.error('Delete trainer error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete trainer' },
      { status: 500 }
    )
  }
}
