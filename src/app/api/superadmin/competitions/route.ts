import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/superadmin/competitions
export async function GET(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const federationId = searchParams.get('federationId')
  const status = searchParams.get('status')

  const competitions = await prisma.competition.findMany({
    where: {
      ...(federationId && { federationId: parseInt(federationId) }),
      ...(status && { status: status as 'DRAFT' | 'PUBLISHED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'DRAW_COMPLETED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' }),
      deletedAt: null,
    },
    orderBy: { startDate: 'desc' },
    include: {
      federation: {
        select: { id: true, code: true, name: true },
      },
      country: {
        select: { id: true, code: true, nameRu: true, nameEn: true },
      },
      city: {
        select: { id: true, nameRu: true, nameEn: true },
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

  return NextResponse.json(competitions)
}

// POST /api/superadmin/competitions
export async function POST(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
      currency,
      tatamiCount,
    } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Даты начала и окончания обязательны' },
        { status: 400 }
      )
    }

    if (!federationId) {
      return NextResponse.json(
        { error: 'Федерация обязательна' },
        { status: 400 }
      )
    }

    const competition = await prisma.competition.create({
      data: {
        federationId: parseInt(federationId),
        title: {
          ru: titleRu || '',
          en: titleEn || '',
        },
        description: descriptionRu || descriptionEn ? {
          ru: descriptionRu || '',
          en: descriptionEn || '',
        } : Prisma.JsonNull,
        venue: venueRu || venueEn ? {
          ru: venueRu || '',
          en: venueEn || '',
        } : Prisma.JsonNull,
        countryId: countryId ? parseInt(countryId) : null,
        regionId: regionId ? parseInt(regionId) : null,
        cityId: cityId ? parseInt(cityId) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        withdrawalDeadline: withdrawalDeadline ? new Date(withdrawalDeadline) : null,
        status: status || 'DRAFT',
        type: type || 'MIXED',
        format: type || 'MIXED',
        level: level || 'NATIONAL',
        ratingType: ratingType || 'OFFICIAL',
        isPaid: isPaid === true,
        registrationFee: registrationFee ? parseFloat(registrationFee) : null,
        currency: currency || 'KGS',
        tatamiCount: tatamiCount ? parseInt(tatamiCount) : 1,
      },
      include: {
        federation: {
          select: { id: true, code: true, name: true },
        },
      },
    })

    return NextResponse.json(competition, { status: 201 })
  } catch (error) {
    console.error('Failed to create competition:', error)
    return NextResponse.json(
      { error: 'Failed to create competition' },
      { status: 500 }
    )
  }
}
