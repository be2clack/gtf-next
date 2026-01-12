import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/superadmin/judges
export async function GET(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const federationId = searchParams.get('federationId')
  const category = searchParams.get('category')

  const judges = await prisma.judge.findMany({
    where: {
      ...(federationId && { federationId: parseInt(federationId) }),
      ...(category && { judgeCategory: category as 'INTERNATIONAL' | 'NATIONAL' | 'REGIONAL' }),
    },
    orderBy: { lastName: 'asc' },
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
      _count: {
        select: {
          competitionJudges: true,
        },
      },
    },
  })

  return NextResponse.json(judges)
}

// POST /api/superadmin/judges
export async function POST(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      patronymic,
      photo,
      phone,
      email,
      telegramChatId,
      countryId,
      regionId,
      cityId,
      judgeRole,
      judgeCategory,
      certificateNumber,
      licenseDate,
      licenseExpiry,
      startDate,
      experienceYears,
      isInternational,
      isActive,
      federationId,
    } = body

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Имя и фамилия обязательны' },
        { status: 400 }
      )
    }

    // Check if judge with same email exists
    if (email) {
      const existing = await prisma.judge.findFirst({
        where: { email },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Судья с таким email уже существует' },
          { status: 400 }
        )
      }
    }

    const judge = await prisma.judge.create({
      data: {
        firstName,
        lastName,
        patronymic: patronymic || null,
        photo: photo || null,
        phone: phone || null,
        email: email || null,
        telegramChatId: telegramChatId || null,
        countryId: countryId ? parseInt(countryId) : null,
        regionId: regionId ? parseInt(regionId) : null,
        cityId: cityId ? parseInt(cityId) : null,
        judgeRole: judgeRole || 'JUDGE',
        judgeCategory: judgeCategory || 'NATIONAL',
        certificateNumber: certificateNumber || null,
        licenseDate: licenseDate ? new Date(licenseDate) : null,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        startDate: startDate ? new Date(startDate) : null,
        experienceYears: experienceYears ? parseInt(experienceYears) : null,
        isInternational: isInternational === true,
        isActive: isActive !== false,
        federationId: federationId ? parseInt(federationId) : null,
      },
      include: {
        federation: {
          select: { id: true, code: true, name: true },
        },
      },
    })

    return NextResponse.json(judge, { status: 201 })
  } catch (error) {
    console.error('Failed to create judge:', error)
    return NextResponse.json(
      { error: 'Failed to create judge' },
      { status: 500 }
    )
  }
}
