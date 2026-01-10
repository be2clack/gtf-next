import prisma from '@/lib/prisma'

/**
 * Weigh-in service for participants according to GTF regulations
 * 
 * Article 20 GTF Regulations:
 * - Weigh-in no earlier than 36 hours and no later than 1 hour before start
 * - Duration minimum 2 hours
 * - 2 hours for weight correction if not within limits
 * - Electronic scales with 0.1 kg precision
 */

export interface WeighInResult {
  success: boolean
  message?: string
  created?: number
  total?: number
}

export interface WeighInStats {
  total: number
  pending: number
  passed: number
  correction: number
  failed: number
  completionPercentage: number
}

export interface WeightLimits {
  min: number | null
  max: number | null
}

// Time for weight correction (minutes)
const CORRECTION_TIME_MINUTES = 120 // 2 hours

type WeighInStatus = 'pending' | 'passed' | 'correction' | 'failed' | 'disqualified'

export class WeighInService {
  /**
   * Initialize weigh-in session for all registered participants
   */
  async initializeWeighInSession(competitionId: number): Promise<WeighInResult> {
    // Get all approved participants
    const registrations = await prisma.competitionRegistration.findMany({
      where: {
        competitionId,
        status: 'APPROVED',
      },
      include: {
        competitionCategory: {
          include: {
            weightCategory: true,
          },
        },
        sportsman: true,
      },
    })

    if (registrations.length === 0) {
      return {
        success: false,
        message: 'No approved participants for weigh-in',
      }
    }

    let createdCount = 0

    for (const registration of registrations) {
      // Check if weigh-in record already exists
      const existingWeighIn = await prisma.weighIn.findFirst({
        where: { registrationId: registration.id },
      })

      if (!existingWeighIn) {
        // Get weight limits from category
        const weightLimits = this.getWeightLimits(registration.competitionCategory?.weightCategory ?? null)

        await prisma.weighIn.create({
          data: {
            registrationId: registration.id,
            weight: registration.currentWeight || 0,
            isOverweight: false,
            isUnderweight: false,
            notes: JSON.stringify({
              declaredWeight: registration.currentWeight,
              minAllowedWeight: weightLimits.min,
              maxAllowedWeight: weightLimits.max,
              status: 'pending',
              attemptNumber: 1,
            }),
          },
        })

        createdCount++
      }
    }

    return {
      success: true,
      created: createdCount,
      total: registrations.length,
    }
  }

  /**
   * Get weight limits from weight category
   */
  private getWeightLimits(weightCategory: { minWeight: number; maxWeight: number } | null): WeightLimits {
    if (!weightCategory) {
      // For hyong and other disciplines without weight categories
      return { min: null, max: null }
    }

    return {
      min: weightCategory.minWeight,
      max: weightCategory.maxWeight,
    }
  }

  /**
   * Record weigh-in result
   */
  async recordWeighIn(
    weighInId: number,
    actualWeight: number,
    weighedById?: number
  ) {
    const weighIn = await prisma.weighIn.findUnique({
      where: { id: weighInId },
    })

    if (!weighIn) {
      throw new Error('Weigh-in record not found')
    }

    const notes = weighIn.notes ? JSON.parse(weighIn.notes as string) : {}
    const status = notes.status as WeighInStatus

    // If first weigh-in
    if (status === 'pending') {
      const minWeight = notes.minAllowedWeight
      const maxWeight = notes.maxAllowedWeight
      const isWithinLimits = this.isWithinLimits(actualWeight, minWeight, maxWeight)
      const difference = this.calculateDifference(actualWeight, minWeight, maxWeight)

      let newStatus: WeighInStatus
      let correctionDeadline: Date | null = null

      if (isWithinLimits) {
        newStatus = 'passed'

        // Update registration - WEIGH-IN PASSED!
        await prisma.competitionRegistration.update({
          where: { id: weighIn.registrationId },
          data: {
            confirmedWeight: actualWeight,
            isWeighedIn: true,
            weighedInAt: new Date(),
          },
        })
      } else {
        // Give 2 hours for correction
        newStatus = 'correction'
        correctionDeadline = new Date(Date.now() + CORRECTION_TIME_MINUTES * 60 * 1000)
      }

      await prisma.weighIn.update({
        where: { id: weighInId },
        data: {
          weight: actualWeight,
          weighedAt: new Date(),
          weighedById,
          isOverweight: maxWeight !== null && actualWeight > maxWeight,
          isUnderweight: minWeight !== null && actualWeight < minWeight,
          notes: JSON.stringify({
            ...notes,
            status: newStatus,
            actualWeight,
            weighInTime: new Date().toISOString(),
            weightDifference: difference,
            correctionDeadline: correctionDeadline?.toISOString(),
            finalWeight: isWithinLimits ? actualWeight : undefined,
            finalWeighInTime: isWithinLimits ? new Date().toISOString() : undefined,
          }),
        },
      })
    }

    return prisma.weighIn.findUnique({
      where: { id: weighInId },
    })
  }

