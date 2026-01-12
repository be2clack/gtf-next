import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'
import path from 'path'
import fs from 'fs/promises'

// Helper function to save uploaded file
async function saveUploadedFile(file: File, subdir: string): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subdir)
  await fs.mkdir(uploadDir, { recursive: true })

  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`
  const filepath = path.join(uploadDir, filename)

  await fs.writeFile(filepath, buffer)
  return filename
}

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

    const contentType = request.headers.get('content-type') || ''
    let body: Record<string, unknown> = {}

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      for (const [key, value] of formData.entries()) {
        if (key === 'photo' && value instanceof File && value.size > 0) {
          body.photo = await saveUploadedFile(value, 'competitions')
        } else if (value !== '' && value !== 'undefined' && value !== 'null') {
          // Try to parse JSON for multilingual fields
          if (['title', 'description', 'venue'].includes(key) && typeof value === 'string') {
            try {
              body[key] = JSON.parse(value)
            } catch {
              body[key] = value
            }
          } else {
            body[key] = value
          }
        }
      }
    } else {
      body = await request.json()
    }

    const {
      title,
      description,
      venue,
      photo,
      startDate,
      endDate,
      registrationDeadline,
      withdrawalDeadline,
      weighInDate,
      level,
      type,
      teamType,
      format,
      ratingType,
      rulesVersion,
      countryId,
      regionId,
      cityId,
      isPaid,
      registrationFee,
      baseRegistrationFee,
      additionalDisciplineFee,
      teamRegistrationFeePerPerson,
      currency,
      tatamiCount,
      medicalCheckRequired,
      insuranceRequired,
      federationId: bodyFederationId,
    } = body as Record<string, unknown>

    // Validate required fields
    if (!title || !startDate || !endDate || !level) {
      return NextResponse.json(
        { success: false, error: 'Title, dates, and level are required' },
        { status: 400 }
      )
    }

    const federationId = (bodyFederationId as number) || user.federationId

    // Create competition
    const competition = await prisma.competition.create({
      data: {
        federationId,
        title: typeof title === 'string' ? { ru: title } : (title as Record<string, string>),
        description: description
          ? typeof description === 'string'
            ? { ru: description }
            : (description as Record<string, string>)
          : Prisma.JsonNull,
        venue: venue
          ? typeof venue === 'string'
            ? { ru: venue }
            : (venue as Record<string, string>)
          : Prisma.JsonNull,
        photo: (photo as string) || null,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline as string)
          : null,
        withdrawalDeadline: withdrawalDeadline
          ? new Date(withdrawalDeadline as string)
          : null,
        weighInDate: weighInDate
          ? new Date(weighInDate as string)
          : null,
        level: (level as string).toUpperCase() as 'INTERNATIONAL' | 'NATIONAL' | 'REGIONAL' | 'CLUB',
        type: ((type as string) || 'MIXED').toUpperCase() as 'PERSONAL' | 'TEAM' | 'MIXED',
        teamType: teamType ? (teamType as string).toUpperCase() as 'CLUB' | 'REGIONAL' | 'CITY' | 'NATIONAL' : null,
        format: ((format as string) || (type as string) || 'MIXED').toUpperCase() as 'PERSONAL' | 'TEAM' | 'MIXED',
        ratingType: ((ratingType as string) || 'OFFICIAL').toUpperCase() as 'OFFICIAL' | 'FESTIVAL',
        rulesVersion: (rulesVersion as string) || null,
        countryId: countryId ? parseInt(String(countryId)) : null,
        regionId: regionId ? parseInt(String(regionId)) : null,
        cityId: cityId ? parseInt(String(cityId)) : null,
        isPaid: (isPaid as boolean) || (registrationFee ? true : false) || (baseRegistrationFee ? true : false),
        registrationFee: registrationFee
          ? parseFloat(String(registrationFee))
          : null,
        baseRegistrationFee: baseRegistrationFee
          ? parseFloat(String(baseRegistrationFee))
          : null,
        additionalDisciplineFee: additionalDisciplineFee
          ? parseFloat(String(additionalDisciplineFee))
          : null,
        teamRegistrationFeePerPerson: teamRegistrationFeePerPerson
          ? parseFloat(String(teamRegistrationFeePerPerson))
          : null,
        currency: (currency as string) || 'KGS',
        tatamiCount: tatamiCount ? parseInt(String(tatamiCount)) : 1,
        medicalCheckRequired: medicalCheckRequired === undefined ? true : medicalCheckRequired === true || medicalCheckRequired === 'true',
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
