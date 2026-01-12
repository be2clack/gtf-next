import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/superadmin/references/age-categories/[id]
export async function GET(request: NextRequest, context: RouteContext) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const category = await prisma.ageCategory.findUnique({
      where: { id: parseInt(id) },
    })

    if (!category) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Failed to fetch age category:', error)
    return NextResponse.json({ error: 'Failed to fetch age category' }, { status: 500 })
  }
}

// PUT /api/superadmin/references/age-categories/[id]
export async function PUT(request: NextRequest, context: RouteContext) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const body = await request.json()
    const { code, nameRu, nameEn, minAge, maxAge, gender, isActive } = body

    // Check if category exists
    const existing = await prisma.ageCategory.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 })
    }

    // Check if code is unique (if changed)
    if (code && code !== existing.code) {
      const codeExists = await prisma.ageCategory.findFirst({
        where: { code, id: { not: parseInt(id) } },
      })
      if (codeExists) {
        return NextResponse.json({ error: 'Категория с таким кодом уже существует' }, { status: 400 })
      }
    }

    const category = await prisma.ageCategory.update({
      where: { id: parseInt(id) },
      data: {
        ...(code !== undefined && { code }),
        ...(nameRu !== undefined && { nameRu }),
        ...(nameEn !== undefined && { nameEn }),
        ...(minAge !== undefined && { minAge: parseInt(minAge) }),
        ...(maxAge !== undefined && { maxAge: parseInt(maxAge) }),
        ...(gender !== undefined && { gender }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Failed to update age category:', error)
    return NextResponse.json({ error: 'Failed to update age category' }, { status: 500 })
  }
}

// DELETE /api/superadmin/references/age-categories/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    // Check if category is used
    const category = await prisma.ageCategory.findUnique({
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

    await prisma.ageCategory.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete age category:', error)
    return NextResponse.json({ error: 'Failed to delete age category' }, { status: 500 })
  }
}