  /**
   * Record correction weigh-in result (after weight correction)
   */
  async recordCorrectionWeighIn(weighInId: number, newWeight: number) {
    const weighIn = await prisma.weighIn.findUnique({
      where: { id: weighInId },
    })

    if (!weighIn) {
      throw new Error('Weigh-in record not found')
    }

    const notes = weighIn.notes ? JSON.parse(weighIn.notes as string) : {}
    const status = notes.status as WeighInStatus

    if (status !== 'correction') {
      throw new Error('Sportsman is not in weight correction period')
    }

    // Check deadline
    if (notes.correctionDeadline && new Date() > new Date(notes.correctionDeadline)) {
      await prisma.weighIn.update({
        where: { id: weighInId },
        data: {
          notes: JSON.stringify({ ...notes, status: 'failed' }),
        },
      })
      throw new Error('Correction time expired')
    }

    const minWeight = notes.minAllowedWeight
    const maxWeight = notes.maxAllowedWeight
    const isWithinLimits = this.isWithinLimits(newWeight, minWeight, maxWeight)
    const difference = this.calculateDifference(newWeight, minWeight, maxWeight)

    let newStatus: WeighInStatus
    if (isWithinLimits) {
      newStatus = 'passed'

      // Update registration - CORRECTION SUCCESSFUL!
      await prisma.competitionRegistration.update({
        where: { id: weighIn.registrationId },
        data: {
          confirmedWeight: newWeight,
          isWeighedIn: true,
          weighedInAt: new Date(),
        },
      })
    } else {
      newStatus = 'failed'

      // Update registration - WEIGH-IN FAILED
      await prisma.competitionRegistration.update({
        where: { id: weighIn.registrationId },
        data: {
          isWeighedIn: false,
        },
      })
    }

    await prisma.weighIn.update({
      where: { id: weighInId },
      data: {
        weight: newWeight,
        isOverweight: maxWeight !== null && newWeight > maxWeight,
        isUnderweight: minWeight !== null && newWeight < minWeight,
        notes: JSON.stringify({
          ...notes,
          status: newStatus,
          finalWeight: newWeight,
          finalWeighInTime: new Date().toISOString(),
          attemptNumber: (notes.attemptNumber || 1) + 1,
          weightDifference: difference,
        }),
      },
    })

    return prisma.weighIn.findUnique({
      where: { id: weighInId },
    })
  }

  /**
   * Check if weight is within category limits
   */
  private isWithinLimits(weight: number, min: number | null, max: number | null): boolean {
    // If no limits (hyong etc.), always passes
    if (min === null && max === null) {
      return true
    }

    if (min !== null && weight < min) {
      return false
    }

    if (max !== null && weight > max) {
      return false
    }

    return true
  }

  /**
   * Calculate difference with limit
   */
  private calculateDifference(weight: number, min: number | null, max: number | null): number {
    // If overweight
    if (max !== null && weight > max) {
      return Math.round((weight - max) * 100) / 100
    }

    // If underweight
    if (min !== null && weight < min) {
      return Math.round((weight - min) * 100) / 100
    }

    return 0
  }

  /**
   * Get weigh-in statistics for competition
   */
  async getWeighInStats(competitionId: number): Promise<WeighInStats> {
    const weighIns = await prisma.weighIn.findMany({
      where: {
        // Find weigh-ins through registrations
      },
      select: {
        notes: true,
      },
    })

    // Since we store status in notes, we need to parse it
    const registrations = await prisma.competitionRegistration.findMany({
      where: { competitionId },
      select: { id: true },
    })

    const registrationIds = registrations.map(r => r.id)

    const allWeighIns = await prisma.weighIn.findMany({
      where: {
        registrationId: { in: registrationIds },
      },
    })

    let pending = 0
    let passed = 0
    let correction = 0
    let failed = 0

    for (const weighIn of allWeighIns) {
      const notes = weighIn.notes ? JSON.parse(weighIn.notes as string) : {}
      const status = notes.status as WeighInStatus

      switch (status) {
        case 'pending':
          pending++
          break
        case 'passed':
          passed++
          break
        case 'correction':
          correction++
          break
        case 'failed':
        case 'disqualified':
          failed++
          break
      }
    }

    const total = allWeighIns.length

    return {
      total,
      pending,
      passed,
      correction,
      failed,
      completionPercentage: total > 0 ? Math.round((passed / total) * 1000) / 10 : 0,
    }
  }

