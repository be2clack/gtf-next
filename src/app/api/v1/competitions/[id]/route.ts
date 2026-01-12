import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getTranslation } from '@/lib/utils/multilingual'
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

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/v1/competitions/:id - Get competition details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const locale = (searchParams.get('locale') || 'ru') as Locale

    const competition = await prisma.competition.findUnique({
      where: { id: parseInt(id), deletedAt: null },
      include: {
        federation: { select: { id: true, code: true, name: true, logo: true } },
        country: { select: { id: true, nameRu: true, nameEn: true, flagEmoji: true } },
        region: { select: { id: true, nameRu: true, nameEn: true } },
        city: { select: { id: true, nameRu: true, nameEn: true } },
        disciplines: {
          where: { isActive: true },
          include: {
            discipline: {
              select: { id: true, name: true, nameRu: true, nameEn: true, type: true }
            }
          }
        },
        categories: {
          include: {
            ageCategory: true,
            weightCategory: true,
            beltCategory: true,
            discipline: { select: { id: true, name: true, nameRu: true, nameEn: true } },
            _count: { select: { registrations: true } }
          },
          orderBy: [
            { gender: 'asc' },
            { ageCategoryId: 'asc' },
            { weightCategoryId: 'asc' }
          ]
        },
        _count: {
          select: {
            registrations: true,
            categories: true,
            judges: true,
          },
        },
      },
    })

    if (!competition) {
      return NextResponse.json(
        { success: false, error: 'Competition not found' },
        { status: 404 }
      )
    }

    // Transform for locale
    const data = {
      ...competition,
      title: getTranslation(competition.title as Record<string, string>, locale),
      description: getTranslation(competition.description as Record<string, string>, locale),
      venue: getTranslation(competition.venue as Record<string, string>, locale),
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get competition error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch competition' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/competitions/:id - Update competition
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const competition = await prisma.competition.findUnique({
      where: { id: parseInt(id), deletedAt: null },
    })

    if (!competition) {
      return NextResponse.json(
        { success: false, error: 'Competition not found' },
        { status: 404 }
      )
    }

    // Check federation access
    if (user.federationId && competition.federationId !== user.federationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Parse body - support both JSON and FormData
    const contentType = request.headers.get('content-type') || ''
    let body: Record<string, unknown> = {}

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      for (const [key, value] of formData.entries()) {
        if (key === 'photo' && value instanceof File && value.size > 0) {
          body.photo = await saveUploadedFile(value, 'competitions')
        } else if (value !== '' && value !== 'undefined' && value !== 'null') {
          // Try to parse JSON for multilingual fields
          if (['title', 'description', 'venue'].includes(key) && typeof value === 'string') {
            try {
              body[key] = JSON.parse(value)
            } catch {
              body[key] = value
            }
          } else {
            body[key] = value
          }
        }
      }
    } else {
      body = await request.json()
    }

    const updateData: Record<string, unknown> = { updatedById: user.id }

    // Handle updatable fields
    const fields = [
      'title', 'description', 'venue', 'photo', 'status', 'level', 'type', 'format',
      'ratingType', 'countryId', 'regionId', 'cityId', 'isPaid', 'baseRegistrationFee',
      'additionalDisciplineFee', 'registrationFee', 'currency', 'tatamiCount',
      'medicalCheckRequired', 'insuranceRequired', 'weighInDate', 'rulesVersion'
    ]

    for (const field of fields) {
      if (body[field] !== undefined) {
        if (['title', 'description', 'venue'].includes(field)) {
          updateData[field] = typeof body[field] === 'string'
            ? { ru: body[field] }
            : body[field]
        } else if (['countryId', 'regionId', 'cityId', 'tatamiCount'].includes(field)) {
          updateData[field] = body[field] ? parseInt(String(body[field])) : null
        } else if (['baseRegistrationFee', 'additionalDisciplineFee', 'registrationFee'].includes(field)) {
          updateData[field] = body[field] ? parseFloat(String(body[field])) : null
        } else if (['status', 'level', 'type', 'format', 'ratingType'].includes(field)) {
          updateData[field] = String(body[field]).toUpperCase()
        } else if (['medicalCheckRequired', 'insuranceRequired', 'isPaid'].includes(field)) {
          updateData[field] = body[field] === true || body[field] === 'true'
        } else {
          updateData[field] = body[field]
        }
      }
    }

    // Handle photo removal
    if (body.removePhoto === 'true' || body.removePhoto === true) {
      updateData.photo = null
    }

    // Handle dates
    if (body.startDate) updateData.startDate = new Date(body.startDate as string)
    if (body.endDate) updateData.endDate = new Date(body.endDate as string)
    if (body.registrationDeadline) updateData.registrationDeadline = new Date(body.registrationDeadline as string)
    if (body.withdrawalDeadline) updateData.withdrawalDeadline = new Date(body.withdrawalDeadline as string)
    if (body.weighInDate) updateData.weighInDate = new Date(body.weighInDate as string)

    const updated = await prisma.competition.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        federation: { select: { id: true, code: true, name: true } },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'competitions',
        description: `Updated competition: ${getTranslation(updated.title as Record<string, string>, 'ru')}`,
        subjectType: 'Competition',
        subjectId: updated.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'update', changes: Object.keys(body) },
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Update competition error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update competition' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/competitions/:id - Soft delete competition
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const competition = await prisma.competition.findUnique({
      where: { id: parseInt(id), deletedAt: null },
    })

    if (!competition) {
      return NextResponse.json(
        { success: false, error: 'Competition not found' },
        { status: 404 }
      )
    }

    // Check federation access
    if (user.federationId && competition.federationId !== user.federationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Cannot delete if has registrations
    const registrationsCount = await prisma.competitionRegistration.count({
      where: { competitionId: parseInt(id) }
    })

    if (registrationsCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete competition with registrations' },
        { status: 400 }
      )
    }

    // Soft delete
    await prisma.competition.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: new Date(),
        status: 'CANCELLED',
        updatedById: user.id,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'competitions',
        description: `Deleted competition: ${getTranslation(competition.title as Record<string, string>, 'ru')}`,
        subjectType: 'Competition',
        subjectId: competition.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'delete' },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Competition deleted successfully',
    })
  } catch (error) {
    console.error('Delete competition error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete competition' },
      { status: 500 }
    )
  }
}
