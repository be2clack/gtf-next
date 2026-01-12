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
    const { code, name, minWeight, maxWeight, gender, isActive } = body

    const category = await prisma.weightCategory.create({
      data: {
        code,
        name,
        minWeight,
        maxWeight,
        gender,
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
