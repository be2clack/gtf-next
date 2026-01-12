import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/superadmin/references/belt-categories
export async function GET() {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const categories = await prisma.beltCategory.findMany({
    orderBy: [
      { ageCategoryId: 'asc' },
      { beltMin: 'desc' },
    ],
    include: {
      ageCategory: {
        select: { id: true, code: true, nameRu: true, nameEn: true },
      },
      discipline: {
        select: { id: true, code: true, nameRu: true, name: true },
      },
    },
  })

  return NextResponse.json(categories)
}

// POST /api/superadmin/references/belt-categories
export async function POST(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { ageCategoryId, disciplineId, beltMin, beltMax, name, sortOrder, isActive } = body

    if (!ageCategoryId || !disciplineId || !name) {
      return NextResponse.json(
        { error: 'Возрастная категория, дисциплина и название обязательны' },
        { status: 400 }
      )
    }

    const category = await prisma.beltCategory.create({
      data: {
        ageCategoryId: parseInt(ageCategoryId),
        disciplineId: parseInt(disciplineId),
        beltMin: parseInt(beltMin) || 0,
        beltMax: parseInt(beltMax) || 0,
        name,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        isActive: isActive !== false,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Failed to create belt category:', error)
    return NextResponse.json(
      { error: 'Failed to create belt category' },
      { status: 500 }
    )
  }
}
