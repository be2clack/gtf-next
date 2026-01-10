import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'your-secret-key'
)

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    let payload
    try {
      const result = await jwtVerify(token, JWT_SECRET)
      payload = result.payload
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = payload.userId as number

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        nameLatin: true,
        email: true,
        phone: true,
        type: true,
        entityId: true,
        telegramUsername: true,
        telegramVerifiedAt: true,
        federation: {
          select: {
            id: true,
            code: true,
            name: true,
            domain: true,
            currency: true,
            timezone: true,
            primaryLanguage: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get additional entity data based on user type
    let entity: Record<string, unknown> | null = null
    if (user.entityId) {
      switch (user.type) {
        case 'SPORTSMAN':
          entity = await prisma.sportsman.findUnique({
            where: { id: user.entityId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photo: true,
              beltLevel: true,
              club: { select: { id: true, title: true } },
            },
          })
          break
        case 'TRAINER':
          entity = await prisma.trainer.findUnique({
            where: { id: user.entityId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photo: true,
              rank: true,
              club: { select: { id: true, title: true } },
            },
          })
          break
      }
    }
    if (user.type === 'JUDGE') {
      entity = await prisma.judge.findFirst({
        where: { userId: user.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photo: true,
          judgeCategory: true,
          isInternational: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        entity,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
