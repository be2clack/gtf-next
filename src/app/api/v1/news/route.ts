import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'
import path from 'path'
import fs from 'fs/promises'

// Helper function to save uploaded file
async function saveUploadedFile(file: File, subdir: string): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subdir)
  await fs.mkdir(uploadDir, { recursive: true })

  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`
  const filepath = path.join(uploadDir, filename)

  await fs.writeFile(filepath, buffer)
  return filename
}

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

    // Parse body - support both JSON and FormData
    const contentType = request.headers.get('content-type') || ''
    let body: Record<string, unknown> = {}

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      for (const [key, value] of formData.entries()) {
        if (key === 'photo' && value instanceof File && value.size > 0) {
          body.photo = await saveUploadedFile(value, 'news')
        } else if (value !== '' && value !== 'undefined' && value !== 'null') {
          // Try to parse JSON for multilingual fields
          if (['title', 'description', 'content'].includes(key) && typeof value === 'string') {
            try {
              body[key] = JSON.parse(value)
            } catch {
              body[key] = value
            }
          } else {
            body[key] = value
          }
        }
      }
    } else {
      body = await request.json()
    }

    const {
      title,
      description,
      content,
      photo,
      date,
      published,
      ordering,
      federationId: bodyFederationId,
    } = body as Record<string, unknown>

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    const federationId = typeof bodyFederationId === 'number' ? bodyFederationId : (user.federationId || null)

    const news = await prisma.news.create({
      data: {
        federationId,
        title: typeof title === 'string' ? { ru: title } : (title as Record<string, string>),
        description: description
          ? typeof description === 'string'
            ? { ru: description }
            : (description as Record<string, string>)
          : Prisma.JsonNull,
        content: content
          ? typeof content === 'string'
            ? { ru: content }
            : (content as Record<string, string>)
          : Prisma.JsonNull,
        photo: photo as string | null,
        date: date ? new Date(date as string) : new Date(),
        published: (published as boolean) ?? false,
        ordering: (ordering as number) || 0,
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
