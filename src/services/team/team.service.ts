import prisma from '@/lib/prisma'
import { Prisma, TeamType, Gender, RegistrationStatus, PaymentStatus } from '@prisma/client'

export interface CreateTeamInput {
  name: string
  teamType: TeamType
  competitionId: number
  clubId?: number
  federationId?: number
  regionId?: number
  cityId?: number
  coachId?: number
  captainId?: number
  gender?: Gender
  category?: string
}

export interface TeamValidationResult {
  valid: boolean
  errors: string[]
}

export class TeamService {
  /**
   * Create team with validation
   */
  async createTeam(input: CreateTeamInput) {
    // Validate team data
    await this.validateTeamData(input)

    const team = await prisma.team.create({
      data: {
        name: input.name,
        teamType: input.teamType,
        competitionId: input.competitionId,
        clubId: input.clubId,
        federationId: input.federationId,
        regionId: input.regionId,
        cityId: input.cityId,
        coachId: input.coachId,
        captainId: input.captainId,
        gender: input.gender || 'MIXED',
        category: input.category,
      },
      include: {
        club: { select: { id: true, title: true } },
        federation: { select: { id: true, code: true, name: true } },
        region: { select: { id: true, nameRu: true, nameEn: true } },
        city: { select: { id: true, nameRu: true, nameEn: true } },
        coach: { select: { id: true, firstName: true, lastName: true } },
        captain: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return team
  }

  /**
   * Get team by ID
   */
  async getById(id: number) {
    return prisma.team.findUnique({
      where: { id },
      include: {
        club: { select: { id: true, title: true } },
        federation: { select: { id: true, code: true, name: true } },
        region: { select: { id: true, nameRu: true, nameEn: true } },
        city: { select: { id: true, nameRu: true, nameEn: true } },
        coach: { select: { id: true, firstName: true, lastName: true } },
        captain: { select: { id: true, firstName: true, lastName: true } },
        members: {
          include: {
            sportsman: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                photo: true,
                beltLevel: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            registrations: true,
          },
        },
      },
    })
  }

  /**
   * List teams for competition
   */
  async listByCompetition(competitionId: number) {
    return prisma.team.findMany({
      where: { competitionId },
      include: {
        club: { select: { id: true, title: true } },
        region: { select: { id: true, nameRu: true, nameEn: true } },
        city: { select: { id: true, nameRu: true, nameEn: true } },
        coach: { select: { id: true, firstName: true, lastName: true } },
        _count: {
          select: {
            members: true,
            registrations: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  /**
   * Add member to team
   */
  async addMember(teamId: number, sportsmanId: number, position?: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    })

    if (!team) {
      throw new Error('Team not found')
    }

    // Check if sportsman is already in team
    const existingMember = team.members.find(m => m.sportsmanId === sportsmanId)
    if (existingMember) {
      throw new Error('Sportsman is already in this team')
    }

    // Check if sportsman can be added
    const canAdd = await this.canAddMember(team, sportsmanId)
    if (!canAdd.valid) {
      throw new Error(canAdd.errors.join('. '))
    }

    return prisma.teamMember.create({
      data: {
        teamId,
        sportsmanId,
        position,
      },
      include: {
        sportsman: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
      },
    })
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId: number, sportsmanId: number) {
    // Check if team has registrations
    const registrations = await prisma.competitionRegistration.count({
      where: { teamId },
    })

    if (registrations > 0) {
      throw new Error('Cannot remove member: team is already registered for competition')
    }

    const result = await prisma.teamMember.deleteMany({
      where: {
        teamId,
        sportsmanId,
      },
    })

    return result.count > 0
  }

  /**
   * Check if sportsman can be added to team
   */
  private async canAddMember(
    team: { teamType: TeamType; clubId: number | null; regionId: number | null; cityId: number | null; federationId: number | null },
    sportsmanId: number
  ): Promise<TeamValidationResult> {
    const errors: string[] = []

    const sportsman = await prisma.sportsman.findUnique({
      where: { id: sportsmanId },
      include: {
        club: { select: { id: true, regionId: true, cityId: true } },
      },
    })

    if (!sportsman) {
      return { valid: false, errors: ['Sportsman not found'] }
    }

    let belongsToTeam = false

    switch (team.teamType) {
      case 'CLUB':
        belongsToTeam = sportsman.clubId === team.clubId
        if (!belongsToTeam) {
          errors.push('Sportsman must belong to the team club')
        }
        break

      case 'REGIONAL':
        belongsToTeam = sportsman.regionId === team.regionId ||
          (sportsman.club?.regionId === team.regionId)
        if (!belongsToTeam) {
          errors.push('Sportsman must belong to the team region')
        }
        break

      case 'CITY':
        belongsToTeam = sportsman.cityId === team.cityId ||
          (sportsman.club?.cityId === team.cityId)
        if (!belongsToTeam) {
          errors.push('Sportsman must belong to the team city')
        }
        break

      case 'NATIONAL':
        belongsToTeam = sportsman.federationId === team.federationId
        if (!belongsToTeam) {
          errors.push('Sportsman must belong to the team federation')
        }
        break
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate team composition for competition
   */
  async validateTeamComposition(teamId: number): Promise<TeamValidationResult> {
    const errors: string[] = []

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        competition: true,
        members: {
          include: {
            sportsman: {
              include: {
                club: { select: { id: true, regionId: true, cityId: true } },
              },
            },
          },
        },
      },
    })

    if (!team) {
      return { valid: false, errors: ['Team not found'] }
    }

    // Check minimum members (default 3)
    const minMembers = 3 // TODO: Get from discipline
    if (team.members.length < minMembers) {
      errors.push(`Not enough team members. Minimum: ${minMembers}`)
    }

    // Check each member belongs to correct organization
    for (const member of team.members) {
      const sportsman = member.sportsman
      let belongsToTeam = false

      switch (team.teamType) {
        case 'CLUB':
          belongsToTeam = sportsman.clubId === team.clubId
          break
        case 'REGIONAL':
          belongsToTeam = sportsman.regionId === team.regionId ||
            (sportsman.club?.regionId === team.regionId)
          break
        case 'CITY':
          belongsToTeam = sportsman.cityId === team.cityId ||
            (sportsman.club?.cityId === team.cityId)
          break
        case 'NATIONAL':
          belongsToTeam = sportsman.federationId === team.federationId
          break
      }

      if (!belongsToTeam) {
        errors.push(`Sportsman ${sportsman.lastName} ${sportsman.firstName} does not match team type`)
      }
    }

    // Check team type matches competition requirements
    if (team.competition.teamType && team.teamType !== team.competition.teamType) {
      errors.push('Team type does not match competition requirements')
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Get available sportsmen for adding to team
   * CRITICAL: Returns ONLY registered for competition AND paid!
   */
  async getAvailableSportsmenForTeam(teamId: number) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    })

    if (!team) {
      throw new Error('Team not found')
    }

    // Get IDs of sportsmen already in team
    const existingMemberIds = team.members.map(m => m.sportsmanId)

    // Build where clause based on team type
    const where: Prisma.SportsmanWhereInput = {
      // Must be registered for THIS competition and approved + paid
      registrations: {
        some: {
          competitionId: team.competitionId,
          status: 'APPROVED' as RegistrationStatus,
          paymentStatus: 'PAID' as PaymentStatus,
        },
      },
      // Exclude already added members
      id: { notIn: existingMemberIds },
    }

    // Filter by team type
    switch (team.teamType) {
      case 'CLUB':
        where.clubId = team.clubId
        break
      case 'REGIONAL':
        where.regionId = team.regionId
        break
      case 'CITY':
        where.cityId = team.cityId
        break
      case 'NATIONAL':
        where.federationId = team.federationId
        break
    }

    return prisma.sportsman.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        photo: true,
        beltLevel: true,
        weight: true,
        club: { select: { id: true, title: true } },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    })
  }

  /**
   * Delete team (only if no registrations)
   */
  async deleteTeam(teamId: number) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { _count: { select: { registrations: true } } },
    })

    if (!team) {
      throw new Error('Team not found')
    }

    if (team._count.registrations > 0) {
      throw new Error('Cannot delete team: has active competition registrations')
    }

    // Delete members first, then team
    await prisma.$transaction([
      prisma.teamMember.deleteMany({ where: { teamId } }),
      prisma.team.delete({ where: { id: teamId } }),
    ])

    return true
  }

