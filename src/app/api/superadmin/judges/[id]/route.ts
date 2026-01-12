import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/superadmin/judges/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const judge = await prisma.judge.findUnique({
    where: { id: parseInt(id) },
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
      disciplines: {
        include: {
          discipline: true,
        },
      },
      _count: {
        select: {
          competitionJudges: true,
          matchJudges: true,
        },
      },
    },
  })

  if (!judge) {
    return NextResponse.json({ error: 'Судья не найден' }, { status: 404 })
  }

  return NextResponse.json(judge)
}

// PUT /api/superadmin/judges/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

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

    // Check if email is being changed and if new email exists
    if (email) {
      const existing = await prisma.judge.findFirst({
        where: {
          email,
          NOT: { id: parseInt(id) },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Судья с таким email уже существует' },
          { status: 400 }
        )
      }
    }

    const judge = await prisma.judge.update({
      where: { id: parseInt(id) },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(patronymic !== undefined && { patronymic: patronymic || null }),
        ...(photo !== undefined && { photo: photo || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(telegramChatId !== undefined && { telegramChatId: telegramChatId || null }),
        ...(countryId !== undefined && { countryId: countryId ? parseInt(countryId) : null }),
        ...(regionId !== undefined && { regionId: regionId ? parseInt(regionId) : null }),
        ...(cityId !== undefined && { cityId: cityId ? parseInt(cityId) : null }),
        ...(judgeRole !== undefined && { judgeRole }),
        ...(judgeCategory !== undefined && { judgeCategory }),
        ...(certificateNumber !== undefined && { certificateNumber: certificateNumber || null }),
        ...(licenseDate !== undefined && { licenseDate: licenseDate ? new Date(licenseDate) : null }),
        ...(licenseExpiry !== undefined && { licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(experienceYears !== undefined && { experienceYears: experienceYears ? parseInt(experienceYears) : null }),
        ...(isInternational !== undefined && { isInternational }),
        ...(isActive !== undefined && { isActive }),
        ...(federationId !== undefined && { federationId: federationId ? parseInt(federationId) : null }),
      },
      include: {
        federation: {
          select: { id: true, code: true, name: true },
        },
      },
    })

    return NextResponse.json(judge)
  } catch (error) {
    console.error('Failed to update judge:', error)
    return NextResponse.json(
      { error: 'Failed to update judge' },
      { status: 500 }
    )
  }
}

// DELETE /api/superadmin/judges/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if judge has participated in competitions
    const judge = await prisma.judge.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            competitionJudges: true,
            matchJudges: true,
          },
        },
      },
    })

    if (!judge) {
      return NextResponse.json({ error: 'Судья не найден' }, { status: 404 })
    }

    if (judge._count.competitionJudges > 0) {
      return NextResponse.json(
        { error: `Невозможно удалить: судья участвовал в ${judge._count.competitionJudges} соревнованиях` },
        { status: 400 }
      )
    }

    // Delete related discipline assignments first
    await prisma.judgeDiscipline.deleteMany({
      where: { judgeId: parseInt(id) },
    })

    await prisma.judge.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete judge:', error)
    return NextResponse.json(
      { error: 'Failed to delete judge' },
      { status: 500 }
    )
  }
}
