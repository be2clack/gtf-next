import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'
import { getCurrentUser, isFederationAdmin } from '@/lib/auth'
import { transliterateName, generatePublicId } from '@/lib/utils/transliterate'

// Helper to save uploaded file
async function saveUploadedFile(file: File, subdir: string): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subdir)
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
  const filepath = path.join(uploadDir, filename)

  await writeFile(filepath, buffer)
  return filename
}

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

// POST /api/v1/sportsmen - Create sportsman (supports both JSON and FormData)
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

    // Parse body - support both JSON and FormData
    let firstName: string | null = null
    let lastName: string | null = null
    let middleName: string | null = null
    let dateOfBirth: string | null = null
    let sex: string | null = null
    let phone: string | null = null
    let clubId: string | null = null
    let trainerId: string | null = null
    let countryId: string | null = null
    let regionId: string | null = null
    let cityId: string | null = null
    let iin: string | null = null
    let weight: string | null = null
    let height: string | null = null
    let dateMed: string | null = null
    let dateStart: string | null = null
    let bodyFederationId: string | null = null
    let photoFile: File | null = null

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      firstName = formData.get('firstName') as string
      lastName = formData.get('lastName') as string
      middleName = formData.get('middleName') as string | null
      dateOfBirth = formData.get('dateOfBirth') as string | null
      sex = formData.get('sex') as string | null
      phone = formData.get('phone') as string | null
      clubId = formData.get('clubId') as string | null
      trainerId = formData.get('trainerId') as string | null
      countryId = formData.get('countryId') as string | null
      regionId = formData.get('regionId') as string | null
      cityId = formData.get('cityId') as string | null
      iin = formData.get('iin') as string | null
      weight = formData.get('weight') as string | null
      height = formData.get('height') as string | null
      dateMed = formData.get('dateMed') as string | null
      dateStart = formData.get('dateStart') as string | null
      bodyFederationId = formData.get('federationId') as string | null
      photoFile = formData.get('photo') as File | null
    } else {
      const body = await request.json()
      firstName = body.firstName
      lastName = body.lastName
      middleName = body.middleName
      dateOfBirth = body.dateOfBirth
      sex = body.sex
      phone = body.phone
      clubId = body.clubId
      trainerId = body.trainerId
      countryId = body.countryId
      regionId = body.regionId
      cityId = body.cityId
      iin = body.iin
      weight = body.weight
      height = body.height
      dateMed = body.dateMed
      dateStart = body.dateStart
      bodyFederationId = body.federationId
    }

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Имя и фамилия обязательны' },
        { status: 400 }
      )
    }

    if (!trainerId) {
      return NextResponse.json(
        { success: false, error: 'Выберите тренера' },
        { status: 400 }
      )
    }

    // Determine federation
    let federationId = bodyFederationId ? parseInt(bodyFederationId) : user.federationId

    if (!federationId) {
      // Get federation from trainer
      const trainer = await prisma.trainer.findUnique({
        where: { id: parseInt(trainerId) },
        select: { federationId: true, clubId: true },
      })
      if (trainer?.federationId) {
        federationId = trainer.federationId
      }
      // Auto-set clubId from trainer if not provided
      if (!clubId && trainer?.clubId) {
        clubId = String(trainer.clubId)
      }
    }

    if (!federationId) {
      return NextResponse.json(
        { success: false, error: 'Федерация не определена' },
        { status: 400 }
      )
    }

    // Get federation's country
    const federation = await prisma.federation.findUnique({
      where: { id: federationId },
      select: { countryId: true },
    })

    // Generate Latin names and public ID
    const latinNames = transliterateName(firstName, lastName, middleName || undefined)
    const publicId = generatePublicId(lastName, firstName)

    // Save photo if provided
    let photoFilename: string | null = null
    if (photoFile && photoFile.size > 0) {
      // Validate file size (5MB max)
      if (photoFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Размер фото не должен превышать 5MB' },
          { status: 400 }
        )
      }
      photoFilename = await saveUploadedFile(photoFile, 'sportsman')
    }

    // Create sportsman
    const sportsman = await prisma.sportsman.create({
      data: {
        federationId,
        firstName,
        lastName,
        middleName: middleName || null,
        firstNameLatin: latinNames.firstNameLatin,
        lastNameLatin: latinNames.lastNameLatin,
        middleNameLatin: latinNames.middleNameLatin || null,
        publicId,
        fio: `${lastName} ${firstName} ${middleName || ''}`.trim(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        sex: sex === 'female' ? 1 : 0,
        phone: phone || null,
        iin: iin || null,
        clubId: clubId ? parseInt(clubId) : null,
        trainerId: trainerId ? parseInt(trainerId) : null,
        countryId: federation?.countryId || (countryId ? parseInt(countryId) : null),
        regionId: regionId ? parseInt(regionId) : null,
        cityId: cityId ? parseInt(cityId) : null,
        photo: photoFilename,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseInt(height) : null,
        dateMed: dateMed ? new Date(dateMed) : null,
        dateStart: dateStart ? new Date(dateStart) : null,
        beltLevel: 10, // Initial belt level (10 gyp - white)
        level: 10,
        gyp: 10,
        dan: 0,
      },
      include: {
        club: { select: { id: true, title: true } },
        trainer: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Create initial attestation (10 gyp - white belt)
    await prisma.attestation.create({
      data: {
        sportsmanId: sportsman.id,
        level: 10,
        status: true,
        examDate: new Date(),
        examiner: 'Автоматическая регистрация',
        comment: 'Начальный пояс при регистрации спортсмена',
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'sportsmen',
        description: `Создан спортсмен: ${sportsman.lastName} ${sportsman.firstName}`,
        subjectType: 'Sportsman',
        subjectId: sportsman.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'create', publicId: sportsman.publicId },
      },
    })

    return NextResponse.json({
      success: true,
      data: sportsman,
      message: 'Спортсмен успешно создан с начальным поясом (10 гып)',
    })
  } catch (error) {
    console.error('Create sportsman error:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка при создании спортсмена' },
      { status: 500 }
    )
  }
}
