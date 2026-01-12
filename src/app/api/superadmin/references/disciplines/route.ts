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
    const { code, name, sortOrder, isActive } = body

    const discipline = await prisma.discipline.create({
      data: {
        code,
        name,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
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
