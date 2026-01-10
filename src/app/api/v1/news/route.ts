import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'

// GET /api/v1/news - List news
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const federationId = searchParams.get('federationId')
    const published = searchParams.get('published')
    const locale = (searchParams.get('locale') || 'ru') as Locale

    // Build where clause
    const where: Record<string, unknown> = {}

    if (federationId) {
      where.federationId = parseInt(federationId)
    }

    if (published !== null && published !== undefined) {
      where.published = published === 'true'
    }

    // Get total count
    const total = await prisma.news.count({ where })

    // Get news
    const news = await prisma.news.findMany({
      where,
      include: {
        federation: { select: { id: true, code: true, name: true } },
      },
      orderBy: [
        { ordering: 'asc' },
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    })

    // Transform for locale
    const data = news.map(item => ({
      ...item,
      title: getTranslation(item.title as Record<string, string>, locale),
      description: getTranslation(item.description as Record<string, string>, locale),
    }))

    return NextResponse.json({
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get news error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}

// POST /api/v1/news - Create news
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const {
      title,
      description,
      content,
      photo,
      date,
      published,
      ordering,
      federationId: bodyFederationId,
    } = body

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    const federationId = bodyFederationId || user.federationId

    const news = await prisma.news.create({
      data: {
        federationId,
        title: typeof title === 'string' ? { ru: title } : title,
        description: description
          ? typeof description === 'string'
            ? { ru: description }
            : description
          : null,
        content: content
          ? typeof content === 'string'
            ? { ru: content }
            : content
          : null,
        photo,
        date: date ? new Date(date) : new Date(),
        published: published ?? false,
        ordering: ordering || 0,
      },
      include: {
        federation: { select: { id: true, code: true, name: true } },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'news',
        description: `Created news: ${getTranslation(news.title as Record<string, string>, 'ru')}`,
        subjectType: 'News',
        subjectId: news.id,
        causerType: 'User',
        causerId: user.id,
        properties: { action: 'create' },
      },
    })

    return NextResponse.json({
      success: true,
      data: news,
    })
  } catch (error) {
    console.error('Create news error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create news' },
      { status: 500 }
    )
  }
}
