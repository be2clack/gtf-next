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
    orderBy: { minLevel: 'asc' },
    include: {
      discipline: {
        select: { id: true, code: true, nameRu: true, nameEn: true },
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
    const { code, name, minLevel, maxLevel, disciplineId, isActive } = body

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Код и название обязательны' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await prisma.beltCategory.findFirst({
      where: { code },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Категория с таким кодом уже существует' },
        { status: 400 }
      )
    }

    const category = await prisma.beltCategory.create({
      data: {
        code,
        name,
        minLevel: minLevel ? parseInt(minLevel) : 0,
        maxLevel: maxLevel ? parseInt(maxLevel) : 0,
        disciplineId: disciplineId ? parseInt(disciplineId) : null,
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
