import prisma from '@/lib/prisma'
import type { CompetitionLevel } from '@prisma/client'

export interface RatingPoints {
  gold: number
  silver: number
  bronze: number
}

export interface CompetitionLevelPoints {
  CLUB: RatingPoints
  REGIONAL: RatingPoints
  NATIONAL: RatingPoints
  INTERNATIONAL: RatingPoints
}

// Default rating points by competition level and place
const DEFAULT_POINTS: CompetitionLevelPoints = {
  CLUB: { gold: 10, silver: 7, bronze: 5 },
  REGIONAL: { gold: 25, silver: 18, bronze: 12 },
  NATIONAL: { gold: 50, silver: 35, bronze: 25 },
  INTERNATIONAL: { gold: 100, silver: 70, bronze: 50 },
}

export class RatingService {
  /**
   * Get rating configuration for federation
   */
  async getRatingConfig(federationId: number): Promise<CompetitionLevelPoints> {
    const federation = await prisma.federation.findUnique({
      where: { id: federationId },
      select: { settings: true },
    })

    const settings = federation?.settings as Record<string, unknown> | null
    const ratingConfig = settings?.ratingPoints as CompetitionLevelPoints | undefined

    return ratingConfig || DEFAULT_POINTS
  }

  /**
   * Calculate points for a result
   */
  calculatePoints(
    level: keyof CompetitionLevelPoints,
    place: 'gold' | 'silver' | 'bronze',
    config: CompetitionLevelPoints = DEFAULT_POINTS
  ): number {
    return config[level]?.[place] || 0
  }

  /**
   * Update sportsman rating based on stored medal counts
   * Note: Medal counts should be updated when competition results are finalized
   */
  async updateSportsmanRating(sportsmanId: number) {
    const sportsman = await prisma.sportsman.findUnique({
      where: { id: sportsmanId },
      select: {
        federationId: true,
        goldMedals: true,
        silverMedals: true,
        bronzeMedals: true,
      },
    })

    if (!sportsman) return 0

    const config = sportsman.federationId
      ? await this.getRatingConfig(sportsman.federationId)
      : DEFAULT_POINTS

    // Calculate rating from medal counts
    // Using NATIONAL level as default for stored medals
    const totalRating =
      (sportsman.goldMedals || 0) * config.NATIONAL.gold +
      (sportsman.silverMedals || 0) * config.NATIONAL.silver +
      (sportsman.bronzeMedals || 0) * config.NATIONAL.bronze

    await prisma.sportsman.update({
      where: { id: sportsmanId },
      data: { rating: totalRating },
    })

    return totalRating
  }

  /**
   * Update all sportsmen ratings for a federation
   */
  async updateFederationRatings(federationId: number) {
    const sportsmen = await prisma.sportsman.findMany({
      where: { federationId },
      select: { id: true },
    })

    const results = await Promise.all(
      sportsmen.map(s => this.updateSportsmanRating(s.id))
    )

    return {
      updated: sportsmen.length,
      totalRating: results.reduce((a, b) => a + b, 0),
    }
  }

  /**
   * Update club rating based on sportsmen
   */
  async updateClubRating(clubId: number) {
    const sportsmen = await prisma.sportsman.findMany({
      where: { clubId },
      select: { rating: true },
    })

    const totalRating = sportsmen.reduce((acc, s) => acc + (s.rating || 0), 0)

    await prisma.club.update({
      where: { id: clubId },
      data: { rating: totalRating },
    })

    return totalRating
  }

