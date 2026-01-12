import prisma from '@/lib/prisma'
import { DisciplineLevel, Gender } from '@prisma/client'

/**
 * Service for automatic generation of competition categories according to GTF regulations
 * 
 * GTF Weight Categories (Article 2.2)
 * GTF Belt Categories (Article 2.1)
 */

interface WeightRange {
  min: number
  max: number | null // null means open category "X+ and above"
}

interface BeltRange {
  min: number
  max: number
  name: string
}

// GTF Weight Categories - RANGES (from-to) by GTF regulations
const WEIGHT_CATEGORIES_GTF: Record<string, Record<string, WeightRange[]>> = {
  '6-7': {
    male: [
      { min: 10, max: 18 },
      { min: 18.1, max: 20 },
      { min: 20.1, max: 23 },
      { min: 23.1, max: 26 },
      { min: 26.1, max: 29 },
      { min: 29.1, max: 32 },
      { min: 32.1, max: 35 },
      { min: 35.1, max: 39 },
      { min: 39.1, max: 43 },
      { min: 43.1, max: null },
    ],
    female: [
      { min: 10, max: 18 },
      { min: 18.1, max: 20 },
      { min: 20.1, max: 23 },
      { min: 23.1, max: 26 },
      { min: 26.1, max: 29 },
      { min: 29.1, max: 32 },
      { min: 32.1, max: 35 },
      { min: 35.1, max: 39 },
      { min: 39.1, max: 43 },
      { min: 43.1, max: null },
    ],
  },
  '8-9': {
    male: [
      { min: 15, max: 20 },
      { min: 20.1, max: 23 },
      { min: 23.1, max: 26 },
      { min: 26.1, max: 29 },
      { min: 29.1, max: 32 },
      { min: 32.1, max: 35 },
      { min: 35.1, max: 39 },
      { min: 39.1, max: 43 },
      { min: 43.1, max: null },
    ],
    female: [
      { min: 15, max: 20 },
      { min: 20.1, max: 23 },
      { min: 23.1, max: 26 },
      { min: 26.1, max: 29 },
      { min: 29.1, max: 32 },
      { min: 32.1, max: 35 },
      { min: 35.1, max: 39 },
      { min: 39.1, max: 43 },
      { min: 43.1, max: null },
    ],
  },
  '10-11': {
    male: [
      { min: 15, max: 23 },
      { min: 23.1, max: 26 },
      { min: 26.1, max: 29 },
      { min: 29.1, max: 32 },
      { min: 32.1, max: 35 },
      { min: 35.1, max: 39 },
      { min: 39.1, max: 43 },
      { min: 43.1, max: 48 },
      { min: 48.1, max: 53 },
      { min: 53.1, max: null },
    ],
    female: [
      { min: 15, max: 23 },
      { min: 23.1, max: 26 },
      { min: 26.1, max: 29 },
      { min: 29.1, max: 32 },
      { min: 32.1, max: 35 },
      { min: 35.1, max: 39 },
      { min: 39.1, max: 43 },
      { min: 43.1, max: 48 },
      { min: 48.1, max: 53 },
      { min: 53.1, max: null },
    ],
  },
  '12-14': {
    male: [
      { min: 20, max: 30 },
      { min: 30.1, max: 35 },
      { min: 35.1, max: 40 },
      { min: 40.1, max: 45 },
      { min: 45.1, max: 50 },
      { min: 50.1, max: 55 },
      { min: 55.1, max: 60 },
      { min: 60.1, max: 65 },
      { min: 65.1, max: null },
    ],
    female: [
      { min: 20, max: 30 },
      { min: 30.1, max: 35 },
      { min: 35.1, max: 40 },
      { min: 40.1, max: 45 },
      { min: 45.1, max: 50 },
      { min: 50.1, max: 55 },
      { min: 55.1, max: 60 },
      { min: 60.1, max: 65 },
      { min: 65.1, max: null },
    ],
  },
  '15-17': {
    male: [
      { min: 25, max: 40 },
      { min: 40.1, max: 46 },
      { min: 46.1, max: 52 },
      { min: 52.1, max: 58 },
      { min: 58.1, max: 64 },
      { min: 64.1, max: 70 },
      { min: 70.1, max: 76 },
      { min: 76.1, max: null },
    ],
    female: [
      { min: 25, max: 35 },
      { min: 35.1, max: 40 },
      { min: 40.1, max: 46 },
      { min: 46.1, max: 52 },
      { min: 52.1, max: 58 },
      { min: 58.1, max: 64 },
      { min: 64.1, max: 70 },
      { min: 70.1, max: null },
    ],
  },
  '18+': {
    male: [
      { min: 40, max: 52 },
      { min: 52.1, max: 58 },
      { min: 58.1, max: 64 },
      { min: 64.1, max: 70 },
      { min: 70.1, max: 76 },
      { min: 76.1, max: 82 },
      { min: 82.1, max: null },
    ],
    female: [
      { min: 35, max: 46 },
      { min: 46.1, max: 52 },
      { min: 52.1, max: 58 },
      { min: 58.1, max: 64 },
      { min: 64.1, max: 70 },
      { min: 70.1, max: 76 },
      { min: 76.1, max: null },
    ],
  },
}

