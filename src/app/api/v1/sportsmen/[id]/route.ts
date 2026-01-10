import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { transliterateName } from '@/lib/utils/transliterate'

// GET /api/v1/sportsmen/:id - Get single sportsman
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const sportsman = await prisma.sportsman.findUnique({
      where: { id: parseInt(id) },
      include: {
        federation: { select: { id: true, code: true, name: true } },
        club: { select: { id: true, title: true } },
        trainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        country: { select: { id: true, code: true, nameRu: true, nameEn: true } },
        region: { select: { id: true, nameRu: true, nameEn: true } },
        city: { select: { id: true, nameRu: true, nameEn: true } },
        attestations: {
          orderBy: { examDate: 'desc' },
          take: 10,
        },
        weightHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
        ratings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        representatives: {
          include: {
            representative: true,
          },
        },
      },
    })

    if (!sportsman) {
      return NextResponse.json(
        { success: false, error: 'Sportsman not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: sportsman,
    })
  } catch (error) {
    console.error('Get sportsman error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sportsman' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/sportsmen/:id - Update sportsman
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Check if sportsman exists
    const existing = await prisma.sportsman.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Sportsman not found' },
        { status: 404 }
      )
    }

    // Check permissions
    // Admins can edit any sportsman in their federation
    // Users can edit sportsmen linked to their user account (through entityId)
    const linkedUser = await prisma.user.findFirst({
      where: {
        entityId: existing.id,
        type: 'SPORTSMAN',
      },
    })
    const canEdit =
      user.type === 'ADMIN' ||
      (linkedUser && linkedUser.id === user.id)

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const {
      firstName,
      lastName,
      middleName,
      dateOfBirth,
      sex,
      phone,
      clubId,
      trainerId,
      countryId,
      regionId,
      cityId,
      beltLevel,
      weight,
      instagram,
    } = body

    // Update Latin names if name changed
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

    // Update sportsman
    const sportsman = await prisma.sportsman.update({
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
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        ...(sex !== undefined && { sex: sex === 'female' ? 1 : 0 }),
        ...(phone !== undefined && { phone }),
        ...(clubId !== undefined && { clubId: clubId ? parseInt(clubId) : null }),
        ...(trainerId !== undefined && { trainerId: trainerId ? parseInt(trainerId) : null }),
        ...(countryId !== undefined && { countryId: countryId ? parseInt(countryId) : null }),
        ...(regionId !== undefined && { regionId: regionId ? parseInt(regionId) : null }),
        ...(cityId !== undefined && { cityId: cityId ? parseInt(cityId) : null }),
        ...(beltLevel !== undefined && {
          beltLevel,
          level: beltLevel,
          gyp: beltLevel > 0 ? beltLevel : 10,
          dan: beltLevel <= 0 ? Math.abs(beltLevel) + 1 : 0,
        }),
        ...(weight !== undefined && { weight: weight ? parseFloat(weight) : null }),
        ...(instagram !== undefined && { instagram }),
      },
      include: {
        club: { select: { id: true, title: true } },
        trainer: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Record weight history if weight changed
    if (weight !== undefined && weight !== existing.weight) {
      await prisma.weightHistory.create({
        data: {
          sportsmanId: sportsman.id,
          weight: parseFloat(weight),
          notes: 'Updated via profile',
        },
      })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'sportsmen',
        description: `Updated sportsman: ${sportsman.lastName} ${sportsman.firstName}`,
        subjectType: 'Sportsman',
        subjectId: sportsman.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'update', changes: body },
      },
    })

    return NextResponse.json({
      success: true,
      data: sportsman,
    })
  } catch (error) {
    console.error('Update sportsman error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update sportsman' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/sportsmen/:id - Delete sportsman
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

    const sportsman = await prisma.sportsman.findUnique({
      where: { id: parseInt(id) },
    })

    if (!sportsman) {
      return NextResponse.json(
        { success: false, error: 'Sportsman not found' },
        { status: 404 }
      )
    }

    // Check federation access
    if (user.federationId && sportsman.federationId !== user.federationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete sportsman
    await prisma.sportsman.delete({
      where: { id: parseInt(id) },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'sportsmen',
        description: `Deleted sportsman: ${sportsman.lastName} ${sportsman.firstName}`,
        subjectType: 'Sportsman',
        subjectId: sportsman.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'delete' },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Sportsman deleted successfully',
    })
  } catch (error) {
    console.error('Delete sportsman error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete sportsman' },
      { status: 500 }
    )
  }
}
