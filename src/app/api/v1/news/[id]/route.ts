import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
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
      // Also include raw multilingual data for edit form
      titleMultilingual: news.title,
      descriptionMultilingual: news.description,
      contentMultilingual: news.content,
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

    const news = await prisma.news.findUnique({
      where: { id: parseInt(id) },
    })

    if (!news) {
      return NextResponse.json(
        { success: false, error: 'News not found' },
        { status: 404 }
      )
    }

    // Check federation access
    if (user.federationId && news.federationId !== user.federationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
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
    if (body.date !== undefined) updateData.date = new Date(body.date as string)
    if (body.published !== undefined) {
      updateData.published = body.published === true || body.published === 'true'
    }
    if (body.ordering !== undefined) {
      updateData.ordering = parseInt(String(body.ordering)) || 0
    }

    // Handle photo removal
    if (body.removePhoto === 'true' || body.removePhoto === true) {
      updateData.photo = null
    }

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

    // Check federation access
    if (user.federationId && news.federationId !== user.federationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
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
