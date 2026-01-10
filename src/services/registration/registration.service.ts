import prisma from '@/lib/prisma'
import { Prisma, RegistrationStatus } from '@prisma/client'

export interface CreateRegistrationInput {
  competitionId: number
  competitionCategoryId: number
  sportsmanId?: number
  teamId?: number
  registeredById?: number
  notes?: string
}

export interface RegistrationFilters {
  competitionId?: number
  competitionCategoryId?: number
  sportsmanId?: number
  status?: RegistrationStatus
  clubId?: number
}

export class RegistrationService {
  /**
   * Get registration by ID
   */
  async getById(id: number) {
    return prisma.competitionRegistration.findUnique({
      where: { id },
      include: {
        competition: {
          select: {
            id: true,
            title: true,
            startDate: true,
            status: true,
            federation: { select: { code: true, name: true } },
          },
        },
        sportsman: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            sex: true,
            weight: true,
            club: { select: { id: true, title: true } },
          },
        },
        competitionCategory: {
          include: {
            discipline: true,
            ageCategory: true,
            weightCategory: true,
          },
        },
      },
    })
  }

  /**
   * List registrations
   */
  async list(filters: RegistrationFilters, page = 1, limit = 50) {
    const where: Prisma.CompetitionRegistrationWhereInput = {}

    if (filters.competitionId) {
      where.competitionId = filters.competitionId
    }

    if (filters.competitionCategoryId) {
      where.competitionCategoryId = filters.competitionCategoryId
    }

    if (filters.sportsmanId) {
      where.sportsmanId = filters.sportsmanId
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.clubId) {
      where.sportsman = { clubId: filters.clubId }
    }

    const [registrations, total] = await Promise.all([
      prisma.competitionRegistration.findMany({
        where,
        include: {
          sportsman: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              sex: true,
              weight: true,
              club: { select: { id: true, title: true } },
            },
          },
          competitionCategory: {
            include: {
              discipline: true,
              ageCategory: true,
              weightCategory: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.competitionRegistration.count({ where }),
    ])

    return {
      data: registrations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Create registration
   */
  async create(input: CreateRegistrationInput) {
    // Check if sportsman already registered for this category
    if (input.sportsmanId) {
      const existing = await prisma.competitionRegistration.findFirst({
        where: {
          competitionCategoryId: input.competitionCategoryId,
          sportsmanId: input.sportsmanId,
          status: { not: 'WITHDRAWN' },
        },
      })

      if (existing) {
        throw new Error('Sportsman already registered for this category')
      }
    }

    // Check competition status
    const category = await prisma.competitionCategory.findUnique({
      where: { id: input.competitionCategoryId },
      include: {
        competition: {
          select: { status: true },
        },
      },
    })

    if (!category) {
      throw new Error('Category not found')
    }

    if (category.competition.status !== 'REGISTRATION_OPEN') {
      throw new Error('Registration is not open for this competition')
    }

    // Create registration
    return prisma.competitionRegistration.create({
      data: {
        competitionId: category.competitionId,
        competitionCategoryId: input.competitionCategoryId,
        sportsmanId: input.sportsmanId,
        teamId: input.teamId,
        registeredById: input.registeredById,
        registeredAt: new Date(),
        status: 'PENDING',
        notes: input.notes,
      },
      include: {
        sportsman: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            club: { select: { title: true } },
          },
        },
        competitionCategory: {
          include: {
            discipline: true,
            ageCategory: true,
            weightCategory: true,
          },
        },
      },
    })
  }

  /**
   * Update registration status
   */
  async updateStatus(id: number, status: RegistrationStatus, approvedById?: number, rejectionReason?: string) {
    const updateData: Prisma.CompetitionRegistrationUpdateInput = { status }

    if (status === 'APPROVED') {
      updateData.approvedAt = new Date()
      if (approvedById) {
        updateData.approvedBy = { connect: { id: approvedById } }
      }
    }

    if (status === 'REJECTED' && rejectionReason) {
      updateData.rejectionReason = rejectionReason
    }

    return prisma.competitionRegistration.update({
      where: { id },
      data: updateData,
      include: {
        sportsman: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  }

  /**
   * Bulk approve registrations
   */
  async bulkApprove(ids: number[], approvedById?: number) {
    return prisma.competitionRegistration.updateMany({
      where: {
        id: { in: ids },
        status: 'PENDING',
      },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById,
      },
    })
  }

  /**
   * Bulk reject registrations
   */
  async bulkReject(ids: number[], reason?: string) {
    return prisma.competitionRegistration.updateMany({
      where: {
        id: { in: ids },
        status: 'PENDING',
      },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    })
  }

  /**
   * Update registration weight (weigh-in)
   */
  async weighIn(id: number, weight: number) {
    return prisma.competitionRegistration.update({
      where: { id },
      data: {
        confirmedWeight: weight,
        isWeighedIn: true,
        weighedInAt: new Date(),
      },
    })
  }

  /**
   * Withdraw registration
   */
  async withdraw(id: number) {
    return prisma.competitionRegistration.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
    })
  }

  /**
   * Get registration stats for competition
   */
  async getCompetitionStats(competitionId: number) {
    const [byStatus, byCategory, byClub] = await Promise.all([
      prisma.competitionRegistration.groupBy({
        by: ['status'],
        where: { competitionId },
        _count: true,
      }),
      prisma.competitionRegistration.groupBy({
        by: ['competitionCategoryId'],
        where: {
          competitionId,
          status: 'APPROVED',
        },
        _count: true,
      }),
      prisma.competitionRegistration.findMany({
        where: { competitionId, status: 'APPROVED' },
        select: {
          sportsman: {
            select: {
              clubId: true,
              club: { select: { title: true } },
            },
          },
        },
      }),
    ])

    // Group by club
    const clubCounts = byClub.reduce((acc, r) => {
      const clubId = r.sportsman?.clubId
      if (clubId) {
        if (!acc[clubId]) {
          acc[clubId] = { count: 0, title: r.sportsman?.club?.title }
        }
        acc[clubId].count++
      }
      return acc
    }, {} as Record<number, { count: number; title: unknown }>)

    return {
      byStatus: byStatus.reduce((acc, r) => {
        acc[r.status] = r._count
        return acc
      }, {} as Record<string, number>),
      byCategory: byCategory.map(c => ({
        categoryId: c.competitionCategoryId,
        count: c._count,
      })),
      byClub: Object.entries(clubCounts).map(([id, data]) => ({
        clubId: parseInt(id),
        title: data.title,
        count: data.count,
      })).sort((a, b) => b.count - a.count),
    }
  }

  /**
   * Check if sportsman can register
   */
  async canRegister(competitionCategoryId: number, sportsmanId: number) {
    const [category, sportsman, existing] = await Promise.all([
      prisma.competitionCategory.findUnique({
        where: { id: competitionCategoryId },
        include: {
          competition: {
            select: {
              status: true,
              registrationDeadline: true,
            },
          },
        },
      }),
      prisma.sportsman.findUnique({
        where: { id: sportsmanId },
        select: { id: true, federationId: true },
      }),
      prisma.competitionRegistration.findFirst({
        where: {
          competitionCategoryId,
          sportsmanId,
          status: { not: 'WITHDRAWN' },
        },
      }),
    ])

    const errors: string[] = []

    if (!category) {
      errors.push('Category not found')
      return { canRegister: false, errors }
    }

    if (!sportsman) {
      errors.push('Sportsman not found')
      return { canRegister: false, errors }
    }

    if (existing) {
      errors.push('Already registered')
    }

    if (category.competition.status !== 'REGISTRATION_OPEN') {
      errors.push('Registration is not open')
    }

    if (category.competition.registrationDeadline && new Date() > category.competition.registrationDeadline) {
      errors.push('Registration deadline has passed')
    }

    return {
      canRegister: errors.length === 0,
      errors,
    }
  }
}

export const registrationService = new RegistrationService()
