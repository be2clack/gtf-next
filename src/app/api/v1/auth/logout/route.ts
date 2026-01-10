import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'your-secret-key'
)

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    // Log activity if user was logged in
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        const userId = payload.userId as number

        await prisma.activityLog.create({
          data: {
            logName: 'auth',
            description: 'User logged out',
            causerType: 'User',
            causerId: userId,
          },
        })
      } catch {
        // Token invalid, just continue with logout
      }
    }

    // Clear auth cookie
    cookieStore.delete('auth-token')

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
