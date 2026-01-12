import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/superadmin/competitions/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const competition = await prisma.competition.findUnique({
    where: { id: parseInt(id) },
    include: {
      federation: {
        select: { id: true, code: true, name: true },
      },
      country: {
        select: { id: true, code: true, nameRu: true, nameEn: true },
      },
      region: {
        select: { id: true, code: true, nameRu: true, nameEn: true },
      },
      city: {
        select: { id: true, nameRu: true, nameEn: true },
      },
      disciplines: {
        include: {
          discipline: true,
        },
      },
      categories: {
        include: {
          ageCategory: true,
          weightCategory: true,
          beltCategory: true,
        },
      },
      _count: {
        select: {
          registrations: true,
          categories: true,
          disciplines: true,
        },
      },
    },
  })

  if (!competition) {
    return NextResponse.json({ error: 'Соревнование не найдено' }, { status: 404 })
  }

  return NextResponse.json(competition)
}

// PUT /api/superadmin/competitions/[id]
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
    const {
      federationId,
      titleRu,
      titleEn,
      descriptionRu,
      descriptionEn,
      venueRu,
      venueEn,
      countryId,
      regionId,
      cityId,
      startDate,
      endDate,
      registrationDeadline,
      withdrawalDeadline,
      status,
      type,
      level,
      ratingType,
      isPaid,
      registrationFee,
      baseRegistrationFee,
      additionalDisciplineFee,
      currency,
      tatamiCount,
      cancellationReason,
    } = body

    const updateData: Record<string, unknown> = {}

    if (federationId !== undefined) updateData.federationId = parseInt(federationId)
    if (titleRu !== undefined || titleEn !== undefined) {
      updateData.title = {
        ru: titleRu || '',
        en: titleEn || '',
      }
    }
    if (descriptionRu !== undefined || descriptionEn !== undefined) {
      updateData.description = {
        ru: descriptionRu || '',
        en: descriptionEn || '',
      }
    }
    if (venueRu !== undefined || venueEn !== undefined) {
      updateData.venue = {
        ru: venueRu || '',
        en: venueEn || '',
      }
    }
    if (countryId !== undefined) updateData.countryId = countryId ? parseInt(countryId) : null
    if (regionId !== undefined) updateData.regionId = regionId ? parseInt(regionId) : null
    if (cityId !== undefined) updateData.cityId = cityId ? parseInt(cityId) : null
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = new Date(endDate)
    if (registrationDeadline !== undefined) updateData.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : null
    if (withdrawalDeadline !== undefined) updateData.withdrawalDeadline = withdrawalDeadline ? new Date(withdrawalDeadline) : null
    if (status !== undefined) updateData.status = status
    if (type !== undefined) {
      updateData.type = type
      updateData.format = type
    }
    if (level !== undefined) updateData.level = level
    if (ratingType !== undefined) updateData.ratingType = ratingType
    if (isPaid !== undefined) updateData.isPaid = isPaid
    if (registrationFee !== undefined) updateData.registrationFee = registrationFee ? parseFloat(registrationFee) : null
    if (baseRegistrationFee !== undefined) updateData.baseRegistrationFee = baseRegistrationFee ? parseFloat(baseRegistrationFee) : null
    if (additionalDisciplineFee !== undefined) updateData.additionalDisciplineFee = additionalDisciplineFee ? parseFloat(additionalDisciplineFee) : null
    if (currency !== undefined) updateData.currency = currency
    if (tatamiCount !== undefined) updateData.tatamiCount = parseInt(tatamiCount)
    if (cancellationReason !== undefined) updateData.cancellationReason = cancellationReason

    const competition = await prisma.competition.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        federation: {
          select: { id: true, code: true, name: true },
        },
      },
    })

    return NextResponse.json(competition)
  } catch (error) {
    console.error('Failed to update competition:', error)
    return NextResponse.json(
      { error: 'Failed to update competition' },
      { status: 500 }
    )
  }
}

// DELETE /api/superadmin/competitions/[id]
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
    const competition = await prisma.competition.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    })

    if (!competition) {
      return NextResponse.json({ error: 'Соревнование не найдено' }, { status: 404 })
    }

    if (competition._count.registrations > 0) {
      // Soft delete if has registrations
      await prisma.competition.update({
        where: { id: parseInt(id) },
        data: {
          deletedAt: new Date(),
          status: 'CANCELLED',
        },
      })
    } else {
      // Hard delete if no registrations
      await prisma.competition.delete({
        where: { id: parseInt(id) },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete competition:', error)
    return NextResponse.json(
      { error: 'Failed to delete competition' },
      { status: 500 }
    )
  }
}
