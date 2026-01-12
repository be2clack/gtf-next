import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/superadmin/references/weight-categories
export async function GET() {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const categories = await prisma.weightCategory.findMany({
    orderBy: [{ gender: 'asc' }, { minWeight: 'asc' }],
  })

  return NextResponse.json(categories)
}

// POST /api/superadmin/references/weight-categories
export async function POST(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { code, name, minWeight, maxWeight, gender, disciplineId, isActive } = body

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Код и название обязательны' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await prisma.weightCategory.findFirst({
      where: { code },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Категория с таким кодом уже существует' },
        { status: 400 }
      )
    }

    const category = await prisma.weightCategory.create({
      data: {
        code,
        name,
        minWeight: minWeight ? parseFloat(minWeight) : 0,
        maxWeight: maxWeight ? parseFloat(maxWeight) : 0,
        gender: gender || 'MALE',
        disciplineId: disciplineId ? parseInt(disciplineId) : null,
        isActive: isActive !== false,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Failed to create weight category:', error)
    return NextResponse.json(
      { error: 'Failed to create weight category' },
      { status: 500 }
    )
  }
}
