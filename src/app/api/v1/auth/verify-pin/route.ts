import { NextRequest, NextResponse } from 'next/server'
import { verifyPin, findOrCreateUserByPhone } from '@/services/auth/pin.service'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'your-secret-key'
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code } = body

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, error: 'Phone and code are required' },
        { status: 400 }
      )
    }

    // Verify PIN
    const verifyResult = await verifyPin(phone, code)

    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: verifyResult.error },
        { status: 401 }
      )
    }

    // Get or create user
    const { user, isNew } = await findOrCreateUserByPhone(phone)

    // Get full user data
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        federation: {
          select: {
            id: true,
            code: true,
            name: true,
            domain: true,
          },
        },
      },
    })

    if (!fullUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: fullUser.id,
      name: fullUser.name,
      phone: fullUser.phone,
      type: fullUser.type,
      federationId: fullUser.federationId,
      federationCode: fullUser.federation?.code,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        logName: 'auth',
        description: `User logged in via PIN`,
        causerType: 'User',
        causerId: fullUser.id,
        properties: {
          method: 'pin',
          isNew,
          userType: fullUser.type,
        },
      },
    })

    // Determine redirect URL based on user type
    let redirectUrl = '/'
    switch (fullUser.type) {
      case 'ADMIN':
        // Superadmin (no federation) -> /superadmin
        // Federation admin -> /admin
        redirectUrl = fullUser.federationId ? '/admin' : '/superadmin'
        break
      case 'SPORTSMAN':
        redirectUrl = '/cabinet'
        break
      case 'TRAINER':
        redirectUrl = '/cabinet'
        break
      case 'JUDGE':
        redirectUrl = '/cabinet'
        break
      case 'REPRESENTATIVE':
        redirectUrl = '/cabinet'
        break
      default:
        redirectUrl = '/'
    }

    return NextResponse.json({
      success: true,
      user: {
        id: fullUser.id,
        name: fullUser.name,
        phone: fullUser.phone,
        type: fullUser.type,
        federation: fullUser.federation,
      },
      isNew,
      redirectUrl,
    })
  } catch (error) {
    console.error('Verify PIN error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
