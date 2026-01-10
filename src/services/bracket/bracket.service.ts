import prisma from '@/lib/prisma'
import type { CompetitionMatch } from '@prisma/client'

/**
 * Bracket Service
 *
 * Note: This service needs to be refactored to work with the actual schema:
 * - CompetitionBracket (not Bracket)
 * - CompetitionMatch (not BracketMatch)
 * - CompetitionRegistration as participants (not BracketParticipant)
 */

export interface BracketParticipant {
  registrationId: number
  seed?: number
}

export interface MatchResult {
  winnerId: number
  score1?: number
  score2?: number
}

export class BracketService {
  /**
   * Generate bracket for a competition category
   */
  async generateBracket(
    categoryId: number,
    registrationIds: number[]
  ) {
    // Check if bracket already exists
    const existing = await prisma.competitionBracket.findUnique({
      where: { competitionCategoryId: categoryId },
    })

    if (existing) {
      throw new Error('Bracket already exists for this category')
    }

    // Determine bracket size (nearest power of 2)
    const participantCount = registrationIds.length
    const bracketSize = this.nearestPowerOf2(participantCount)
    const rounds = Math.log2(bracketSize)

    // Create bracket
    const bracket = await prisma.competitionBracket.create({
      data: {
        competitionCategoryId: categoryId,
        bracketType: 'single_elimination',
        bracketSize,
        status: 'pending',
        generatedAt: new Date(),
      },
    })

    // Generate first round matches
    const matches = await this.generateFirstRoundMatches(
      bracket.id,
      registrationIds,
      bracketSize
    )

    return {
      bracket,
      matches,
      stats: {
        participants: participantCount,
        bracketSize,
        rounds,
        byes: bracketSize - participantCount,
      },
    }
  }

