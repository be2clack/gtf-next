import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/v1/disciplines - List all active disciplines
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}

    if (isActive === null || isActive === undefined || isActive === 'true') {
      where.isActive = true
    } else if (isActive === 'false') {
      where.isActive = false
    }

    const disciplines = await prisma.discipline.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        nameRu: true,
        nameEn: true,
        type: true,
        hasWeightCategories: true,
        hasBeltCategories: true,
        teamSize: true,
        sortOrder: true,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: disciplines,
    })
  } catch (error) {
    console.error('Get disciplines error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch disciplines' },
      { status: 500 }
    )
  }
}
