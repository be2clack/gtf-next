import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
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

// GET /api/v1/judges/[id] - Get single judge
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const judgeId = parseInt(id)

    if (isNaN(judgeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid judge ID' },
        { status: 400 }
      )
    }

    const judge = await prisma.judge.findUnique({
      where: { id: judgeId },
      include: {
        federation: { select: { id: true, code: true, name: true } },
        country: { select: { id: true, nameRu: true, nameEn: true, flagEmoji: true } },
        region: { select: { id: true, nameRu: true, nameEn: true } },
        city: { select: { id: true, nameRu: true, nameEn: true } },
        disciplines: {
          include: {
            discipline: { select: { id: true, code: true, name: true, nameRu: true, nameEn: true } }
          }
        },
        _count: {
          select: { competitionJudges: true, matchJudges: true }
        }
      },
    })

    if (!judge) {
      return NextResponse.json(
        { success: false, error: 'Judge not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...judge,
        fullName: `${judge.lastName} ${judge.firstName}${judge.patronymic ? ' ' + judge.patronymic : ''}`.trim(),
        disciplineIds: judge.disciplines.map(d => d.disciplineId),
      },
    })
  } catch (error) {
    console.error('Get judge error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch judge' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/judges/[id] - Update judge
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const judgeId = parseInt(id)

    if (isNaN(judgeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid judge ID' },
        { status: 400 }
      )
    }

    // Check if judge exists
    const existingJudge = await prisma.judge.findUnique({
      where: { id: judgeId },
      select: { id: true, federationId: true, photo: true },
    })

    if (!existingJudge) {
      return NextResponse.json(
        { success: false, error: 'Judge not found' },
        { status: 404 }
      )
    }

    // Check federation access
    if (user.federationId && existingJudge.federationId !== user.federationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied: not your federation' },
        { status: 403 }
      )
    }

    const contentType = request.headers.get('content-type') || ''
    let body: Record<string, unknown>

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      body = {}

      for (const [key, value] of formData.entries()) {
        if (key === 'photo' && value instanceof File && value.size > 0) {
          body.photo = await saveUploadedFile(value, 'judges')
        } else if (key === 'disciplineIds' || key === 'disciplineIds[]') {
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
      telegramChatId,
      regionId,
      cityId,
      judgeRole,
      judgeCategory,
      certificateNumber,
      licenseDate,
      licenseExpiry,
      startDate,
      experienceYears,
      isActive,
      disciplineIds,
      photo,
      removePhoto,
    } = body as {
      firstName?: string
      lastName?: string
      patronymic?: string
      phone?: string
      email?: string
      telegramChatId?: string
      regionId?: string
      cityId?: string
      judgeRole?: string
      judgeCategory?: string
      certificateNumber?: string
      licenseDate?: string
      licenseExpiry?: string
      startDate?: string
      experienceYears?: string
      isActive?: string | boolean
      disciplineIds?: string[]
      photo?: string
      removePhoto?: string | boolean
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (patronymic !== undefined) updateData.patronymic = patronymic || null
    if (phone !== undefined) updateData.phone = phone || null
    if (email !== undefined) updateData.email = email || null
    if (telegramChatId !== undefined) updateData.telegramChatId = telegramChatId || null
    if (regionId !== undefined) updateData.regionId = regionId ? parseInt(regionId) : null
    if (cityId !== undefined) updateData.cityId = cityId ? parseInt(cityId) : null
    if (judgeRole !== undefined) updateData.judgeRole = judgeRole.toUpperCase()
    if (judgeCategory !== undefined) updateData.judgeCategory = judgeCategory.toUpperCase()
    if (certificateNumber !== undefined) updateData.certificateNumber = certificateNumber || null
    if (licenseDate !== undefined) updateData.licenseDate = licenseDate ? new Date(licenseDate) : null
    if (licenseExpiry !== undefined) updateData.licenseExpiry = licenseExpiry ? new Date(licenseExpiry) : null
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (experienceYears !== undefined) updateData.experienceYears = experienceYears ? parseInt(experienceYears) : null
    if (isActive !== undefined) updateData.isActive = isActive === true || isActive === 'true' || isActive === '1'

    // Handle photo
    if (photo && typeof photo === 'string') {
      updateData.photo = photo
    } else if (removePhoto === true || removePhoto === 'true' || removePhoto === '1') {
      updateData.photo = null
    }

    // Update judge
    const judge = await prisma.judge.update({
      where: { id: judgeId },
      data: updateData,
      include: {
        federation: { select: { id: true, code: true, name: true } },
        country: { select: { id: true, nameRu: true, nameEn: true } },
        region: { select: { id: true, nameRu: true, nameEn: true } },
        city: { select: { id: true, nameRu: true, nameEn: true } },
      },
    })

    // Update disciplines if provided
    if (disciplineIds && Array.isArray(disciplineIds)) {
      // Remove existing
      await prisma.judgeDiscipline.deleteMany({
        where: { judgeId },
      })

      // Add new
      if (disciplineIds.length > 0) {
        await prisma.judgeDiscipline.createMany({
          data: disciplineIds.map((disciplineId) => ({
            judgeId,
            disciplineId: parseInt(String(disciplineId)),
          })),
          skipDuplicates: true,
        })
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'judges',
        description: `Updated judge: ${judge.lastName} ${judge.firstName}`,
        subjectType: 'Judge',
        subjectId: judge.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'update' },
      },
    })

    return NextResponse.json({
      success: true,
      data: judge,
    })
  } catch (error) {
    console.error('Update judge error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update judge' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/judges/[id] - Delete judge
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const judgeId = parseInt(id)

    if (isNaN(judgeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid judge ID' },
        { status: 400 }
      )
    }

    // Check if judge exists
    const judge = await prisma.judge.findUnique({
      where: { id: judgeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        federationId: true,
        _count: { select: { competitionJudges: true, matchJudges: true } },
      },
    })

    if (!judge) {
      return NextResponse.json(
        { success: false, error: 'Judge not found' },
        { status: 404 }
      )
    }

    // Check federation access
    if (user.federationId && judge.federationId !== user.federationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied: not your federation' },
        { status: 403 }
      )
    }

    // Check if judge has assignments
    if (judge._count.competitionJudges > 0 || judge._count.matchJudges > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Невозможно удалить судью, так как он назначен на соревнования. Деактивируйте его вместо удаления.',
        },
        { status: 400 }
      )
    }

    // Delete discipline relations first
    await prisma.judgeDiscipline.deleteMany({
      where: { judgeId },
    })

    // Delete judge
    await prisma.judge.delete({
      where: { id: judgeId },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'judges',
        description: `Deleted judge: ${judge.lastName} ${judge.firstName}`,
        subjectType: 'Judge',
        subjectId: judgeId,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'delete' },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Judge deleted successfully',
    })
  } catch (error) {
    console.error('Delete judge error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete judge' },
      { status: 500 }
    )
  }
}
