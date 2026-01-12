import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/superadmin/references/disciplines - List all disciplines
export async function GET() {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const disciplines = await prisma.discipline.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json(disciplines)
}

// POST /api/superadmin/references/disciplines - Create discipline
export async function POST(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { code, name, nameRu, nameEn, description, sortOrder, isActive, type, hasWeightCategories, hasBeltCategories, teamSize } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Код дисциплины обязателен' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await prisma.discipline.findUnique({
      where: { code },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Дисциплина с таким кодом уже существует' },
        { status: 400 }
      )
    }

    const discipline = await prisma.discipline.create({
      data: {
        code,
        name: nameRu || name || code, // Use nameRu or fallback to name or code
        nameRu: nameRu || name || null,
        nameEn: nameEn || null,
        description: description || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
        type: type || 'MASSOGI',
        hasWeightCategories: hasWeightCategories !== false,
        hasBeltCategories: hasBeltCategories !== false,
        teamSize: teamSize || null,
      },
    })

    return NextResponse.json(discipline, { status: 201 })
  } catch (error) {
    console.error('Failed to create discipline:', error)
    return NextResponse.json(
      { error: 'Failed to create discipline' },
      { status: 500 }
    )
  }
}
