import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/superadmin/references/age-categories
export async function GET() {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const categories = await prisma.ageCategory.findMany({
    orderBy: { minAge: 'asc' },
  })

  return NextResponse.json(categories)
}

// POST /api/superadmin/references/age-categories
export async function POST(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { code, nameRu, nameEn, minAge, maxAge, gender, isActive } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Код обязателен' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await prisma.ageCategory.findFirst({
      where: { code },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Категория с таким кодом уже существует' },
        { status: 400 }
      )
    }

    const category = await prisma.ageCategory.create({
      data: {
        code,
        nameRu: nameRu || null,
        nameEn: nameEn || null,
        minAge: parseInt(minAge) || 0,
        maxAge: parseInt(maxAge) || 99,
        gender: gender || 'MIXED',
        isActive: isActive !== false,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Failed to create age category:', error)
    return NextResponse.json(
      { error: 'Failed to create age category' },
      { status: 500 }
    )
  }
}
