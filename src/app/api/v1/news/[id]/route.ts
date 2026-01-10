import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/v1/news/:id - Get single news
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const locale = (searchParams.get('locale') || 'ru') as Locale

    const news = await prisma.news.findUnique({
      where: { id: parseInt(id) },
      include: {
        federation: { select: { id: true, code: true, name: true } },
      },
    })

    if (!news) {
      return NextResponse.json(
        { success: false, error: 'News not found' },
        { status: 404 }
      )
    }

    // Transform for locale
    const data = {
      ...news,
      title: getTranslation(news.title as Record<string, string>, locale),
      description: getTranslation(news.description as Record<string, string>, locale),
      content: getTranslation(news.content as Record<string, string>, locale),
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get news error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/news/:id - Update news
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const news = await prisma.news.findUnique({
      where: { id: parseInt(id) },
    })

    if (!news) {
      return NextResponse.json(
        { success: false, error: 'News not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (body.title !== undefined) {
      updateData.title = typeof body.title === 'string' ? { ru: body.title } : body.title
    }
    if (body.description !== undefined) {
      updateData.description = typeof body.description === 'string' ? { ru: body.description } : body.description
    }
    if (body.content !== undefined) {
      updateData.content = typeof body.content === 'string' ? { ru: body.content } : body.content
    }
    if (body.photo !== undefined) updateData.photo = body.photo
    if (body.date !== undefined) updateData.date = new Date(body.date)
    if (body.published !== undefined) updateData.published = body.published
    if (body.ordering !== undefined) updateData.ordering = body.ordering

    const updated = await prisma.news.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        federation: { select: { id: true, code: true, name: true } },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'news',
        description: `Updated news: ${getTranslation(updated.title as Record<string, string>, 'ru')}`,
        subjectType: 'News',
        subjectId: updated.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'update', changes: Object.keys(body) },
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Update news error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update news' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/news/:id - Delete news
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const news = await prisma.news.findUnique({
      where: { id: parseInt(id) },
    })

    if (!news) {
      return NextResponse.json(
        { success: false, error: 'News not found' },
        { status: 404 }
      )
    }

    await prisma.news.delete({
      where: { id: parseInt(id) },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'news',
        description: `Deleted news: ${getTranslation(news.title as Record<string, string>, 'ru')}`,
        subjectType: 'News',
        subjectId: news.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'delete' },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'News deleted successfully',
    })
  } catch (error) {
    console.error('Delete news error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete news' },
      { status: 500 }
    )
  }
}
