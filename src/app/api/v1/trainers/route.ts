import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'

// GET /api/v1/trainers - List trainers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const federationId = searchParams.get('federationId')
    const clubId = searchParams.get('clubId')
    const search = searchParams.get('search')
    const locale = (searchParams.get('locale') || 'ru') as Locale

    // Build where clause
    const where: Record<string, unknown> = {}

    if (federationId) {
      where.federationId = parseInt(federationId)
    }

    if (clubId) {
      where.clubId = parseInt(clubId)
    }

    if (search) {
      where.OR = [
        { fio: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { firstNameLatin: { contains: search, mode: 'insensitive' } },
        { lastNameLatin: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    // Get total count
    const total = await prisma.trainer.count({ where })

    // Get trainers
    const trainers = await prisma.trainer.findMany({
      where,
      include: {
        federation: { select: { id: true, code: true, name: true } },
        club: { select: { id: true, title: true } },
        country: { select: { id: true, nameRu: true, nameEn: true, flagEmoji: true } },
        region: { select: { id: true, nameRu: true, nameEn: true } },
        city: { select: { id: true, nameRu: true, nameEn: true } },
        _count: {
          select: { sportsmen: true }
        }
      },
      orderBy: [
        { ordering: 'asc' },
        { fio: 'asc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
    })

    // Transform for locale
    const data = trainers.map(trainer => ({
      ...trainer,
      fullName: trainer.fio || `${trainer.lastName || ''} ${trainer.firstName || ''} ${trainer.middleName || ''}`.trim(),
      clubTitle: trainer.club
        ? getTranslation(trainer.club.title as Record<string, string>, locale)
        : null,
      countryName: trainer.country
        ? (locale === 'en' ? trainer.country.nameEn : trainer.country.nameRu)
        : null,
      regionName: trainer.region
        ? (locale === 'en' ? trainer.region.nameEn : trainer.region.nameRu)
        : null,
      cityName: trainer.city
        ? (locale === 'en' ? trainer.city.nameEn : trainer.city.nameRu)
        : null,
      sportsmenCount: trainer._count.sportsmen,
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
    console.error('Get trainers error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trainers' },
      { status: 500 }
    )
  }
}

// POST /api/v1/trainers - Create trainer
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
      firstName,
      lastName,
      middleName,
      firstNameLatin,
      lastNameLatin,
      middleNameLatin,
      phone,
      photo,
      dateOfBirth,
      dateStart,
      clubId,
      countryId,
      regionId,
      cityId,
      rank,
      position,
      instagram,
      description,
      contacts,
      federationId: bodyFederationId,
    } = body

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    const federationId = bodyFederationId || user.federationId

    // Generate FIO
    const fio = `${lastName} ${firstName}${middleName ? ' ' + middleName : ''}`

    // Generate public ID
    const count = await prisma.trainer.count({ where: { federationId } })
    const publicId = `T${String(count + 1).padStart(6, '0')}`

    // Create trainer
    const trainer = await prisma.trainer.create({
      data: {
        federationId,
        fio,
        firstName,
        lastName,
        middleName,
        firstNameLatin,
        lastNameLatin,
        middleNameLatin,
        publicId,
        phone,
        photo,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        dateStart: dateStart ? new Date(dateStart) : null,
        clubId: clubId ? parseInt(clubId) : null,
        countryId: countryId ? parseInt(countryId) : null,
        regionId: regionId ? parseInt(regionId) : null,
        cityId: cityId ? parseInt(cityId) : null,
        rank: (rank || 'COACH').toUpperCase() as 'COACH' | 'SENIOR_COACH' | 'HEAD_COACH' | 'ASSISTANT_COACH',
        position,
        instagram,
        description,
        contacts,
      },
      include: {
        federation: { select: { id: true, code: true, name: true } },
        club: { select: { id: true, title: true } },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'trainers',
        description: `Created trainer: ${fio}`,
        subjectType: 'Trainer',
        subjectId: trainer.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'create' },
      },
    })

    return NextResponse.json({
      success: true,
      data: trainer,
    })
  } catch (error) {
    console.error('Create trainer error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create trainer' },
      { status: 500 }
    )
  }
}
