import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'

// GET /api/v1/clubs - List clubs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const federationId = searchParams.get('federationId')
    const regionId = searchParams.get('regionId')
    const search = searchParams.get('search') || ''
    const locale = (searchParams.get('locale') || 'ru') as Locale

    // Build where clause
    const where: Record<string, unknown> = {}

    if (federationId) {
      where.federationId = parseInt(federationId)
    }

    if (regionId) {
      where.regionId = parseInt(regionId)
    }

    if (search) {
      where.OR = [
        { title: { path: ['ru'], string_contains: search } },
        { title: { path: ['en'], string_contains: search } },
      ]
    }

    // Get total count
    const total = await prisma.club.count({ where })

    // Get clubs
    const clubs = await prisma.club.findMany({
      where,
      include: {
        federation: { select: { id: true, code: true, name: true } },
        country: { select: { id: true, nameRu: true, nameEn: true } },
        region: { select: { id: true, nameRu: true, nameEn: true } },
        city: { select: { id: true, nameRu: true, nameEn: true } },
        _count: {
          select: {
            sportsmen: true,
            trainers: true,
          },
        },
      },
      orderBy: { rating: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Transform for locale
    const data = clubs.map((club: typeof clubs[number]) => ({
      ...club,
      title: getTranslation(club.title as Record<string, string>, locale),
      description: getTranslation(club.description as Record<string, string>, locale),
      sportsmenCount: club._count.sportsmen,
      trainersCount: club._count.trainers,
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
    console.error('Get clubs error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clubs' },
      { status: 500 }
    )
  }
}

// POST /api/v1/clubs - Create club
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
      address,
      instagram,
      countryId,
      regionId,
      cityId,
      federationId: bodyFederationId,
    } = body

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    const federationId = bodyFederationId || user.federationId

    const club = await prisma.club.create({
      data: {
        federationId,
        title: typeof title === 'string' ? { ru: title } : title,
        description: description
          ? typeof description === 'string'
            ? { ru: description }
            : description
          : null,
        address: address
          ? typeof address === 'string'
            ? { ru: address }
            : address
          : null,
        instagram,
        countryId: countryId ? parseInt(countryId) : null,
        regionId: regionId ? parseInt(regionId) : null,
        cityId: cityId ? parseInt(cityId) : null,
        rating: 0,
      },
      include: {
        federation: { select: { id: true, code: true, name: true } },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'clubs',
        description: `Created club: ${getTranslation(club.title as Record<string, string>, 'ru')}`,
        subjectType: 'Club',
        subjectId: club.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'create' },
      },
    })

    return NextResponse.json({
      success: true,
      data: club,
    })
  } catch (error) {
    console.error('Create club error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create club' },
      { status: 500 }
    )
  }
}