// Belt categories by level (FESTIVAL/OFFICIAL/WORLD)
const BELT_CATEGORIES_BY_LEVEL: Record<string, Record<string, BeltRange[]>> = {
  FESTIVAL: {
    '6-7': [
      { min: 10, max: 9, name: '10-9 гып' },
      { min: 8, max: 7, name: '8-7 гып' },
      { min: 6, max: 5, name: '6-5 гып' },
      { min: 4, max: 3, name: '4-3 гып' },
      { min: 2, max: 1, name: '2-1 гып' },
    ],
    '8-9': [
      { min: 10, max: 9, name: '10-9 гып' },
      { min: 8, max: 7, name: '8-7 гып' },
      { min: 6, max: 5, name: '6-5 гып' },
      { min: 4, max: 3, name: '4-3 гып' },
      { min: 2, max: 1, name: '2-1 гып' },
    ],
    '10-11': [
      { min: 10, max: 9, name: '10-9 гып' },
      { min: 8, max: 7, name: '8-7 гып' },
      { min: 6, max: 5, name: '6-5 гып' },
    ],
    '12-14': [
      { min: 10, max: 9, name: '10-9 гып' },
      { min: 8, max: 7, name: '8-7 гып' },
      { min: 6, max: 5, name: '6-5 гып' },
      { min: 4, max: 3, name: '4-3 гып' },
    ],
    '15-17': [
      { min: 10, max: 9, name: '10-9 гып' },
      { min: 8, max: 7, name: '8-7 гып' },
      { min: 6, max: 5, name: '6-5 гып' },
      { min: 4, max: 3, name: '4-3 гып' },
    ],
    '18+': [
      { min: 10, max: 9, name: '10-9 гып' },
      { min: 8, max: 7, name: '8-7 гып' },
      { min: 6, max: 5, name: '6-5 гып' },
      { min: 4, max: 3, name: '4-3 гып' },
      { min: 2, max: 1, name: '2-1 гып' },
    ],
  },
  OFFICIAL: {
    '10-11': [
      { min: 4, max: 3, name: '4-3 гып' },
      { min: 2, max: 1, name: '2-1 гып' },
      { min: 101, max: 109, name: '1-9 дан' },
    ],
    '12-14': [
      { min: 2, max: 1, name: '2-1 гып' },
      { min: 101, max: 109, name: '1-9 дан' },
    ],
    '15-17': [
      { min: 2, max: 1, name: '2-1 гып' },
      { min: 101, max: 109, name: '1-9 дан' },
    ],
    '18+': [
      { min: 101, max: 101, name: '1 дан' },
      { min: 102, max: 102, name: '2 дан' },
      { min: 103, max: 103, name: '3 дан' },
      { min: 104, max: 104, name: '4 дан' },
      { min: 105, max: 105, name: '5 дан' },
      { min: 106, max: 106, name: '6 дан' },
      { min: 107, max: 107, name: '7 дан' },
      { min: 108, max: 108, name: '8 дан' },
      { min: 109, max: 109, name: '9 дан' },
    ],
  },
  WORLD: {
    '15-17': [
      { min: 101, max: 109, name: '1-9 дан' },
    ],
    '18+': [
      { min: 103, max: 109, name: '3-9 дан' },
    ],
  },
}

// Level requirements for age groups
const LEVEL_REQUIREMENTS: Record<string, Record<string, number>> = {
  FESTIVAL: {
    '6-7': 10,
    '8-9': 10,
    '10-11': 10,
    '12-14': 10,
    '15-17': 10,
    '18+': 10,
  },
  OFFICIAL: {
    '10-11': 4,
    '12-14': 2,
    '15-17': 2,
    '18+': 101,
  },
  WORLD: {
    '15-17': 101,
    '18+': 103,
  },
}

export interface GenerateCategoriesResult {
  created: number
  disciplinesProcessed: number
}

