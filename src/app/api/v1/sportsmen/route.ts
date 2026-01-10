import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, isFederationAdmin } from '@/lib/auth'
import { transliterateName, generatePublicId } from '@/lib/utils/transliterate'

// GET /api/v1/sportsmen - List sportsmen
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)

    // Parse query params
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const federationId = searchParams.get('federationId')
    const clubId = searchParams.get('clubId')
    const trainerId = searchParams.get('trainerId')
    const gender = searchParams.get('gender')
    const sortBy = searchParams.get('sortBy') || 'lastName'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Build where clause
    const where: Record<string, unknown> = {}

    // Federation filter (required for non-superadmin)
    if (federationId) {
      where.federationId = parseInt(federationId)
    } else if (user?.federationId) {
      where.federationId = user.federationId
    }

    if (clubId) where.clubId = parseInt(clubId)
    if (trainerId) where.trainerId = parseInt(trainerId)
    if (gender) where.sex = gender === 'male' ? 0 : 1

    // Search
    if (search) {
      where.OR = [
        { lastName: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { fio: { contains: search, mode: 'insensitive' } },
        { publicId: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    // Get total count
    const total = await prisma.sportsman.count({ where })

    // Get sportsmen
    const sportsmen = await prisma.sportsman.findMany({
      where,
      include: {
        club: { select: { id: true, title: true } },
        trainer: { select: { id: true, firstName: true, lastName: true } },
        country: { select: { id: true, code: true, nameRu: true, nameEn: true } },
        region: { select: { id: true, nameRu: true, nameEn: true } },
        city: { select: { id: true, nameRu: true, nameEn: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: sportsmen,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get sportsmen error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sportsmen' },
      { status: 500 }
    )
  }
}

// POST /api/v1/sportsmen - Create sportsman
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check admin access
    if (user.type !== 'ADMIN' && user.type !== 'TRAINER') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()

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
      federationId: bodyFederationId,
    } = body

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Determine federation
    const federationId = bodyFederationId || user.federationId

    if (!federationId && user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Federation is required' },
        { status: 400 }
      )
    }

    // Generate Latin names and public ID
    const latinNames = transliterateName(firstName, lastName, middleName)
    const publicId = generatePublicId(lastName, firstName)

    // Create sportsman
    const sportsman = await prisma.sportsman.create({
      data: {
        federationId,
        firstName,
        lastName,
        middleName,
        firstNameLatin: latinNames.firstNameLatin,
        lastNameLatin: latinNames.lastNameLatin,
        middleNameLatin: latinNames.middleNameLatin,
        publicId,
        fio: `${lastName} ${firstName} ${middleName || ''}`.trim(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        sex: sex === 'female' ? 1 : 0,
        phone,
        clubId: clubId ? parseInt(clubId) : null,
        trainerId: trainerId ? parseInt(trainerId) : null,
        countryId: countryId ? parseInt(countryId) : null,
        regionId: regionId ? parseInt(regionId) : null,
        cityId: cityId ? parseInt(cityId) : null,
        beltLevel: beltLevel || 10,
        level: beltLevel || 10,
        gyp: beltLevel > 0 ? beltLevel : 10,
        dan: beltLevel <= 0 ? Math.abs(beltLevel) + 1 : 0,
        weight: weight ? parseFloat(weight) : null,
      },
      include: {
        club: { select: { id: true, title: true } },
        trainer: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'sportsmen',
        description: `Created sportsman: ${sportsman.lastName} ${sportsman.firstName}`,
        subjectType: 'Sportsman',
        subjectId: sportsman.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'create' },
      },
    })

    return NextResponse.json({
      success: true,
      data: sportsman,
    })
  } catch (error) {
    console.error('Create sportsman error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create sportsman' },
      { status: 500 }
    )
  }
}