  /**
   * Disqualify sportsman for weight non-compliance
   */
  async disqualify(weighInId: number, reason: string) {
    const weighIn = await prisma.weighIn.findUnique({
      where: { id: weighInId },
    })

    if (!weighIn) {
      throw new Error('Weigh-in record not found')
    }

    const notes = weighIn.notes ? JSON.parse(weighIn.notes as string) : {}

    await prisma.weighIn.update({
      where: { id: weighInId },
      data: {
        notes: JSON.stringify({
          ...notes,
          status: 'disqualified',
          disqualificationReason: reason,
        }),
      },
    })

    // Reject registration
    await prisma.competitionRegistration.update({
      where: { id: weighIn.registrationId },
      data: {
        status: 'REJECTED',
        rejectionReason: `Disqualified at weigh-in: ${reason}`,
        isWeighedIn: false,
      },
    })

    return prisma.weighIn.findUnique({
      where: { id: weighInId },
    })
  }

  /**
   * Approve all pending weigh-ins (automatic weigh-in by declared weight)
   */
  async approveAllPending(competitionId: number, approvedById?: number): Promise<WeighInResult> {
    // Get all registrations for this competition
    const registrations = await prisma.competitionRegistration.findMany({
      where: { competitionId },
      select: { id: true },
    })

    const registrationIds = registrations.map(r => r.id)

    // Get pending weigh-ins
    const pendingWeighIns = await prisma.weighIn.findMany({
      where: {
        registrationId: { in: registrationIds },
      },
    })

    let approved = 0
    const total = pendingWeighIns.length

    for (const weighIn of pendingWeighIns) {
      const notes = weighIn.notes ? JSON.parse(weighIn.notes as string) : {}
      
      if (notes.status !== 'pending') {
        continue
      }

      const declaredWeight = notes.declaredWeight || weighIn.weight

      await prisma.weighIn.update({
        where: { id: weighIn.id },
        data: {
          weight: declaredWeight,
          weighedAt: new Date(),
          weighedById: approvedById,
          notes: JSON.stringify({
            ...notes,
            status: 'passed',
            actualWeight: declaredWeight,
            weighInTime: new Date().toISOString(),
            weightDifference: 0,
            autoApproved: true,
            autoApprovalNote: 'Approved automatically',
          }),
        },
      })

      // Update registration
      await prisma.competitionRegistration.update({
        where: { id: weighIn.registrationId },
        data: {
          isWeighedIn: true,
          confirmedWeight: declaredWeight,
          weighedInAt: new Date(),
        },
      })

      approved++
    }

    return {
      success: true,
      created: approved,
      total,
    }
  }

  /**
   * Get weigh-in list for competition
   */
  async getWeighInList(competitionId: number) {
    const registrations = await prisma.competitionRegistration.findMany({
      where: { competitionId },
      include: {
        sportsman: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
            weight: true,
          },
        },
        competitionCategory: {
          include: {
            weightCategory: true,
            discipline: true,
          },
        },
      },
    })

    const registrationIds = registrations.map(r => r.id)

    const weighIns = await prisma.weighIn.findMany({
      where: {
        registrationId: { in: registrationIds },
      },
    })

    // Map weigh-ins to registrations
    const weighInMap = new Map(weighIns.map(w => [w.registrationId, w]))

    return registrations.map(reg => {
      const weighIn = weighInMap.get(reg.id)
      const notes = weighIn?.notes ? JSON.parse(weighIn.notes as string) : null

      return {
        registration: {
          id: reg.id,
          currentWeight: reg.currentWeight,
          confirmedWeight: reg.confirmedWeight,
          isWeighedIn: reg.isWeighedIn,
        },
        sportsman: reg.sportsman,
        category: reg.competitionCategory,
        weighIn: weighIn ? {
          id: weighIn.id,
          weight: weighIn.weight,
          weighedAt: weighIn.weighedAt,
          isOverweight: weighIn.isOverweight,
          isUnderweight: weighIn.isUnderweight,
          status: notes?.status || 'pending',
          declaredWeight: notes?.declaredWeight,
          weightDifference: notes?.weightDifference,
          correctionDeadline: notes?.correctionDeadline,
        } : null,
      }
    })
  }
}

export const weighInService = new WeighInService()