export class CompetitionCategoryGeneratorService {
  /**
   * Generate all categories for competition
   */
  async generateCategories(competitionId: number): Promise<GenerateCategoriesResult> {
    let createdCount = 0

    // Get competition disciplines
    const competitionDisciplines = await prisma.competitionDiscipline.findMany({
      where: {
        competitionId,
        isActive: true,
      },
      include: {
        discipline: true,
      },
    })

    if (competitionDisciplines.length === 0) {
      console.warn('No disciplines found for competition', { competitionId })
      return { created: 0, disciplinesProcessed: 0 }
    }

    // Get all active age categories
    const ageCategories = await prisma.ageCategory.findMany({
      where: { isActive: true },
    })

    // Deduplicate by age groups
    const ageGroupsMap = new Map<string, typeof ageCategories[0]>()
    for (const ageCategory of ageCategories) {
      const ageGroup = this.getAgeGroup(ageCategory)
      const key = `${ageGroup}_${ageCategory.gender}`
      if (!ageGroupsMap.has(key)) {
        ageGroupsMap.set(key, ageCategory)
      }
    }

    const uniqueAgeCategories = Array.from(ageGroupsMap.values())

    // Generate categories for each discipline
    for (const competitionDiscipline of competitionDisciplines) {
      const discipline = competitionDiscipline.discipline

      for (const ageCategory of uniqueAgeCategories) {
        const count = await this.generateCategoriesForDisciplineAndAge(
          competitionId,
          discipline,
          ageCategory,
          competitionDiscipline
        )
        createdCount += count
      }
    }

    return {
      created: createdCount,
      disciplinesProcessed: competitionDisciplines.length,
    }
  }

  /**
   * Generate categories for specific discipline and age group
   */
  private async generateCategoriesForDisciplineAndAge(
    competitionId: number,
    discipline: { id: number; code: string; name: string; nameRu: string | null },
    ageCategory: { id: number; minAge: number; maxAge: number; gender: Gender; nameRu: string | null },
    competitionDiscipline: { id: number; disciplineLevel: DisciplineLevel }
  ): Promise<number> {
    const disciplineLevel = competitionDiscipline.disciplineLevel

    // Check if should generate for this level
    if (!this.shouldGenerateForLevel(ageCategory, disciplineLevel)) {
      return 0
    }

    const disciplineName = discipline.nameRu?.toLowerCase() || discipline.name.toLowerCase()

    // Determine category type based on discipline
    if (this.isWeightBasedDiscipline(disciplineName)) {
      return this.generateWeightCategories(
        competitionId,
        discipline,
        ageCategory,
        competitionDiscipline
      )
    } else if (this.isBeltBasedDiscipline(disciplineName)) {
      return this.generateBeltCategories(
        competitionId,
        discipline,
        ageCategory,
        competitionDiscipline
      )
    } else {
      return this.generateSimpleCategory(
        competitionId,
        discipline,
        ageCategory,
        competitionDiscipline
      )
    }
  }

  /**
   * Check if should generate categories for this level and age group
   */
  private shouldGenerateForLevel(
    ageCategory: { minAge: number; maxAge: number },
    disciplineLevel: DisciplineLevel
  ): boolean {
    const ageGroup = this.getAgeGroup(ageCategory)
    const requirements = LEVEL_REQUIREMENTS[disciplineLevel]
    return requirements ? ageGroup in requirements : false
  }

  /**
   * Generate weight categories (for Massogi, Point-stop)
   */
  private async generateWeightCategories(
    competitionId: number,
    discipline: { id: number; code: string; name: string; nameRu: string | null },
    ageCategory: { id: number; minAge: number; maxAge: number; gender: Gender; nameRu: string | null },
    competitionDiscipline: { id: number; disciplineLevel: DisciplineLevel }
  ): Promise<number> {
    let createdCount = 0
    const ageGroup = this.getAgeGroup(ageCategory)
    const genderKey = ageCategory.gender === 'MALE' ? 'male' : 'female'

    const weightCategories = WEIGHT_CATEGORIES_GTF[ageGroup]?.[genderKey]
    if (!weightCategories) {
      return 0
    }

    for (const weight of weightCategories) {
      // Get or create weight category
      const weightCategory = await this.getOrCreateWeightCategory(
        discipline.id,
        genderKey,
        weight
      )

      if (weightCategory) {
        const name = this.generateCategoryName(
          discipline,
          ageCategory,
          weightCategory.name,
          null
        )
        const code = this.generateCategoryCode(
          discipline,
          ageCategory,
          weightCategory.id,
          null
        )

        const existing = await prisma.competitionCategory.findFirst({
          where: {
            competitionId,
            competitionDisciplineId: competitionDiscipline.id,
            ageCategoryId: ageCategory.id,
            weightCategoryId: weightCategory.id,
          },
        })

        if (existing) {
          await prisma.competitionCategory.update({
            where: { id: existing.id },
            data: { name, code },
          })
        } else {
          await prisma.competitionCategory.create({
            data: {
              competitionId,
              competitionDisciplineId: competitionDiscipline.id,
              disciplineId: discipline.id,
              level: competitionDiscipline.disciplineLevel,
              ageCategoryId: ageCategory.id,
              weightCategoryId: weightCategory.id,
              gender: ageCategory.gender,
              name,
              code,
              minParticipants: 2,
            },
          })
        }

        createdCount++
      }
    }

    return createdCount
  }

