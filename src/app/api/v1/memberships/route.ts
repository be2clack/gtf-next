import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/v1/memberships - Get memberships
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
    const sportsmanId = searchParams.get('sportsmanId')
    const federationId = searchParams.get('federationId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}

    if (sportsmanId) {
      where.sportsmanId = parseInt(sportsmanId)
    }

    if (federationId) {
      where.federationId = parseInt(federationId)
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const memberships = await prisma.membership.findMany({
      where,
      include: {
        sportsmen: {
          select: { id: true, firstName: true, lastName: true, photo: true }
        },
        federation: {
          select: { id: true, code: true, name: true }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: memberships
    })
  } catch (error) {
    console.error('Get memberships error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch memberships' },
      { status: 500 }
    )
  }
}

// POST /api/v1/memberships - Create membership
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
    const { sportsmanId, federationId, duration, amount } = body

    if (!sportsmanId || !federationId) {
      return NextResponse.json(
        { success: false, error: 'Sportsman and federation are required' },
        { status: 400 }
      )
    }

    // Check if sportsman exists
    const sportsman = await prisma.sportsman.findUnique({
      where: { id: parseInt(sportsmanId) }
    })

    if (!sportsman) {
      return NextResponse.json(
        { success: false, error: 'Sportsman not found' },
        { status: 404 }
      )
    }

    // Check if federation exists
    const federation = await prisma.federation.findUnique({
      where: { id: parseInt(federationId) }
    })

    if (!federation) {
      return NextResponse.json(
        { success: false, error: 'Federation not found' },
        { status: 404 }
      )
    }

    // Check for existing active membership
    const existingMembership = await prisma.membership.findFirst({
      where: {
        sportsmanId: parseInt(sportsmanId),
        federationId: parseInt(federationId),
        status: 'ACTIVE',
        validUntil: { gt: new Date() }
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { success: false, error: 'Active membership already exists', data: existingMembership },
        { status: 400 }
      )
    }

    // Calculate dates
    const validFrom = new Date()
    const durationMonths = duration || 12
    const validUntil = new Date()
    validUntil.setMonth(validUntil.getMonth() + durationMonths)

    // Get membership fee from federation settings or use provided amount
    const settings = federation.settings as Record<string, unknown> | null
    const membershipFee = amount || (settings?.membershipFee as number) || 1000

    // Generate membership number
    const count = await prisma.membership.count({
      where: { federationId: parseInt(federationId) }
    })
    const membershipNumber = `${federation.code}-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        sportsmanId: parseInt(sportsmanId),
        federationId: parseInt(federationId),
        membershipNumber,
        status: 'PENDING',
        validFrom,
        validUntil,
        amount: membershipFee,
      },
      include: {
        sportsmen: { select: { id: true, firstName: true, lastName: true } },
        federation: { select: { id: true, code: true, name: true } }
      }
    })

    // Update sportsman to link to this membership
    await prisma.sportsman.update({
      where: { id: parseInt(sportsmanId) },
      data: { membershipId: membership.id }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'memberships',
        description: `Created membership for ${sportsman.lastName} ${sportsman.firstName}`,
        subjectType: 'Membership',
        subjectId: membership.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'create', sportsmanId, federationId }
      }
    })

    return NextResponse.json({
      success: true,
      data: membership
    })
  } catch (error) {
    console.error('Create membership error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create membership' },
      { status: 500 }
    )
  }
}
