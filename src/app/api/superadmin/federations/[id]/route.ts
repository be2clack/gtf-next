import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/superadmin/federations/[id] - Get federation details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const federation = await prisma.federation.findUnique({
    where: { id: parseInt(id) },
    include: {
      country: true,
      admins: {
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
      },
      _count: {
        select: {
          sportsmen: true,
          clubs: true,
          competitions: true,
          trainers: true,
          judges: true,
        },
      },
    },
  })

  if (!federation) {
    return NextResponse.json({ error: 'Federation not found' }, { status: 404 })
  }

  return NextResponse.json(federation)
}

// PUT /api/superadmin/federations/[id] - Update federation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const {
      name,
      nameEn,
      countryId,
      currency,
      timezone,
      domain,
      customDomain,
      status,
      primaryLanguage,
      languages,
      contactEmail,
      contactPhone,
      description,
      siteTitle,
      metaDescription,
      aboutText,
      address,
      workingHours,
      instagram,
      facebook,
      youtube,
      phones,
      logo,
      heroBackground,
      settings,
    } = body

    // Build update data - only include fields that are present
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (nameEn !== undefined) updateData.nameEn = nameEn
    if (countryId !== undefined) updateData.countryId = parseInt(countryId)
    if (currency !== undefined) updateData.currency = currency
    if (timezone !== undefined) updateData.timezone = timezone
    if (domain !== undefined) updateData.domain = domain
    if (customDomain !== undefined) updateData.customDomain = customDomain
    if (status !== undefined) updateData.status = status
    if (primaryLanguage !== undefined) updateData.primaryLanguage = primaryLanguage
    if (languages !== undefined) updateData.languages = languages
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone
    if (description !== undefined) updateData.description = description
    if (siteTitle !== undefined) updateData.siteTitle = siteTitle
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription
    if (aboutText !== undefined) updateData.aboutText = aboutText
    if (address !== undefined) updateData.address = address
    if (workingHours !== undefined) updateData.workingHours = workingHours
    if (instagram !== undefined) updateData.instagram = instagram
    if (facebook !== undefined) updateData.facebook = facebook
    if (youtube !== undefined) updateData.youtube = youtube
    if (phones !== undefined) updateData.phones = phones
    if (logo !== undefined) updateData.logo = logo
    if (heroBackground !== undefined) updateData.heroBackground = heroBackground
    if (settings !== undefined) updateData.settings = settings

    const federation = await prisma.federation.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        country: { select: { id: true, code: true, nameRu: true, nameEn: true } },
      },
    })

    return NextResponse.json(federation)
  } catch (error) {
    console.error('Failed to update federation:', error)
    return NextResponse.json(
      { error: 'Failed to update federation' },
      { status: 500 }
    )
  }
}

// DELETE /api/superadmin/federations/[id] - Delete federation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if federation has any data
    const federation = await prisma.federation.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            sportsmen: true,
            clubs: true,
            competitions: true,
          },
        },
      },
    })

    if (!federation) {
      return NextResponse.json({ error: 'Federation not found' }, { status: 404 })
    }

    const totalData =
      federation._count.sportsmen +
      federation._count.clubs +
      federation._count.competitions

    if (totalData > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete federation with existing data. Please delete all sportsmen, clubs, and competitions first.',
        },
        { status: 400 }
      )
    }

    await prisma.federation.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete federation:', error)
    return NextResponse.json(
      { error: 'Failed to delete federation' },
      { status: 500 }
    )
  }
}
