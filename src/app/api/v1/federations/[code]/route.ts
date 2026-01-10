import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'

// GET /api/v1/federations/:code - Get federation by code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const { searchParams } = new URL(request.url)
    const locale = (searchParams.get('locale') || 'ru') as Locale

    const federation = await prisma.federation.findFirst({
      where: {
        OR: [
          { code: code.toLowerCase() },
          { id: isNaN(parseInt(code)) ? -1 : parseInt(code) },
        ],
        deletedAt: null,
      },
      include: {
        country: {
          select: {
            id: true,
            code: true,
            nameRu: true,
            nameEn: true,
            flagEmoji: true,
            phoneCode: true,
          },
        },
        _count: {
          select: {
            sportsmen: true,
            clubs: true,
            trainers: true,
            competitions: true,
            news: { where: { published: true } },
          },
        },
      },
    })

    if (!federation) {
      return NextResponse.json(
        { success: false, error: 'Federation not found' },
        { status: 404 }
      )
    }

    // Get upcoming competitions
    const upcomingCompetitions = await prisma.competition.findMany({
      where: {
        federationId: federation.id,
        startDate: { gte: new Date() },
        status: { not: 'DRAFT' },
        deletedAt: null,
      },
      orderBy: { startDate: 'asc' },
      take: 5,
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        status: true,
        level: true,
      },
    })

    // Get latest news
    const latestNews = await prisma.news.findMany({
      where: {
        federationId: federation.id,
        published: true,
      },
      orderBy: { date: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        announce: true,
        photo: true,
        date: true,
      },
    })

    // Get partners
    const partners = await prisma.partner.findMany({
      where: {
        federationId: federation.id,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        logo: true,
        url: true,
      },
    })

    // Transform
    const data = {
      id: federation.id,
      code: federation.code,
      name: federation.name,
      nameEn: federation.nameEn,
      fullName: getTranslation(federation.fullName as Record<string, string>, locale),
      domain: federation.domain,
      customDomain: federation.customDomain,
      logo: federation.logo,
      heroBackground: federation.heroBackground,
      description: getTranslation(federation.description as Record<string, string>, locale),
      siteTitle: getTranslation(federation.siteTitle as Record<string, string>, locale),
      metaDescription: getTranslation(federation.metaDescription as Record<string, string>, locale),
      aboutText: getTranslation(federation.aboutText as Record<string, string>, locale),
      address: getTranslation(federation.address as Record<string, string>, locale),
      workingHours: federation.workingHours,
      status: federation.status,
      timezone: federation.timezone,
      currency: federation.currency,
      languages: federation.languages,
      primaryLanguage: federation.primaryLanguage,
      contactEmail: federation.contactEmail,
      contactPhone: federation.contactPhone,
      phones: federation.phones,
      instagram: federation.instagram,
      facebook: federation.facebook,
      youtube: federation.youtube,
      foundedDate: federation.foundedDate,
      settings: federation.settings,
      country: federation.country,
      stats: {
        sportsmenCount: federation._count.sportsmen,
        clubsCount: federation._count.clubs,
        trainersCount: federation._count.trainers,
        competitionsCount: federation._count.competitions,
        newsCount: federation._count.news,
      },
      upcomingCompetitions: upcomingCompetitions.map((comp: typeof upcomingCompetitions[number]) => ({
        ...comp,
        title: getTranslation(comp.title as Record<string, string>, locale),
      })),
      latestNews: latestNews.map((news: typeof latestNews[number]) => ({
        ...news,
        title: getTranslation(news.title as Record<string, string>, locale),
        announce: getTranslation(news.announce as Record<string, string>, locale),
      })),
      partners,
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get federation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch federation' },
      { status: 500 }
    )
  }
}
