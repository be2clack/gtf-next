import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/v1/competitions/:id/schedule - Get competition schedule
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const locale = (searchParams.get('locale') || 'ru') as Locale
    const tatamiNumber = searchParams.get('tatami')
    const date = searchParams.get('date')

    const competition = await prisma.competition.findUnique({
      where: { id: parseInt(id), deletedAt: null },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        tatamiCount: true,
        status: true,
      }
    })

    if (!competition) {
      return NextResponse.json(
        { success: false, error: 'Competition not found' },
        { status: 404 }
      )
    }

    // Build where clause for categories
    const categoryWhere: Record<string, unknown> = {
      competitionId: parseInt(id),
      scheduledStartTime: { not: null }
    }

    if (tatamiNumber) {
      categoryWhere.tatamiNumber = parseInt(tatamiNumber)
    }

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      categoryWhere.scheduledStartTime = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    // Get categories with schedule
    const categories = await prisma.competitionCategory.findMany({
      where: categoryWhere,
      include: {
        discipline: {
          select: { id: true, name: true, nameRu: true, nameEn: true, type: true }
        },
        ageCategory: {
          select: { id: true, code: true, nameRu: true, nameEn: true, minAge: true, maxAge: true }
        },
        weightCategory: {
          select: { id: true, code: true, name: true, minWeight: true, maxWeight: true }
        },
        _count: {
          select: { registrations: true }
        }
      },
      orderBy: [
        { tatamiNumber: 'asc' },
        { scheduledStartTime: 'asc' }
      ]
    })

    // Group by tatami
    const scheduleByTatami: Record<number, typeof categories> = {}
    for (const category of categories) {
      const tatami = category.tatamiNumber || 0
      if (!scheduleByTatami[tatami]) {
        scheduleByTatami[tatami] = []
      }
      scheduleByTatami[tatami].push(category)
    }

    // Transform for output
    const schedule = Object.entries(scheduleByTatami).map(([tatami, cats]) => ({
      tatamiNumber: parseInt(tatami),
      categories: cats.map(cat => ({
        id: cat.id,
        name: cat.name || `${cat.discipline?.nameRu || 'Category'} - ${cat.gender}`,
        disciplineName: cat.discipline
          ? (locale === 'en' ? cat.discipline.nameEn : cat.discipline.nameRu) || cat.discipline.name
          : null,
        ageCategoryName: cat.ageCategory
          ? (locale === 'en' ? cat.ageCategory.nameEn : cat.ageCategory.nameRu)
          : null,
        weightCategoryName: cat.weightCategory?.name,
        gender: cat.gender,
        scheduledStartTime: cat.scheduledStartTime,
        scheduledEndTime: cat.scheduledEndTime,
        actualStartTime: cat.actualStartTime,
        estimatedDuration: cat.estimatedDuration,
        participantsCount: cat._count.registrations,
        status: cat.categoryStatus || 'pending',
      }))
    }))

    return NextResponse.json({
      success: true,
      data: {
        competition: {
          id: competition.id,
          title: getTranslation(competition.title as Record<string, string>, locale),
          startDate: competition.startDate,
          endDate: competition.endDate,
          tatamiCount: competition.tatamiCount,
          status: competition.status,
        },
        schedule,
        meta: {
          totalCategories: categories.length,
          tatamiCount: Object.keys(scheduleByTatami).length,
        }
      }
    })
  } catch (error) {
    console.error('Get competition schedule error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}