  /**
   * Generate belt categories (for Hyong)
   */
  private async generateBeltCategories(
    competitionId: number,
    discipline: { id: number; code: string; name: string; nameRu: string | null },
    ageCategory: { id: number; minAge: number; maxAge: number; gender: Gender; nameRu: string | null },
    competitionDiscipline: { id: number; disciplineLevel: DisciplineLevel }
  ): Promise<number> {
    let createdCount = 0
    const ageGroup = this.getAgeGroup(ageCategory)
    const disciplineLevel = competitionDiscipline.disciplineLevel

    const beltRules = BELT_CATEGORIES_BY_LEVEL[disciplineLevel]?.[ageGroup]
    if (!beltRules) {
      return 0
    }

    for (const rule of beltRules) {
      // Get or create belt category
      const beltCategory = await this.getOrCreateBeltCategory(
        discipline.id,
        rule
      )

      if (beltCategory) {
        const name = this.generateCategoryName(
          discipline,
          ageCategory,
          null,
          rule.name
        )
        const code = this.generateCategoryCode(
          discipline,
          ageCategory,
          null,
          beltCategory.id
        )

        await prisma.competitionCategory.create({
          data: {
            competitionId,
            competitionDisciplineId: competitionDiscipline.id,
            disciplineId: discipline.id,
            level: competitionDiscipline.disciplineLevel,
            ageCategoryId: ageCategory.id,
            beltCategoryId: beltCategory.id,
            gender: ageCategory.gender,
            name,
            code,
            minParticipants: 2,
          },
        })

        createdCount++
      }
    }

    return createdCount
  }

  /**
   * Generate simple category (for Power Breaking, Special Technique)
   */
  private async generateSimpleCategory(
    competitionId: number,
    discipline: { id: number; code: string; name: string; nameRu: string | null },
    ageCategory: { id: number; minAge: number; maxAge: number; gender: Gender; nameRu: string | null },
    competitionDiscipline: { id: number; disciplineLevel: DisciplineLevel }
  ): Promise<number> {
    const name = this.generateCategoryName(discipline, ageCategory, null, null)
    const code = this.generateCategoryCode(discipline, ageCategory, null, null)

    const existing = await prisma.competitionCategory.findFirst({
      where: {
        competitionId,
        competitionDisciplineId: competitionDiscipline.id,
        ageCategoryId: ageCategory.id,
        weightCategoryId: null,
        beltCategoryId: null,
      },
    })

    if (existing) {
      await prisma.competitionCategory.update({
        where: { id: existing.id },
        data: { name, code },
      })
    } else {
      await prisma.competitionCategory.create({
        data: {
          competitionId,
          competitionDisciplineId: competitionDiscipline.id,
          disciplineId: discipline.id,
          level: competitionDiscipline.disciplineLevel,
          ageCategoryId: ageCategory.id,
          gender: ageCategory.gender,
          name,
          code,
          minParticipants: 2,
        },
      })
    }

    return 1
  }

  /**
   * Get or create weight category
   */
  private async getOrCreateWeightCategory(
    disciplineId: number,
    gender: string,
    weight: WeightRange
  ) {
    const name = weight.max === null
      ? `${weight.min} кг и выше`
      : `${weight.min}-${weight.max} кг`

    return prisma.weightCategory.upsert({
      where: {
        id: -1, // Force create if not found
      },
      create: {
        disciplineId,
        code: `W${weight.min}-${weight.max || 'plus'}`,
        name,
        minWeight: weight.min,
        maxWeight: weight.max || 999,
        gender: gender === 'male' ? 'MALE' : 'FEMALE',
        isActive: true,
      },
      update: {},
    }).catch(async () => {
      // If upsert fails, try to find existing
      return prisma.weightCategory.findFirst({
        where: {
          disciplineId,
          minWeight: weight.min,
          maxWeight: weight.max || 999,
          gender: gender === 'male' ? 'MALE' : 'FEMALE',
        },
      }) || prisma.weightCategory.create({
        data: {
          disciplineId,
          code: `W${weight.min}-${weight.max || 'plus'}`,
          name,
          minWeight: weight.min,
          maxWeight: weight.max || 999,
          gender: gender === 'male' ? 'MALE' : 'FEMALE',
          isActive: true,
        },
      })
    })
  }

