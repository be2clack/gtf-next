import prisma from '@/lib/prisma'
import { Prisma, FederationStatus } from '@prisma/client'

export interface CreateFederationInput {
  countryId: number
  code: string
  name: string
  nameEn?: string
  fullName?: Record<string, string>
  domain: string
  customDomain?: string
  logo?: string
  description?: Record<string, string>
  timezone?: string
  currency?: string
  primaryLanguage?: string
  contactEmail?: string
  contactPhone?: string
}

export interface UpdateFederationInput extends Partial<CreateFederationInput> {
  status?: FederationStatus
  heroBackground?: string
  siteTitle?: Record<string, string>
  metaDescription?: Record<string, string>
  metaKeywords?: Record<string, string>
  workingHours?: Record<string, unknown>
  aboutText?: Record<string, string>
  address?: Record<string, string>
  settings?: Record<string, unknown>
  languages?: string[]
  instagram?: string
  facebook?: string
  youtube?: string
  phones?: string[]
}

export interface FederationFilters {
  status?: FederationStatus
  countryId?: number
  search?: string
}

export interface FederationStatistics {
  sportsmen: {
    total: number
    active: number
    withMembership: number
  }
  clubs: {
    total: number
    active: number
  }
  trainers: {
    total: number
    active: number
  }
  competitions: {
    total: number
    upcoming: number
    completed: number
  }
}

const DEFAULT_SETTINGS = {
  membership_fee: 1000,
  competition_fee: 500,
  trainer_fee: 2000,
  certificate_fee: 300,
  allow_online_payment: true,
  require_photo: true,
  require_documents: true,
  auto_approve_registrations: false,
  notification_email: null,
  notification_phone: null,
  telegram_channel: null,
}

export class FederationService {
  /**
   * Find federation by code or domain
   */
  async findByIdentifier(identifier: string) {
    // Try by code first
    let federation = await prisma.federation.findFirst({
      where: {
        code: identifier,
        deletedAt: null,
      },
      include: {
        country: { select: { id: true, code: true, nameRu: true, nameEn: true, flagEmoji: true } },
      },
    })

    // If not found, try by domain
    if (!federation) {
      federation = await prisma.federation.findFirst({
        where: {
          OR: [
            { domain: identifier },
            { customDomain: identifier },
          ],
          deletedAt: null,
        },
        include: {
          country: { select: { id: true, code: true, nameRu: true, nameEn: true, flagEmoji: true } },
        },
      })
    }

    return federation
  }

  /**
   * Get federation by ID
   */
  async getById(id: number, includeRelations = true) {
    return prisma.federation.findUnique({
      where: { id, deletedAt: null },
      include: includeRelations ? {
        country: { select: { id: true, code: true, nameRu: true, nameEn: true, flagEmoji: true } },
        _count: {
          select: {
            sportsmen: true,
            clubs: true,
            trainers: true,
            competitions: true,
          },
        },
      } : undefined,
    })
  }

  /**
   * Get federation by code
   */
  async getByCode(code: string) {
    return prisma.federation.findFirst({
      where: { code, deletedAt: null },
      include: {
        country: { select: { id: true, code: true, nameRu: true, nameEn: true, flagEmoji: true } },
      },
    })
  }

