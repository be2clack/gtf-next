import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/superadmin/references/belt-categories/[id]
export async function GET(request: NextRequest, context: RouteContext) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const category = await prisma.beltCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        ageCategory: {
          select: { id: true, code: true, nameRu: true, nameEn: true },
        },
        discipline: {
          select: { id: true, code: true, nameRu: true, name: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Failed to fetch belt category:', error)
    return NextResponse.json({ error: 'Failed to fetch belt category' }, { status: 500 })
  }
}

// PUT /api/superadmin/references/belt-categories/[id]
export async function PUT(request: NextRequest, context: RouteContext) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const body = await request.json()
    const { ageCategoryId, disciplineId, beltMin, beltMax, name, sortOrder, isActive } = body

    // Check if category exists
    const existing = await prisma.beltCategory.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 })
    }

    const category = await prisma.beltCategory.update({
      where: { id: parseInt(id) },
      data: {
        ...(ageCategoryId !== undefined && { ageCategoryId: parseInt(ageCategoryId) }),
        ...(disciplineId !== undefined && { disciplineId: parseInt(disciplineId) }),
        ...(beltMin !== undefined && { beltMin: parseInt(beltMin) }),
        ...(beltMax !== undefined && { beltMax: parseInt(beltMax) }),
        ...(name !== undefined && { name }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Failed to update belt category:', error)
    return NextResponse.json({ error: 'Failed to update belt category' }, { status: 500 })
  }
}

// DELETE /api/superadmin/references/belt-categories/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    // Check if category is used
    const category = await prisma.beltCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { competitionCategories: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 })
    }

    if (category._count.competitionCategories > 0) {
      return NextResponse.json(
        { error: `Категория используется в ${category._count.competitionCategories} соревновательных категориях` },
        { status: 400 }
      )
    }

    await prisma.beltCategory.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete belt category:', error)
    return NextResponse.json({ error: 'Failed to delete belt category' }, { status: 500 })
  }
}
