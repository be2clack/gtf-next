import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/v1/competitions/:id/categories - Get competition categories
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const locale = (searchParams.get('locale') || 'ru') as Locale
    const disciplineId = searchParams.get('disciplineId')
    const gender = searchParams.get('gender')

    const competition = await prisma.competition.findUnique({
      where: { id: parseInt(id), deletedAt: null },
      select: { id: true, status: true }
    })

    if (!competition) {
      return NextResponse.json(
        { success: false, error: 'Competition not found' },
        { status: 404 }
      )
    }

    const where: Record<string, unknown> = { competitionId: parseInt(id) }

    if (disciplineId) {
      where.disciplineId = parseInt(disciplineId)
    }

    if (gender) {
      where.gender = gender.toUpperCase()
    }

    const categories = await prisma.competitionCategory.findMany({
      where,
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
        beltCategory: {
          select: { id: true, name: true, beltMin: true, beltMax: true }
        },
        bracket: {
          select: { id: true, bracketType: true, bracketSize: true, status: true, generatedAt: true }
        },
        _count: {
          select: { registrations: true }
        }
      },
      orderBy: [
        { disciplineId: 'asc' },
        { gender: 'asc' },
        { ageCategoryId: 'asc' },
        { weightCategoryId: 'asc' }
      ]
    })

    // Transform for locale
    const data = categories.map(category => ({
      ...category,
      disciplineName: category.discipline
        ? (locale === 'en' ? category.discipline.nameEn : category.discipline.nameRu) || category.discipline.name
        : null,
      ageCategoryName: category.ageCategory
        ? (locale === 'en' ? category.ageCategory.nameEn : category.ageCategory.nameRu)
        : null,
      participantsCount: category._count.registrations,
      hasBracket: !!category.bracket,
      bracketStatus: category.bracket?.status || null,
    }))

    return NextResponse.json({
      success: true,
      data,
      meta: {
        total: categories.length,
        competitionId: parseInt(id),
        competitionStatus: competition.status,
      }
    })
  } catch (error) {
    console.error('Get competition categories error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
