import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/superadmin/federations/[id]/admins - List federation admins
export async function GET(request: NextRequest, { params }: RouteParams) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const admins = await prisma.federationAdmin.findMany({
    where: { federationId: parseInt(id) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
  })

  return NextResponse.json(admins)
}

// POST /api/superadmin/federations/[id]/admins - Add admin to federation
export async function POST(request: NextRequest, { params }: RouteParams) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { userId, phone } = body

    let user

    if (userId) {
      // Find existing user
      user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
      })
    } else if (phone) {
      // Find or create user by phone
      user = await prisma.user.findFirst({
        where: { phone },
      })

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            name: 'Federation Admin',
            phone,
            type: 'ADMIN',
            federationId: parseInt(id),
          },
        })
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found and no phone provided' },
        { status: 400 }
      )
    }

    // Check if already admin
    const existing = await prisma.federationAdmin.findFirst({
      where: {
        federationId: parseInt(id),
        userId: user.id,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'User is already an admin of this federation' },
        { status: 400 }
      )
    }

    // Add as admin
    const admin = await prisma.federationAdmin.create({
      data: {
        federationId: parseInt(id),
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(admin, { status: 201 })
  } catch (error) {
    console.error('Failed to add admin:', error)
    return NextResponse.json(
      { error: 'Failed to add admin' },
      { status: 500 }
    )
  }
}
