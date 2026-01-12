import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { getFederationContext } from '@/lib/federation'

// GET /api/v1/activity-log - List activity logs
export async function GET(request: NextRequest) {
  try {
    const [user, admin, { federation }] = await Promise.all([
      getCurrentUser(),
      isAdmin(),
      getFederationContext(),
    ])

    if (!user || !admin) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: Record<string, unknown> = {}

    // Search
    if (search) {
      where.description = { contains: search, mode: 'insensitive' }
    }

    // Get total count
    const total = await prisma.activityLog.count({ where })

    // Get logs
    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        causer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get activity logs error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}
