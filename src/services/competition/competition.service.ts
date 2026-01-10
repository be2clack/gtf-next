import prisma from '@/lib/prisma'
import { Prisma, CompetitionStatus, CompetitionLevel } from '@prisma/client'

export interface CreateCompetitionInput {
  federationId: number
  title: Record<string, string>
  description?: Record<string, string>
  level: CompetitionLevel
  startDate: Date
  endDate?: Date
  registrationDeadline?: Date
  countryId?: number
  regionId?: number
  cityId?: number
  venue?: Record<string, string>
}

export interface UpdateCompetitionInput extends Partial<CreateCompetitionInput> {
  status?: string
}

export interface CompetitionFilters {
  federationId?: number
  status?: CompetitionStatus
  level?: CompetitionLevel
  startDateFrom?: Date
  startDateTo?: Date
  search?: string
}

export class CompetitionService {
  /**
   * Get competition by ID
   */
  async getById(id: number, includeRelations = true) {
    return prisma.competition.findUnique({
      where: { id, deletedAt: null },
      include: includeRelations ? {
        federation: { select: { id: true, code: true, name: true } },
        country: true,
        region: true,
        city: true,
        categories: {
          include: {
            discipline: true,
            ageCategory: true,
            weightCategory: true,
            beltCategory: true,
          },
          orderBy: { id: 'asc' },
        },
        _count: {
          select: {
            registrations: { where: { status: 'APPROVED' } },
          },
        },
      } : undefined,
    })
  }

  /**
   * List competitions with filters
   */
  async list(filters: CompetitionFilters, page = 1, limit = 20) {
    const where: Prisma.CompetitionWhereInput = {
      deletedAt: null,
    }

    if (filters.federationId) {
      where.federationId = filters.federationId
    }

    if (filters.status) {
      where.status = filters.status
    } else {
      where.status = { not: 'DRAFT' }
    }

    if (filters.level) {
      where.level = filters.level
    }

    if (filters.startDateFrom || filters.startDateTo) {
      where.startDate = {}
      if (filters.startDateFrom) {
        where.startDate.gte = filters.startDateFrom
      }
      if (filters.startDateTo) {
        where.startDate.lte = filters.startDateTo
      }
    }

    const [competitions, total] = await Promise.all([
      prisma.competition.findMany({
        where,
        include: {
          federation: { select: { id: true, code: true, name: true } },
          country: { select: { nameRu: true, nameEn: true, flagEmoji: true } },
          city: { select: { nameRu: true, nameEn: true } },
          _count: {
            select: {
              registrations: { where: { status: 'APPROVED' } },
            },
          },
        },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.competition.count({ where }),
    ])

    return {
      data: competitions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Create competition
   */
  async create(input: CreateCompetitionInput) {
    return prisma.competition.create({
      data: {
        federationId: input.federationId,
        title: input.title,
        description: input.description || Prisma.JsonNull,
        level: input.level,
        status: 'DRAFT',
        startDate: input.startDate,
        endDate: input.endDate || input.startDate,
        registrationDeadline: input.registrationDeadline,
        countryId: input.countryId,
        regionId: input.regionId,
        cityId: input.cityId,
        venue: input.venue || Prisma.JsonNull,
      },
      include: {
        federation: { select: { id: true, code: true, name: true } },
      },
    })
  }

  /**
   * Update competition
   */
  async update(id: number, input: UpdateCompetitionInput) {
    const updateData: Prisma.CompetitionUpdateInput = {}

    if (input.title) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description || Prisma.JsonNull
    if (input.level) updateData.level = input.level
    if (input.status) updateData.status = input.status as CompetitionStatus
    if (input.startDate) updateData.startDate = input.startDate
    if (input.endDate) updateData.endDate = input.endDate
    if (input.registrationDeadline !== undefined) updateData.registrationDeadline = input.registrationDeadline
    if (input.venue !== undefined) updateData.venue = input.venue || Prisma.JsonNull
    if (input.countryId !== undefined) updateData.country = input.countryId ? { connect: { id: input.countryId } } : { disconnect: true }
    if (input.regionId !== undefined) updateData.region = input.regionId ? { connect: { id: input.regionId } } : { disconnect: true }
    if (input.cityId !== undefined) updateData.city = input.cityId ? { connect: { id: input.cityId } } : { disconnect: true }

    return prisma.competition.update({
      where: { id },
      data: updateData,
      include: {
        federation: { select: { id: true, code: true, name: true } },
      },
    })
  }

  /**
   * Delete competition (soft delete)
   */
  async delete(id: number) {
    return prisma.competition.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  /**
   * Change competition status
   */
  async changeStatus(id: number, status: CompetitionStatus) {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['ANNOUNCED'],
      ANNOUNCED: ['DRAFT', 'REGISTRATION_OPEN', 'CANCELLED'],
      REGISTRATION_OPEN: ['REGISTRATION_CLOSED', 'CANCELLED'],
      REGISTRATION_CLOSED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    }

    const competition = await prisma.competition.findUnique({
      where: { id },
      select: { status: true },
    })

    if (!competition) {
      throw new Error('Competition not found')
    }

    if (!validTransitions[competition.status]?.includes(status)) {
      throw new Error(`Cannot transition from ${competition.status} to ${status}`)
    }

    return prisma.competition.update({
      where: { id },
      data: { status },
    })
  }

  /**
   * Add category to competition
   */
  async addCategory(
    competitionId: number,
    input: {
      disciplineId?: number
      ageCategoryId?: number
      weightCategoryId?: number
      beltCategoryId?: number
      gender?: 'MALE' | 'FEMALE' | 'MIXED'
      name?: string
    }
  ) {
    return prisma.competitionCategory.create({
      data: {
        competitionId,
        disciplineId: input.disciplineId,
        ageCategoryId: input.ageCategoryId,
        weightCategoryId: input.weightCategoryId,
        beltCategoryId: input.beltCategoryId,
        gender: input.gender || 'MALE',
        name: input.name,
      },
      include: {
        discipline: true,
        ageCategory: true,
        weightCategory: true,
        beltCategory: true,
      },
    })
  }

  /**
   * Remove category from competition
   */
  async removeCategory(categoryId: number) {
    return prisma.competitionCategory.delete({
      where: { id: categoryId },
    })
  }

  /**
   * Get upcoming competitions
   */
  async getUpcoming(federationId?: number, limit = 5) {
    return prisma.competition.findMany({
      where: {
        ...(federationId ? { federationId } : {}),
        startDate: { gte: new Date() },
        status: { not: 'DRAFT' },
        deletedAt: null,
      },
      include: {
        federation: { select: { code: true, name: true } },
        city: { select: { nameRu: true, nameEn: true } },
        _count: {
          select: {
            registrations: { where: { status: 'APPROVED' } },
          },
        },
      },
      orderBy: { startDate: 'asc' },
      take: limit,
    })
  }

  /**
   * Get competition stats
   */
  async getStats(id: number) {
    const [registrations, categories] = await Promise.all([
      prisma.competitionRegistration.groupBy({
        by: ['status'],
        where: { competitionId: id },
        _count: true,
      }),
      prisma.competitionCategory.count({
        where: { competitionId: id },
      }),
    ])

    return {
      registrations: registrations.reduce((acc, r) => {
        acc[r.status] = r._count
        return acc
      }, {} as Record<string, number>),
      categoriesCount: categories,
    }
  }
}

export const competitionService = new CompetitionService()