  /**
   * List federations with filters
   */
  async list(filters: FederationFilters = {}, page = 1, limit = 20) {
    const where: Prisma.FederationWhereInput = {
      deletedAt: null,
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.countryId) {
      where.countryId = filters.countryId
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { nameEn: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [federations, total] = await Promise.all([
      prisma.federation.findMany({
        where,
        include: {
          country: { select: { id: true, code: true, nameRu: true, nameEn: true, flagEmoji: true } },
          _count: {
            select: {
              sportsmen: true,
              clubs: true,
              competitions: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.federation.count({ where }),
    ])

    return {
      data: federations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Create new federation
   */
  async create(input: CreateFederationInput) {
    const federation = await prisma.federation.create({
      data: {
        countryId: input.countryId,
        code: input.code.toUpperCase(),
        name: input.name,
        nameEn: input.nameEn,
        fullName: input.fullName || Prisma.JsonNull,
        domain: input.domain,
        customDomain: input.customDomain,
        logo: input.logo,
        description: input.description || Prisma.JsonNull,
        timezone: input.timezone || 'Asia/Bishkek',
        currency: input.currency || 'KGS',
        primaryLanguage: input.primaryLanguage || 'ru',
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        status: 'ACTIVE',
        settings: DEFAULT_SETTINGS,
      },
      include: {
        country: { select: { id: true, code: true, nameRu: true, nameEn: true } },
      },
    })

    return federation
  }

  /**
   * Update federation
   */
  async update(id: number, input: UpdateFederationInput) {
    const updateData: Prisma.FederationUpdateInput = {}

    if (input.name !== undefined) updateData.name = input.name
    if (input.nameEn !== undefined) updateData.nameEn = input.nameEn
    if (input.fullName !== undefined) updateData.fullName = input.fullName || Prisma.JsonNull
    if (input.domain !== undefined) updateData.domain = input.domain
    if (input.customDomain !== undefined) updateData.customDomain = input.customDomain
    if (input.logo !== undefined) updateData.logo = input.logo
    if (input.heroBackground !== undefined) updateData.heroBackground = input.heroBackground
    if (input.description !== undefined) updateData.description = input.description || Prisma.JsonNull
    if (input.siteTitle !== undefined) updateData.siteTitle = input.siteTitle || Prisma.JsonNull
    if (input.metaDescription !== undefined) updateData.metaDescription = input.metaDescription || Prisma.JsonNull
    if (input.metaKeywords !== undefined) updateData.metaKeywords = input.metaKeywords || Prisma.JsonNull
    if (input.workingHours !== undefined) updateData.workingHours = (input.workingHours as Prisma.InputJsonValue) || Prisma.JsonNull
    if (input.aboutText !== undefined) updateData.aboutText = (input.aboutText as Prisma.InputJsonValue) || Prisma.JsonNull
    if (input.address !== undefined) updateData.address = (input.address as Prisma.InputJsonValue) || Prisma.JsonNull
    if (input.settings !== undefined) updateData.settings = (input.settings as Prisma.InputJsonValue) || Prisma.JsonNull
    if (input.status !== undefined) updateData.status = input.status
    if (input.timezone !== undefined) updateData.timezone = input.timezone
    if (input.currency !== undefined) updateData.currency = input.currency
    if (input.languages !== undefined) updateData.languages = input.languages
    if (input.primaryLanguage !== undefined) updateData.primaryLanguage = input.primaryLanguage
    if (input.contactEmail !== undefined) updateData.contactEmail = input.contactEmail
    if (input.contactPhone !== undefined) updateData.contactPhone = input.contactPhone
    if (input.instagram !== undefined) updateData.instagram = input.instagram
    if (input.facebook !== undefined) updateData.facebook = input.facebook
    if (input.youtube !== undefined) updateData.youtube = input.youtube
    if (input.phones !== undefined) updateData.phones = input.phones
    if (input.countryId !== undefined) {
      updateData.country = { connect: { id: input.countryId } }
    }

    return prisma.federation.update({
      where: { id },
      data: updateData,
      include: {
        country: { select: { id: true, code: true, nameRu: true, nameEn: true } },
      },
    })
  }

  /**
   * Delete federation (soft delete)
   */
  async delete(id: number) {
    return prisma.federation.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  /**
   * Get federation statistics
   */
  async getStatistics(federationId: number): Promise<FederationStatistics> {
    const [
      totalSportsmen,
      activeSportsmen,
      sportsmenWithMembership,
      totalClubs,
      activeClubs,
      totalTrainers,
      activeTrainers,
      totalCompetitions,
      upcomingCompetitions,
      completedCompetitions,
    ] = await Promise.all([
      // Sportsmen counts
      prisma.sportsman.count({
        where: { federationId },
      }),
      prisma.sportsman.count({
        where: { federationId, membership: { isNot: null } },
      }),
      prisma.sportsman.count({
        where: {
          federationId,
          membership: {
            status: 'ACTIVE',
          },
        },
      }),
      // Clubs counts
      prisma.club.count({
        where: { federationId },
      }),
      prisma.club.count({
        where: { federationId },
      }),
      // Trainers counts
      prisma.trainer.count({
        where: { federationId },
      }),
      prisma.trainer.count({
        where: { federationId },
      }),
      // Competitions counts
      prisma.competition.count({
        where: { federationId, deletedAt: null },
      }),
      prisma.competition.count({
        where: {
          federationId,
          startDate: { gt: new Date() },
          status: { not: 'DRAFT' },
          deletedAt: null,
        },
      }),
      prisma.competition.count({
        where: {
          federationId,
          status: 'COMPLETED',
          deletedAt: null,
        },
      }),
    ])

    return {
      sportsmen: {
        total: totalSportsmen,
        active: activeSportsmen,
        withMembership: sportsmenWithMembership,
      },
      clubs: {
        total: totalClubs,
        active: activeClubs,
      },
      trainers: {
        total: totalTrainers,
        active: activeTrainers,
      },
      competitions: {
        total: totalCompetitions,
        upcoming: upcomingCompetitions,
        completed: completedCompetitions,
      },
    }
  }

  /**
   * Get federation settings
   */
  async getSettings(federationId: number, key?: string) {
    const federation = await prisma.federation.findUnique({
      where: { id: federationId },
      select: { settings: true },
    })

    const settings = (federation?.settings as Record<string, unknown>) || DEFAULT_SETTINGS

    if (key) {
      return settings[key] ?? null
    }

    return settings
  }

  /**
   * Update federation settings
   */
  async updateSettings(federationId: number, settings: Record<string, unknown>) {
    const federation = await prisma.federation.findUnique({
      where: { id: federationId },
      select: { settings: true },
    })

    const currentSettings = (federation?.settings as Record<string, unknown>) || {}
    const newSettings = { ...currentSettings, ...settings }

    await prisma.federation.update({
      where: { id: federationId },
      data: { settings: newSettings as Prisma.InputJsonValue },
    })

    return newSettings
  }

  /**
   * Check if federation is active
   */
  isActive(federation: { status: FederationStatus; deletedAt: Date | null }): boolean {
    return federation.status === 'ACTIVE' && federation.deletedAt === null
  }

  /**
   * Activate federation
   */
  async activate(id: number) {
    return prisma.federation.update({
      where: { id },
      data: {
        status: 'ACTIVE',
      },
    })
  }

  /**
   * Deactivate federation
   */
  async deactivate(id: number) {
    return prisma.federation.update({
      where: { id },
      data: {
        status: 'INACTIVE',
      },
    })
  }

  /**
   * Suspend federation
   */
  async suspend(id: number) {
    return prisma.federation.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
      },
    })
  }

  /**
   * Get active federations for public display
   */
  async getActiveFederations() {
    return prisma.federation.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        nameEn: true,
        logo: true,
        domain: true,
        country: {
          select: {
            id: true,
            code: true,
            nameRu: true,
            nameEn: true,
            flagEmoji: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  /**
   * Get federation admins
   */
  async getAdmins(federationId: number) {
    return prisma.federationAdmin.findMany({
      where: {
        federationId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })
  }

  /**
   * Add admin to federation
   */
  async addAdmin(federationId: number, userId: number, role = 'admin', permissions?: Record<string, boolean>) {
    return prisma.federationAdmin.create({
      data: {
        federationId,
        userId,
        role,
        permissions: permissions || Prisma.JsonNull,
        isActive: true,
      },
    })
  }

  /**
   * Remove admin from federation
   */
  async removeAdmin(federationId: number, userId: number) {
    return prisma.federationAdmin.deleteMany({
      where: {
        federationId,
        userId,
      },
    })
  }
}

export const federationService = new FederationService()