import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/superadmin/settings - Get global settings (federationId = null)
export async function GET() {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await prisma.setting.findMany({
    where: { federationId: null },
    orderBy: [{ group: 'asc' }, { key: 'asc' }],
  })

  // Transform to key-value object grouped by group
  const grouped = settings.reduce(
    (acc, setting) => {
      const group = setting.group || 'general'
      if (!acc[group]) acc[group] = {}
      acc[group][setting.key] = setting.value
      return acc
    },
    {} as Record<string, Record<string, string | null>>
  )

  return NextResponse.json(grouped)
}

// POST /api/superadmin/settings - Bulk update settings
export async function POST(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { settings, group } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object required' }, { status: 400 })
    }

    // Upsert each setting
    const results = await Promise.all(
      Object.entries(settings).map(async ([key, value]) => {
        return prisma.setting.upsert({
          where: {
            federationId_key: {
              federationId: null as unknown as number,
              key,
            },
          },
          update: {
            value: value as string | null,
            group: group || 'general',
          },
          create: {
            federationId: null,
            key,
            value: value as string | null,
            group: group || 'general',
            dataType: 'string',
          },
        })
      })
    )

    return NextResponse.json({ success: true, count: results.length })
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}

// PUT /api/superadmin/settings - Update global settings
export async function PUT(request: NextRequest) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { key, value, group, dataType } = body

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    // Upsert the setting
    const setting = await prisma.setting.upsert({
      where: {
        federationId_key: {
          federationId: null as unknown as number,
          key,
        },
      },
      update: { value, group, dataType },
      create: {
        federationId: null,
        key,
        value,
        group: group || 'general',
        dataType: dataType || 'string',
      },
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Failed to update setting:', error)
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}
