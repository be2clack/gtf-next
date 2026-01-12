import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/superadmin/references/disciplines/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const discipline = await prisma.discipline.findUnique({
    where: { id: parseInt(id) },
    include: {
      _count: {
        select: {
          competitionDisciplines: true,
        },
      },
    },
  })

  if (!discipline) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(discipline)
}

// PUT /api/superadmin/references/disciplines/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { code, name, nameRu, nameEn, description, sortOrder, isActive, type, hasWeightCategories, hasBeltCategories, teamSize } = body

    // Check if code already exists (excluding current)
    if (code) {
      const existing = await prisma.discipline.findFirst({
        where: {
          code,
          id: { not: parseInt(id) },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Дисциплина с таким кодом уже существует' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (code !== undefined) updateData.code = code
    if (name !== undefined) updateData.name = name
    if (nameRu !== undefined) {
      updateData.nameRu = nameRu
      updateData.name = nameRu // Also update name field for backwards compatibility
    }
    if (nameEn !== undefined) updateData.nameEn = nameEn
    if (description !== undefined) updateData.description = description
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder
    if (isActive !== undefined) updateData.isActive = isActive
    if (type !== undefined) updateData.type = type
    if (hasWeightCategories !== undefined) updateData.hasWeightCategories = hasWeightCategories
    if (hasBeltCategories !== undefined) updateData.hasBeltCategories = hasBeltCategories
    if (teamSize !== undefined) updateData.teamSize = teamSize

    const discipline = await prisma.discipline.update({
      where: { id: parseInt(id) },
      data: updateData,
    })

    return NextResponse.json(discipline)
  } catch (error) {
    console.error('Failed to update discipline:', error)
    return NextResponse.json(
      { error: 'Failed to update discipline' },
      { status: 500 }
    )
  }
}

// DELETE /api/superadmin/references/disciplines/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if discipline is used
    const discipline = await prisma.discipline.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            competitionDisciplines: true,
          },
        },
      },
    })

    if (!discipline) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (discipline._count.competitionDisciplines > 0) {
      return NextResponse.json(
        { error: 'Нельзя удалить дисциплину, которая используется в соревнованиях' },
        { status: 400 }
      )
    }

    await prisma.discipline.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete discipline:', error)
    return NextResponse.json(
      { error: 'Failed to delete discipline' },
      { status: 500 }
    )
  }
}
