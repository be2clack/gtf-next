import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/superadmin/federations - List all federations
export async function GET() {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const federations = await prisma.federation.findMany({
    orderBy: { name: 'asc' },
    include: {
      country: true,
      _count: {
        select: {
          sportsmen: true,
          clubs: true,
          competitions: true,
          admins: true,
        },
      },
    },
  })

  return NextResponse.json(federations)
}

// POST /api/superadmin/federations - Create new federation
export async function POST(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { code, name, countryId, currency, timezone, domain } = body

    // Validate required fields
    if (!code || !name || !countryId) {
      return NextResponse.json(
        { error: 'Code, name and countryId are required' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await prisma.federation.findUnique({
      where: { code: code.toLowerCase() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Federation with this code already exists' },
        { status: 400 }
      )
    }

    // Create federation
    const federation = await prisma.federation.create({
      data: {
        code: code.toLowerCase(),
        name,
        countryId: parseInt(countryId),
        currency: currency || 'USD',
        timezone: timezone || 'UTC',
        domain: domain || `${code.toLowerCase()}.gtf.global`,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json(federation, { status: 201 })
  } catch (error) {
    console.error('Failed to create federation:', error)
    return NextResponse.json(
      { error: 'Failed to create federation' },
      { status: 500 }
    )
  }
}
