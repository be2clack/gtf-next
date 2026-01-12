import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
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

// GET /api/v1/judges - List judges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const federationId = searchParams.get('federationId')
    const isActive = searchParams.get('isActive')
    const category = searchParams.get('category')
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const locale = (searchParams.get('locale') || 'ru') as Locale

    // Build where clause
    const where: Record<string, unknown> = {}

    if (federationId) {
      where.federationId = parseInt(federationId)
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    if (category) {
      where.judgeCategory = category.toUpperCase()
    }

    if (role) {
      where.judgeRole = role.toUpperCase()
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { patronymic: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { certificateNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await prisma.judge.count({ where })

    // Get judges
    const judges = await prisma.judge.findMany({
      where,
      include: {
        federation: { select: { id: true, code: true, name: true } },
        country: { select: { id: true, nameRu: true, nameEn: true, flagEmoji: true } },
        region: { select: { id: true, nameRu: true, nameEn: true } },
        city: { select: { id: true, nameRu: true, nameEn: true } },
        disciplines: {
          include: {
            discipline: { select: { id: true, name: true, nameRu: true, nameEn: true } }
          }
        },
        _count: {
          select: { competitionJudges: true, matchJudges: true }
        }
      },
      orderBy: [
        { judgeCategory: 'asc' },
        { lastName: 'asc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
    })

    // Transform for locale
    const data = judges.map(judge => ({
      ...judge,
      fullName: `${judge.lastName} ${judge.firstName}${judge.patronymic ? ' ' + judge.patronymic : ''}`.trim(),
      countryName: judge.country
        ? (locale === 'en' ? judge.country.nameEn : judge.country.nameRu)
        : null,
      regionName: judge.region
        ? (locale === 'en' ? judge.region.nameEn : judge.region.nameRu)
        : null,
      cityName: judge.city
        ? (locale === 'en' ? judge.city.nameEn : judge.city.nameRu)
        : null,
      disciplineNames: judge.disciplines.map(d =>
        locale === 'en' ? d.discipline.nameEn : d.discipline.nameRu || d.discipline.name
      ),
      competitionsCount: judge._count.competitionJudges,
      matchesCount: judge._count.matchJudges,
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
    console.error('Get judges error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch judges' },
      { status: 500 }
    )
  }
}

// POST /api/v1/judges - Create judge
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
          body.photo = await saveUploadedFile(value, 'judges')
        } else if (key === 'disciplineIds[]' || key === 'disciplineIds') {
          if (!body.disciplineIds) body.disciplineIds = []
          ;(body.disciplineIds as string[]).push(value as string)
        } else if (value !== '' && value !== 'undefined' && value !== 'null') {
          body[key] = value
        }
      }
    } else {
      body = await request.json()
    }

    const {
      firstName,
      lastName,
      patronymic,
      phone,
      email,
      photo,
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
      disciplineIds,
      telegramChatId,
      isActive,
      federationId: bodyFederationId,
    } = body as Record<string, unknown>

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    const federationId = (bodyFederationId as number) || user.federationId

    // Create judge
    const judge = await prisma.judge.create({
      data: {
        federationId,
        firstName: firstName as string,
        lastName: lastName as string,
        patronymic: (patronymic as string) || null,
        phone: (phone as string) || null,
        email: (email as string) || null,
        telegramChatId: (telegramChatId as string) || null,
        photo: (photo as string) || null,
        countryId: countryId ? parseInt(String(countryId)) : null,
        regionId: regionId ? parseInt(String(regionId)) : null,
        cityId: cityId ? parseInt(String(cityId)) : null,
        judgeRole: ((judgeRole as string) || 'JUDGE').toUpperCase() as 'JUDGE' | 'ARBITER' | 'REFEREE' | 'CORNER_JUDGE' | 'MIRROR_JUDGE' | 'LINE_JUDGE' | 'SECRETARY' | 'DOCTOR' | 'CLASSIFIER',
        judgeCategory: ((judgeCategory as string) || 'NATIONAL').toUpperCase() as 'INTERNATIONAL' | 'NATIONAL' | 'REGIONAL',
        certificateNumber: (certificateNumber as string) || null,
        licenseDate: licenseDate ? new Date(licenseDate as string) : null,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry as string) : null,
        startDate: startDate ? new Date(startDate as string) : null,
        experienceYears: experienceYears ? parseInt(String(experienceYears)) : null,
        isInternational: (isInternational as boolean) || false,
        isActive: isActive === undefined ? true : isActive === true || isActive === 'true',
        createdById: user.id,
      },
      include: {
        federation: { select: { id: true, code: true, name: true } },
        country: { select: { id: true, nameRu: true, nameEn: true } },
      },
    })

    // Add disciplines if provided
    if (disciplineIds && Array.isArray(disciplineIds) && disciplineIds.length > 0) {
      await prisma.judgeDiscipline.createMany({
        data: disciplineIds.map((disciplineId: number) => ({
          judgeId: judge.id,
          disciplineId: parseInt(String(disciplineId)),
        })),
        skipDuplicates: true,
      })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'judges',
        description: `Created judge: ${lastName} ${firstName}`,
        subjectType: 'Judge',
        subjectId: judge.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'create' },
      },
    })

    return NextResponse.json({
      success: true,
      data: judge,
    })
  } catch (error) {
    console.error('Create judge error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create judge' },
      { status: 500 }
    )
  }
}
