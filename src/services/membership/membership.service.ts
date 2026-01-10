import prisma from '@/lib/prisma'
import { MembershipStatus, Prisma } from '@prisma/client'

/**
 * Membership service for managing sportsman memberships
 */

export interface CreateMembershipInput {
  sportsmanId: number
  federationId: number
  validFrom?: Date
  validUntil?: Date
  amount?: number
  notes?: string
}

export interface MembershipStats {
  total: number
  active: number
  pending: number
  expired: number
  expiringWithin30Days: number
}

export class MembershipService {
  /**
   * Create membership for sportsman
   */
  async createMembership(input: CreateMembershipInput) {
    const { sportsmanId, federationId, validFrom, amount, notes } = input

    // Get federation settings
    const federation = await prisma.federation.findUnique({
      where: { id: federationId },
      select: { id: true, code: true, currency: true, settings: true },
    })

    if (!federation) {
      throw new Error('Federation not found')
    }

    const settings = (federation.settings as Record<string, unknown>) || {}
    const membershipSettings = (settings.membership as Record<string, unknown>) || {}

    // Calculate validity period
    const from = validFrom || new Date()
    const until = input.validUntil || this.calculateValidUntil(from, membershipSettings.period as string || 'annual')

    // Calculate amount
    const membershipAmount = amount ?? (membershipSettings.amount as number) ?? 0

    // Generate membership number
    const sportsman = await prisma.sportsman.findUnique({
      where: { id: sportsmanId },
    })

    if (!sportsman) {
      throw new Error('Sportsman not found')
    }

    const membershipNumber = this.generateMembershipNumber(federation.code, sportsmanId)

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        federationId,
        sportsmanId,
        membershipNumber,
        validFrom: from,
        validUntil: until,
        amount: new Prisma.Decimal(membershipAmount),
        status: 'PENDING',
        notes,
      },
    })

    // Update sportsman with membership reference
    await prisma.sportsman.update({
      where: { id: sportsmanId },
      data: { membershipId: membership.id },
    })

    return membership
  }

  /**
   * Renew membership
   */
  async renewMembership(membershipId: number) {
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        federation: { select: { id: true, code: true, settings: true } },
        sportsmen: true,
      },
    })

    if (!membership) {
      throw new Error('Membership not found')
    }

    const settings = (membership.federation.settings as Record<string, unknown>) || {}
    const membershipSettings = (settings.membership as Record<string, unknown>) || {}

    // New period starts after current one ends
    const validFrom = new Date(membership.validUntil)
    validFrom.setDate(validFrom.getDate() + 1)
    const validUntil = this.calculateValidUntil(validFrom, membershipSettings.period as string || 'annual')

    // Create new membership
    const newMembership = await prisma.membership.create({
      data: {
        federationId: membership.federationId,
        sportsmanId: membership.sportsmanId,
        membershipNumber: membership.membershipNumber,
        validFrom,
        validUntil,
        amount: new Prisma.Decimal((membershipSettings.amount as number) ?? 0),
        status: 'PENDING',
        notes: 'Продление членства',
      },
    })

    // Update sportsman with new membership
    if (membership.sportsmen.length > 0) {
      await prisma.sportsman.update({
        where: { id: membership.sportsmen[0].id },
        data: { membershipId: newMembership.id },
      })
    }

    // Mark old membership as expired
    await prisma.membership.update({
      where: { id: membershipId },
      data: { status: 'EXPIRED' },
    })

    return newMembership
  }

  /**
   * Activate membership (after payment)
   */
  async activateMembership(membershipId: number) {
    return prisma.membership.update({
      where: { id: membershipId },
      data: { status: 'ACTIVE' },
    })
  }

  /**
   * Cancel membership
   */
  async cancelMembership(membershipId: number, reason?: string) {
    return prisma.membership.update({
      where: { id: membershipId },
      data: {
        status: 'CANCELLED',
        notes: reason,
      },
    })
  }

  /**
   * Get membership by ID
   */
  async getById(id: number) {
    return prisma.membership.findUnique({
      where: { id },
      include: {
        federation: { select: { id: true, code: true, name: true } },
        sportsmen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  /**
   * Get active membership for sportsman
   */
  async getActiveMembershipForSportsman(sportsmanId: number) {
    return prisma.membership.findFirst({
      where: {
        sportsmanId,
        status: 'ACTIVE',
        validUntil: { gte: new Date() },
      },
      include: {
        federation: { select: { id: true, code: true, name: true } },
      },
    })
  }

  /**
   * Check if sportsman has active membership
   */
  async hasActiveMembership(sportsmanId: number): Promise<boolean> {
    const membership = await this.getActiveMembershipForSportsman(sportsmanId)
    return membership !== null
  }

  /**
   * Get expiring memberships (for sending reminders)
   */
  async getExpiringMemberships(daysBeforeExpiry = 7) {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + daysBeforeExpiry)

    return prisma.membership.findMany({
      where: {
        status: 'ACTIVE',
        validUntil: {
          lte: targetDate,
          gte: new Date(),
        },
      },
      include: {
        federation: { select: { id: true, code: true, name: true } },
        sportsmen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            telegramChatId: true,
          },
        },
      },
    })
  }

  /**
   * Update expired memberships status
   */
  async updateExpiredMemberships(): Promise<number> {
    const result = await prisma.membership.updateMany({
      where: {
        status: 'ACTIVE',
        validUntil: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    })

    return result.count
  }

  /**
   * Get membership statistics for federation
   */
  async getStatistics(federationId: number): Promise<MembershipStats> {
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const [total, active, pending, expired, expiringWithin30Days] = await Promise.all([
      prisma.membership.count({
        where: { federationId },
      }),
      prisma.membership.count({
        where: { federationId, status: 'ACTIVE' },
      }),
      prisma.membership.count({
        where: { federationId, status: 'PENDING' },
      }),
      prisma.membership.count({
        where: { federationId, status: 'EXPIRED' },
      }),
      prisma.membership.count({
        where: {
          federationId,
          status: 'ACTIVE',
          validUntil: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      }),
    ])

    return {
      total,
      active,
      pending,
      expired,
      expiringWithin30Days,
    }
  }

  /**
   * List memberships for federation
   */
  async listByFederation(
    federationId: number,
    filters: { status?: MembershipStatus; search?: string } = {},
    page = 1,
    limit = 20
  ) {
    const where: Prisma.MembershipWhereInput = { federationId }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.search) {
      where.OR = [
        { membershipNumber: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [memberships, total] = await Promise.all([
      prisma.membership.findMany({
        where,
        include: {
          sportsmen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photo: true,
            },
          },
          _count: {
            select: { payments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.membership.count({ where }),
    ])

    return {
      data: memberships,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Calculate valid until date based on period
   */
  private calculateValidUntil(from: Date, period: string): Date {
    const date = new Date(from)

    switch (period) {
      case 'annual':
        date.setFullYear(date.getFullYear() + 1)
        break
      case 'biannual':
        date.setMonth(date.getMonth() + 6)
        break
      case 'monthly':
        date.setMonth(date.getMonth() + 1)
        break
      default:
        date.setFullYear(date.getFullYear() + 1)
    }

    return date
  }

  /**
   * Generate membership number
   */
  private generateMembershipNumber(federationCode: string, sportsmanId: number): string {
    const year = new Date().getFullYear()
    const code = federationCode.toUpperCase()
    const id = sportsmanId.toString().padStart(5, '0')

    return `${code}-${year}-${id}`
  }
}

export const membershipService = new MembershipService()