  /**
   * Get bracket with all data
   */
  async getBracket(bracketId: number) {
    return prisma.competitionBracket.findUnique({
      where: { id: bracketId },
      include: {
        category: {
          include: {
            competition: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
            discipline: true,
            ageCategory: true,
            weightCategory: true,
          },
        },
        matches: {
          include: {
            participant1: {
              include: {
                sportsman: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    club: { select: { title: true } },
                  },
                },
              },
            },
            participant2: {
              include: {
                sportsman: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    club: { select: { title: true } },
                  },
                },
              },
            },
            winner: {
              include: {
                sportsman: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: [{ roundNumber: 'asc' }, { matchNumber: 'asc' }],
        },
      },
    })
  }

  /**
   * Record match result
   */
  async recordMatchResult(matchId: number, result: MatchResult) {
    const match = await prisma.competitionMatch.findUnique({
      where: { id: matchId },
      include: {
        bracket: true,
        participant1: true,
        participant2: true,
      },
    })

    if (!match) {
      throw new Error('Match not found')
    }

    if (match.status === 'COMPLETED') {
      throw new Error('Match already completed')
    }

    // Update match
    const updatedMatch = await prisma.competitionMatch.update({
      where: { id: matchId },
      data: {
        winnerId: result.winnerId,
        score1: result.score1,
        score2: result.score2,
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    })

    // Advance winner to next round
    await this.advanceWinner(match.bracketId, match.roundNumber, match.matchNumber, result.winnerId)

    // Check if bracket is complete
    await this.checkBracketCompletion(match.bracketId)

    return updatedMatch
  }

  /**
   * Advance winner to next round
   */
  private async advanceWinner(
    bracketId: number,
    currentRound: number,
    matchNumber: number,
    winnerId: number
  ) {
    const bracket = await prisma.competitionBracket.findUnique({
      where: { id: bracketId },
      select: { bracketSize: true },
    })

    if (!bracket) return

    const totalRounds = Math.log2(bracket.bracketSize)
    if (currentRound >= totalRounds) {
      return // Final match
    }

    const nextRound = currentRound + 1
    const nextMatchNumber = Math.ceil(matchNumber / 2)

    // Find or create next round match
    let nextMatch = await prisma.competitionMatch.findFirst({
      where: {
        bracketId,
        roundNumber: nextRound,
        matchNumber: nextMatchNumber,
      },
    })

    if (!nextMatch) {
      nextMatch = await prisma.competitionMatch.create({
        data: {
          bracketId,
          roundNumber: nextRound,
          matchNumber: nextMatchNumber,
          status: 'SCHEDULED',
        },
      })
    }

    // Determine which position (1 or 2) the winner goes to
    const position = matchNumber % 2 === 1 ? 'participant1Id' : 'participant2Id'

    await prisma.competitionMatch.update({
      where: { id: nextMatch.id },
      data: { [position]: winnerId },
    })

    // Check if next match has both participants
    const updatedNextMatch = await prisma.competitionMatch.findUnique({
      where: { id: nextMatch.id },
      select: { participant1Id: true, participant2Id: true },
    })

    if (updatedNextMatch?.participant1Id && updatedNextMatch?.participant2Id) {
      await prisma.competitionMatch.update({
        where: { id: nextMatch.id },
        data: { status: 'SCHEDULED' },
      })
    }
  }

  /**
   * Check if bracket is complete
   */
  private async checkBracketCompletion(bracketId: number) {
    const bracket = await prisma.competitionBracket.findUnique({
      where: { id: bracketId },
      select: { bracketSize: true },
    })

    if (!bracket) return

    const totalRounds = Math.log2(bracket.bracketSize)

    // Check if final match is complete
    const finalMatch = await prisma.competitionMatch.findFirst({
      where: {
        bracketId,
        roundNumber: totalRounds,
        status: 'COMPLETED',
      },
    })

    if (finalMatch?.winnerId) {
      // Mark bracket as complete
      await prisma.competitionBracket.update({
        where: { id: bracketId },
        data: { status: 'completed' },
      })
    }
  }

  /**
   * Generate first round matches
   */
  private async generateFirstRoundMatches(
    bracketId: number,
    registrationIds: number[],
    bracketSize: number
  ) {
    const matchCount = bracketSize / 2
    const matches: CompetitionMatch[] = []

    for (let i = 0; i < matchCount; i++) {
      const p1Index = i
      const p2Index = bracketSize - 1 - i

      const participant1Id = registrationIds[p1Index] || null
      const participant2Id = p2Index < registrationIds.length ? registrationIds[p2Index] : null

      const isBye = !participant1Id || !participant2Id
      const status = isBye ? 'COMPLETED' : 'SCHEDULED'
      const winnerId = isBye ? (participant1Id || participant2Id) : null

      const match = await prisma.competitionMatch.create({
        data: {
          bracketId,
          roundNumber: 1,
          matchNumber: i + 1,
          position: i,
          participant1Id,
          participant2Id,
          winnerId,
          status,
          endedAt: isBye ? new Date() : null,
        },
      })

      matches.push(match)

      // Auto-advance bye winners
      if (isBye && winnerId) {
        await this.advanceWinner(bracketId, 1, i + 1, winnerId)
      }
    }

    return matches
  }

  /**
   * Find nearest power of 2
   */
  private nearestPowerOf2(n: number): number {
    let power = 1
    while (power < n) {
      power *= 2
    }
    return power
  }

  /**
   * Get brackets for competition
   */
  async getCompetitionBrackets(competitionId: number) {
    return prisma.competitionBracket.findMany({
      where: {
        category: { competitionId },
      },
      include: {
        category: {
          include: {
            discipline: true,
            ageCategory: true,
            weightCategory: true,
          },
        },
        _count: {
          select: {
            matches: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Delete bracket
   */
  async deleteBracket(bracketId: number) {
    // Delete matches first
    await prisma.competitionMatch.deleteMany({ where: { bracketId } })
    return prisma.competitionBracket.delete({ where: { id: bracketId } })
  }

  /**
   * Reset bracket
   */
  async resetBracket(bracketId: number) {
    // Reset all matches
    await prisma.competitionMatch.updateMany({
      where: { bracketId },
      data: {
        winnerId: null,
        score1: null,
        score2: null,
        status: 'SCHEDULED',
        endedAt: null,
      },
    })

    // Reset bracket status
    return prisma.competitionBracket.update({
      where: { id: bracketId },
      data: { status: 'pending' },
    })
  }
}

export const bracketService = new BracketService()
