import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'

// GET /api/v1/competitions - List competitions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const federationId = searchParams.get('federationId')
    const status = searchParams.get('status')
    const level = searchParams.get('level')
    const upcoming = searchParams.get('upcoming') === 'true'
    const locale = (searchParams.get('locale') || 'ru') as Locale

    // Build where clause
    const where: Record<string, unknown> = {
      deletedAt: null,
    }

    if (federationId) {
      where.federationId = parseInt(federationId)
    }

    if (status) {
      where.status = status.toUpperCase()
    } else {
      // Default: exclude draft for public
      where.status = { not: 'DRAFT' }
    }

    if (level) {
      where.level = level.toUpperCase()
    }

    if (upcoming) {
      where.startDate = { gte: new Date() }
    }

    // Get total count
    const total = await prisma.competition.count({ where })

    // Get competitions
    const competitions = await prisma.competition.findMany({
      where,
      include: {
        federation: { select: { id: true, code: true, name: true } },
        country: { select: { id: true, nameRu: true, nameEn: true } },
        region: { select: { id: true, nameRu: true, nameEn: true } },
        city: { select: { id: true, nameRu: true, nameEn: true } },
        _count: {
          select: {
            registrations: true,
            categories: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Transform for locale
    const data = competitions.map((comp: typeof competitions[number]) => ({
      ...comp,
      title: getTranslation(comp.title as Record<string, string>, locale),
      description: getTranslation(comp.description as Record<string, string>, locale),
      venue: getTranslation(comp.venue as Record<string, string>, locale),
    }))

    return NextResponse.json({
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get competitions error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch competitions' },
      { status: 500 }
    )
  }
}

// POST /api/v1/competitions - Create competition
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const {
      title,
      description,
      venue,
      startDate,
      endDate,
      registrationDeadline,
      level,
      type,
      format,
      ratingType,
      countryId,
      regionId,
      cityId,
      isPaid,
      baseRegistrationFee,
      additionalDisciplineFee,
      currency,
      tatamiCount,
      medicalCheckRequired,
      federationId: bodyFederationId,
    } = body

    // Validate required fields
    if (!title || !startDate || !endDate || !level) {
      return NextResponse.json(
        { success: false, error: 'Title, dates, and level are required' },
        { status: 400 }
      )
    }

    const federationId = bodyFederationId || user.federationId

    // Create competition
    const competition = await prisma.competition.create({
      data: {
        federationId,
        title: typeof title === 'string' ? { ru: title } : title,
        description: description
          ? typeof description === 'string'
            ? { ru: description }
            : description
          : null,
        venue: venue
          ? typeof venue === 'string'
            ? { ru: venue }
            : venue
          : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline)
          : null,
        level: level.toUpperCase(),
        type: (type || 'MIXED').toUpperCase(),
        format: (format || type || 'MIXED').toUpperCase(),
        ratingType: (ratingType || 'OFFICIAL').toUpperCase(),
        countryId: countryId ? parseInt(countryId) : null,
        regionId: regionId ? parseInt(regionId) : null,
        cityId: cityId ? parseInt(cityId) : null,
        isPaid: isPaid || false,
        baseRegistrationFee: baseRegistrationFee
          ? parseFloat(baseRegistrationFee)
          : null,
        additionalDisciplineFee: additionalDisciplineFee
          ? parseFloat(additionalDisciplineFee)
          : null,
        currency: currency || 'KGS',
        tatamiCount: tatamiCount || 1,
        medicalCheckRequired: medicalCheckRequired ?? true,
        status: 'DRAFT',
        createdById: user.id,
        updatedById: user.id,
      },
      include: {
        federation: { select: { id: true, code: true, name: true } },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'competitions',
        description: `Created competition: ${getTranslation(competition.title as Record<string, string>, 'ru')}`,
        subjectType: 'Competition',
        subjectId: competition.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'create' },
      },
    })

    return NextResponse.json({
      success: true,
      data: competition,
    })
  } catch (error) {
    console.error('Create competition error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create competition' },
      { status: 500 }
    )
  }
}