  /**
   * Get or create belt category
   * Note: Belt categories require ageCategoryId and disciplineId
   * This function returns existing category or null (cannot auto-create without age category)
   */
  private async getOrCreateBeltCategory(
    disciplineId: number,
    rule: BeltRange
  ) {
    // Belt categories now require age_category_id, so we just find existing
    const existing = await prisma.beltCategory.findFirst({
      where: {
        disciplineId,
        beltMin: rule.min,
        beltMax: rule.max,
      },
    })

    return existing
  }

  /**
   * Get age group string from age category
   */
  private getAgeGroup(ageCategory: { minAge: number; maxAge: number }): string {
    const { minAge, maxAge } = ageCategory

    if (minAge >= 6 && maxAge <= 7) return '6-7'
    if (minAge >= 8 && maxAge <= 9) return '8-9'
    if (minAge >= 10 && maxAge <= 11) return '10-11'
    if (minAge >= 12 && maxAge <= 14) return '12-14'
    if (minAge >= 15 && maxAge <= 17) return '15-17'
    if (minAge >= 18) return '18+'

    return '18+'
  }

  /**
   * Check if discipline uses weight categories
   */
  private isWeightBasedDiscipline(name: string): boolean {
    const keywords = ['масоги', 'массоги', 'спарринг', 'поинт']
    return keywords.some(k => name.includes(k))
  }

  /**
   * Check if discipline uses belt categories
   */
  private isBeltBasedDiscipline(name: string): boolean {
    const keywords = ['хъёнг', 'хьёнг', 'формальн', 'пхумсэ']
    return keywords.some(k => name.includes(k))
  }

  /**
   * Generate category name
   */
  private generateCategoryName(
    discipline: { nameRu: string | null; name: string },
    ageCategory: { nameRu: string | null; gender: Gender },
    weightName: string | null,
    beltName: string | null
  ): string {
    const parts: string[] = []

    parts.push(discipline.nameRu || discipline.name)
    parts.push(ageCategory.nameRu || '')

    if (weightName) {
      parts.push(weightName)
    } else if (beltName) {
      parts.push(beltName)
    }

    parts.push(ageCategory.gender === 'MALE' ? 'Мужчины' : 'Женщины')

    return parts.filter(Boolean).join('\t')
  }

  /**
   * Generate category code
   */
  private generateCategoryCode(
    discipline: { code: string },
    ageCategory: { id: number; gender: Gender },
    weightCategoryId: number | null,
    beltCategoryId: number | null
  ): string {
    const parts: string[] = []

    parts.push(discipline.code.toUpperCase().substring(0, 3))
    parts.push(`AGE${ageCategory.id}`)

    if (weightCategoryId) {
      parts.push(`W${weightCategoryId}`)
    }
    if (beltCategoryId) {
      parts.push(`B${beltCategoryId}`)
    }

    parts.push(ageCategory.gender === 'MALE' ? 'M' : 'F')

    return parts.join('_')
  }

  /**
   * Clear all categories for competition
   */
  async clearCategories(competitionId: number): Promise<number> {
    const result = await prisma.competitionCategory.deleteMany({
      where: { competitionId },
    })
    return result.count
  }

  /**
   * Get category statistics for competition
   */
  async getCategoryStats(competitionId: number) {
    const [total, byDiscipline, byGender] = await Promise.all([
      prisma.competitionCategory.count({
        where: { competitionId },
      }),
      prisma.competitionCategory.groupBy({
        by: ['disciplineId'],
        where: { competitionId },
        _count: true,
      }),
      prisma.competitionCategory.groupBy({
        by: ['gender'],
        where: { competitionId },
        _count: true,
      }),
    ])

    return {
      total,
      byDiscipline: byDiscipline.map(d => ({
        disciplineId: d.disciplineId,
        count: d._count,
      })),
      byGender: byGender.map(g => ({
        gender: g.gender,
        count: g._count,
      })),
    }
  }
}

export const categoryGeneratorService = new CompetitionCategoryGeneratorService()