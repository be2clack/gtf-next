import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/superadmin/references/weight-categories/[id]
export async function GET(request: NextRequest, context: RouteContext) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const category = await prisma.weightCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
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
    console.error('Failed to fetch weight category:', error)
    return NextResponse.json({ error: 'Failed to fetch weight category' }, { status: 500 })
  }
}

// PUT /api/superadmin/references/weight-categories/[id]
export async function PUT(request: NextRequest, context: RouteContext) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const body = await request.json()
    const { code, name, minWeight, maxWeight, gender, disciplineId, isActive } = body

    // Check if category exists
    const existing = await prisma.weightCategory.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 })
    }

    // Check if code is unique (if changed)
    if (code && code !== existing.code) {
      const codeExists = await prisma.weightCategory.findFirst({
        where: { code, id: { not: parseInt(id) } },
      })
      if (codeExists) {
        return NextResponse.json({ error: 'Категория с таким кодом уже существует' }, { status: 400 })
      }
    }

    const category = await prisma.weightCategory.update({
      where: { id: parseInt(id) },
      data: {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(minWeight !== undefined && { minWeight: parseFloat(minWeight) }),
        ...(maxWeight !== undefined && { maxWeight: parseFloat(maxWeight) }),
        ...(gender !== undefined && { gender }),
        ...(disciplineId !== undefined && { disciplineId: disciplineId ? parseInt(disciplineId) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Failed to update weight category:', error)
    return NextResponse.json({ error: 'Failed to update weight category' }, { status: 500 })
  }
}

// DELETE /api/superadmin/references/weight-categories/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    // Check if category is used
    const category = await prisma.weightCategory.findUnique({
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

    await prisma.weightCategory.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete weight category:', error)
    return NextResponse.json({ error: 'Failed to delete weight category' }, { status: 500 })
  }
}