  /**
   * Get rating leaderboard
   */
  async getLeaderboard(
    federationId?: number,
    options?: {
      gender?: string
      limit?: number
      offset?: number
    }
  ) {
    const where: Record<string, unknown> = {
      rating: { gt: 0 },
    }

    if (federationId) {
      where.federationId = federationId
    }

    if (options?.gender) {
      where.sex = options.gender === 'MALE' ? 0 : 1
    }

    const sportsmen = await prisma.sportsman.findMany({
      where,
      include: {
        federation: { select: { code: true, name: true } },
        country: { select: { nameRu: true, nameEn: true, flagEmoji: true } },
        club: { select: { id: true, title: true } },
      },
      orderBy: { rating: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    })

    return sportsmen.map((s, index) => ({
      rank: (options?.offset || 0) + index + 1,
      sportsman: s,
    }))
  }

  /**
   * Get club leaderboard
   */
  async getClubLeaderboard(federationId?: number, limit = 50) {
    const where: Record<string, unknown> = {
      rating: { gt: 0 },
    }

    if (federationId) {
      where.federationId = federationId
    }

    return prisma.club.findMany({
      where,
      include: {
        federation: { select: { code: true, name: true } },
        city: { select: { nameRu: true, nameEn: true } },
        _count: { select: { sportsmen: true } },
      },
      orderBy: { rating: 'desc' },
      take: limit,
    })
  }

  /**
   * Process competition results and update ratings
   * Call this after a competition is marked as COMPLETED
   */
  async processCompetitionResults(competitionId: number) {
    // Get competition with brackets and matches
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        level: true,
        federationId: true,
        categories: {
          include: {
            bracket: {
              include: {
                matches: {
                  where: {
                    status: 'COMPLETED',
                  },
                  include: {
                    winner: {
                      include: {
                        sportsman: { select: { id: true, clubId: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!competition) return { sportsmenUpdated: 0, clubsUpdated: 0 }

    const config = competition.federationId
      ? await this.getRatingConfig(competition.federationId)
      : DEFAULT_POINTS

    const level = competition.level as keyof CompetitionLevelPoints
    const sportsmenToUpdate = new Set<number>()
    const clubsToUpdate = new Set<number>()

    // Process each category's bracket to find winners
    for (const category of competition.categories) {
      if (!category.bracket) continue

      // Find final match and semi-final matches
      const matches = category.bracket.matches
      if (matches.length === 0) continue

      // Get max round number (final)
      const maxRound = Math.max(...matches.map(m => m.roundNumber))

      // Final match - gold and silver
      const finalMatch = matches.find(m => m.roundNumber === maxRound)
      if (finalMatch?.winner) {
        const winnerId = finalMatch.winner.sportsman?.id
        if (winnerId) {
          // Update gold medal count
          await prisma.sportsman.update({
            where: { id: winnerId },
            data: { goldMedals: { increment: 1 } },
          })
          sportsmenToUpdate.add(winnerId)
          if (finalMatch.winner.sportsman?.clubId) {
            clubsToUpdate.add(finalMatch.winner.sportsman.clubId)
          }
        }
      }

      // Semi-final matches - bronze for losers
      const semiFinals = matches.filter(m => m.roundNumber === maxRound - 1)
      for (const match of semiFinals) {
        // Find the loser (participant who is not the winner)
        const loserId = match.participant1Id === match.winnerId
          ? match.participant2Id
          : match.participant1Id

        if (loserId) {
          const registration = await prisma.competitionRegistration.findUnique({
            where: { id: loserId },
            include: { sportsman: { select: { id: true, clubId: true } } },
          })

          if (registration?.sportsman) {
            await prisma.sportsman.update({
              where: { id: registration.sportsman.id },
              data: { bronzeMedals: { increment: 1 } },
            })
            sportsmenToUpdate.add(registration.sportsman.id)
            if (registration.sportsman.clubId) {
              clubsToUpdate.add(registration.sportsman.clubId)
            }
          }
        }
      }
    }

    // Update ratings for all affected sportsmen
    await Promise.all(
      Array.from(sportsmenToUpdate).map(id => this.updateSportsmanRating(id))
    )

    // Update club ratings
    await Promise.all(
      Array.from(clubsToUpdate).map(id => this.updateClubRating(id))
    )

    return {
      sportsmenUpdated: sportsmenToUpdate.size,
      clubsUpdated: clubsToUpdate.size,
    }
  }
}

export const ratingService = new RatingService()