  /**
   * Update team
   */
  async updateTeam(id: number, input: Partial<CreateTeamInput>) {
    const updateData: Prisma.TeamUpdateInput = {}

    if (input.name !== undefined) updateData.name = input.name
    if (input.gender !== undefined) updateData.gender = input.gender
    if (input.category !== undefined) updateData.category = input.category
    if (input.coachId !== undefined) {
      updateData.coach = input.coachId ? { connect: { id: input.coachId } } : { disconnect: true }
    }
    if (input.captainId !== undefined) {
      updateData.captain = input.captainId ? { connect: { id: input.captainId } } : { disconnect: true }
    }

    return prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        club: { select: { id: true, title: true } },
        coach: { select: { id: true, firstName: true, lastName: true } },
        captain: { select: { id: true, firstName: true, lastName: true } },
      },
    })
  }

  /**
   * Validate team data before creation
   */
  private async validateTeamData(data: CreateTeamInput): Promise<void> {
    if (!data.name) {
      throw new Error('Team name is required')
    }

    if (!data.teamType) {
      throw new Error('Team type is required')
    }

    if (!data.competitionId) {
      throw new Error('Competition ID is required')
    }

    // Check organization based on team type
    switch (data.teamType) {
      case 'CLUB':
        if (!data.clubId) {
          throw new Error('Club ID is required for club team')
        }
        break
      case 'REGIONAL':
        if (!data.regionId) {
          throw new Error('Region ID is required for regional team')
        }
        break
      case 'CITY':
        if (!data.cityId) {
          throw new Error('City ID is required for city team')
        }
        break
      case 'NATIONAL':
        if (!data.federationId) {
          throw new Error('Federation ID is required for national team')
        }
        break
      default:
        throw new Error('Unknown team type')
    }

    // Check competition exists and supports teams
    const competition = await prisma.competition.findUnique({
      where: { id: data.competitionId },
      select: { id: true, type: true, format: true },
    })

    if (!competition) {
      throw new Error('Competition not found')
    }

    if (competition.type === 'PERSONAL' && competition.format === 'PERSONAL') {
      throw new Error('This competition does not support team registrations')
    }
  }
}

export const teamService = new TeamService()