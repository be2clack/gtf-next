import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'

type RouteParams = { params: Promise<{ categoryId: string }> }

// GET /api/v1/brackets/:categoryId - Get bracket for category
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { categoryId } = await params
    const { searchParams } = new URL(request.url)
    const locale = (searchParams.get('locale') || 'ru') as Locale

    // Get category with bracket
    const category = await prisma.competitionCategory.findUnique({
      where: { id: parseInt(categoryId) },
      include: {
        competition: {
          select: { id: true, title: true, status: true }
        },
        discipline: {
          select: { id: true, name: true, nameRu: true, nameEn: true, type: true }
        },
        ageCategory: {
          select: { id: true, code: true, nameRu: true, nameEn: true }
        },
        weightCategory: {
          select: { id: true, code: true, name: true, minWeight: true, maxWeight: true }
        },
        bracket: true,
        registrations: {
          where: { status: 'APPROVED' },
          select: {
            id: true,
            currentWeight: true,
            confirmedWeight: true,
            sportsman: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                photo: true,
                rating: true,
                gyp: true,
                dan: true,
                club: { select: { title: true } },
                country: { select: { nameRu: true, nameEn: true, flagEmoji: true } }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Get matches for this category's bracket
    const matches = category.bracket ? await prisma.competitionMatch.findMany({
      where: { bracketId: category.bracket.id },
      include: {
        participant1: {
          select: {
            id: true,
            sportsman: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                photo: true,
                club: { select: { title: true } },
                country: { select: { flagEmoji: true } }
              }
            }
          }
        },
        participant2: {
          select: {
            id: true,
            sportsman: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                photo: true,
                club: { select: { title: true } },
                country: { select: { flagEmoji: true } }
              }
            }
          }
        },
        winner: {
          select: {
            id: true,
            sportsman: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        },
        scores: {
          orderBy: { timestamp: 'asc' }
        }
      },
      orderBy: [
        { roundNumber: 'asc' },
        { matchNumber: 'asc' }
      ]
    }) : []

    // Transform data
    const participants = category.registrations
      .filter(reg => reg.sportsman)
      .map((reg, index) => ({
        id: reg.id,
        seedNumber: index + 1,
        sportsman: {
          ...reg.sportsman,
          fullName: `${reg.sportsman!.lastName} ${reg.sportsman!.firstName}`,
          clubName: reg.sportsman!.club
            ? getTranslation(reg.sportsman!.club.title as Record<string, string>, locale)
            : null,
          countryName: reg.sportsman!.country
            ? (locale === 'en' ? reg.sportsman!.country.nameEn : reg.sportsman!.country.nameRu)
            : null,
          beltLevel: reg.sportsman!.dan && reg.sportsman!.dan > 0
            ? `${reg.sportsman!.dan} дан`
            : reg.sportsman!.gyp
              ? `${reg.sportsman!.gyp} гып`
              : null
        },
        currentWeight: reg.currentWeight,
        confirmedWeight: reg.confirmedWeight
      }))

    const bracketMatches = matches.map(match => ({
      id: match.id,
      matchNumber: match.matchNumber,
      roundNumber: match.roundNumber,
      round: match.round,
      roundName: getRoundName(match.roundNumber, category.bracket?.bracketSize || participants.length),
      area: match.area,
      scheduledTime: match.scheduledTime,
      startedAt: match.startedAt,
      endedAt: match.endedAt,
      status: match.status,
      participant1: match.participant1 ? {
        id: match.participant1.id,
        sportsman: match.participant1.sportsman ? {
          ...match.participant1.sportsman,
          fullName: `${match.participant1.sportsman.lastName} ${match.participant1.sportsman.firstName}`
        } : null
      } : null,
      participant2: match.participant2 ? {
        id: match.participant2.id,
        sportsman: match.participant2.sportsman ? {
          ...match.participant2.sportsman,
          fullName: `${match.participant2.sportsman.lastName} ${match.participant2.sportsman.firstName}`
        } : null
      } : null,
      winnerId: match.winnerId,
      scores: match.scores.map(s => ({
        participantId: s.participantId,
        points: s.points,
        penaltyCount: s.penaltyCount,
        penaltyType: s.penaltyType,
        timestamp: s.timestamp
      })),
      score1: match.score1,
      score2: match.score2
    }))

    return NextResponse.json({
      success: true,
      data: {
        category: {
          id: category.id,
          name: category.name,
          gender: category.gender,
          competitionTitle: getTranslation(category.competition.title as Record<string, string>, locale),
          competitionStatus: category.competition.status,
          disciplineName: category.discipline
            ? (locale === 'en' ? category.discipline.nameEn : category.discipline.nameRu) || category.discipline.name
            : null,
          ageCategoryName: category.ageCategory
            ? (locale === 'en' ? category.ageCategory.nameEn : category.ageCategory.nameRu)
            : null,
          weightCategoryName: category.weightCategory?.name
        },
        bracket: category.bracket ? {
          id: category.bracket.id,
          type: category.bracket.bracketType,
          size: category.bracket.bracketSize,
          status: category.bracket.status,
          generatedAt: category.bracket.generatedAt
        } : null,
        participants,
        matches: bracketMatches,
        meta: {
          totalParticipants: participants.length,
          totalMatches: matches.length,
          completedMatches: matches.filter(m => m.status === 'COMPLETED').length
        }
      }
    })
  } catch (error) {
    console.error('Get bracket error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bracket' },
      { status: 500 }
    )
  }
}

function getRoundName(roundNumber: number, bracketSize: number): string {
  const totalRounds = Math.ceil(Math.log2(bracketSize))
  const roundFromEnd = totalRounds - roundNumber + 1

  switch (roundFromEnd) {
    case 1: return 'Финал'
    case 2: return 'Полуфинал'
    case 3: return 'Четвертьфинал'
    case 4: return '1/8 финала'
    case 5: return '1/16 финала'
    case 6: return '1/32 финала'
    default: return `Раунд ${roundNumber}`
  }
}
