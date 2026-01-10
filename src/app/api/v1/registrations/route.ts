import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/v1/registrations - Get user's registrations
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const competitionId = searchParams.get('competitionId')
    const sportsmanId = searchParams.get('sportsmanId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}

    if (competitionId) {
      where.competitionId = parseInt(competitionId)
    }

    if (sportsmanId) {
      where.sportsmanId = parseInt(sportsmanId)
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    // For non-admin users, filter by federation if set
    if (user.type !== 'ADMIN' && user.federationId) {
      where.competition = { federationId: user.federationId }
    }

    const registrations = await prisma.competitionRegistration.findMany({
      where,
      include: {
        competition: {
          select: { id: true, title: true, startDate: true, endDate: true, status: true }
        },
        sportsman: {
          select: { id: true, firstName: true, lastName: true, photo: true }
        },
        competitionCategory: {
          include: {
            discipline: { select: { id: true, name: true, nameRu: true } },
            ageCategory: { select: { id: true, code: true, nameRu: true } },
            weightCategory: { select: { id: true, code: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: registrations
    })
  } catch (error) {
    console.error('Get registrations error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch registrations' },
      { status: 500 }
    )
  }
}

// POST /api/v1/registrations - Register for competition
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { competitionId, sportsmanId, competitionCategoryId, currentWeight } = body

    if (!competitionId || !sportsmanId || !competitionCategoryId) {
      return NextResponse.json(
        { success: false, error: 'Competition, sportsman and category are required' },
        { status: 400 }
      )
    }

    // Get competition
    const competition = await prisma.competition.findUnique({
      where: { id: parseInt(competitionId) },
      include: { federation: true }
    })

    if (!competition) {
      return NextResponse.json(
        { success: false, error: 'Competition not found' },
        { status: 404 }
      )
    }

    // Check registration is open
    if (competition.status !== 'REGISTRATION_OPEN') {
      return NextResponse.json(
        { success: false, error: 'Registration is not open for this competition' },
        { status: 400 }
      )
    }

    // Check deadline
    if (competition.registrationDeadline && new Date() > competition.registrationDeadline) {
      return NextResponse.json(
        { success: false, error: 'Registration deadline has passed' },
        { status: 400 }
      )
    }

    // Get sportsman
    const sportsman = await prisma.sportsman.findUnique({
      where: { id: parseInt(sportsmanId) },
      include: {
        membership: {
          where: {
            federationId: competition.federationId || undefined,
            status: 'ACTIVE',
            validUntil: { gt: new Date() }
          }
        }
      }
    })

    if (!sportsman) {
      return NextResponse.json(
        { success: false, error: 'Sportsman not found' },
        { status: 404 }
      )
    }

    // Check if already registered in this category
    const existingRegistration = await prisma.competitionRegistration.findFirst({
      where: {
        competitionId: parseInt(competitionId),
        sportsmanId: parseInt(sportsmanId),
        competitionCategoryId: parseInt(competitionCategoryId),
        status: { notIn: ['REJECTED', 'WITHDRAWN'] }
      }
    })

    if (existingRegistration) {
      return NextResponse.json(
        { success: false, error: 'Already registered in this category' },
        { status: 400 }
      )
    }

    // Get category
    const category = await prisma.competitionCategory.findUnique({
      where: { id: parseInt(competitionCategoryId) },
      include: {
        ageCategory: true,
        weightCategory: true
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Validate age
    if (sportsman.dateOfBirth && category.ageCategory) {
      const age = Math.floor((competition.startDate.getTime() - sportsman.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      if (category.ageCategory.minAge && age < category.ageCategory.minAge) {
        return NextResponse.json(
          { success: false, error: `Sportsman is too young for this category (min age: ${category.ageCategory.minAge})` },
          { status: 400 }
        )
      }
      if (category.ageCategory.maxAge && age > category.ageCategory.maxAge) {
        return NextResponse.json(
          { success: false, error: `Sportsman is too old for this category (max age: ${category.ageCategory.maxAge})` },
          { status: 400 }
        )
      }
    }

    // Validate gender
    const sportsmanGender = sportsman.sex === 0 ? 'MALE' : 'FEMALE'
    if (category.gender && category.gender !== 'MIXED' && category.gender !== sportsmanGender) {
      return NextResponse.json(
        { success: false, error: 'Gender does not match category requirements' },
        { status: 400 }
      )
    }

    // Calculate fee
    const baseFee = competition.baseRegistrationFee || 0

    // Create registration
    const registration = await prisma.competitionRegistration.create({
      data: {
        competitionId: parseInt(competitionId),
        sportsmanId: parseInt(sportsmanId),
        competitionCategoryId: parseInt(competitionCategoryId),
        currentWeight: currentWeight ? parseFloat(currentWeight) : sportsman.weight,
        status: 'PENDING',
        baseFee,
        totalFee: baseFee,
        paymentStatus: competition.isPaid ? 'PENDING' : 'PAID',
        registeredById: user.id,
        registeredAt: new Date(),
        beltLevel: sportsman.beltLevel
      },
      include: {
        competition: { select: { id: true, title: true } },
        sportsman: { select: { id: true, firstName: true, lastName: true } },
        competitionCategory: {
          include: {
            discipline: { select: { nameRu: true } },
            ageCategory: { select: { nameRu: true } },
            weightCategory: { select: { name: true } }
          }
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'registrations',
        description: `Registered ${sportsman.lastName} ${sportsman.firstName} for competition`,
        subjectType: 'CompetitionRegistration',
        subjectId: registration.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'create', competitionId, sportsmanId, competitionCategoryId }
      }
    })

    return NextResponse.json({
      success: true,
      data: registration
    })
  } catch (error) {
    console.error('Create registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create registration' },
      { status: 500 }
    )
  }
}
