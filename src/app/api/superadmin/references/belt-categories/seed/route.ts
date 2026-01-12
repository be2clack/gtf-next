import { NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GTF Belt Categories Seed Data (from Laravel BeltCategorySeeder)
// Based on GTF regulations Article 2.1 (Hyong discipline)

interface BeltCategorySeed {
  ageCategoryCode: string
  disciplineCode: string
  beltMin: number
  beltMax: number
  name: string
  sortOrder: number
}

const BELT_CATEGORIES_SEED: BeltCategorySeed[] = [
  // ЮНОШИ/ДЕВУШКИ 10-11 лет
  { ageCategoryCode: '10_11_male', disciplineCode: 'hyong', beltMin: 4, beltMax: 3, name: 'Юноши 10-11 лет: 4-3 гып', sortOrder: 1 },
  { ageCategoryCode: '10_11_male', disciplineCode: 'hyong', beltMin: 2, beltMax: 1, name: 'Юноши 10-11 лет: 2-1 гып', sortOrder: 2 },
  { ageCategoryCode: '10_11_male', disciplineCode: 'hyong', beltMin: -1, beltMax: -1, name: 'Юноши 10-11 лет: 1 Дан', sortOrder: 3 },
  { ageCategoryCode: '10_11_female', disciplineCode: 'hyong', beltMin: 4, beltMax: 3, name: 'Девушки 10-11 лет: 4-3 гып', sortOrder: 1 },
  { ageCategoryCode: '10_11_female', disciplineCode: 'hyong', beltMin: 2, beltMax: 1, name: 'Девушки 10-11 лет: 2-1 гып', sortOrder: 2 },
  { ageCategoryCode: '10_11_female', disciplineCode: 'hyong', beltMin: -1, beltMax: -1, name: 'Девушки 10-11 лет: 1 Дан', sortOrder: 3 },

  // ЮНОШИ/ДЕВУШКИ 12-14 лет
  { ageCategoryCode: '12_14_male', disciplineCode: 'hyong', beltMin: 2, beltMax: 1, name: 'Юноши 12-14 лет: 2-1 гып', sortOrder: 1 },
  { ageCategoryCode: '12_14_male', disciplineCode: 'hyong', beltMin: -1, beltMax: -1, name: 'Юноши 12-14 лет: 1 Дан', sortOrder: 2 },
  { ageCategoryCode: '12_14_male', disciplineCode: 'hyong', beltMin: -2, beltMax: -2, name: 'Юноши 12-14 лет: 2 Дан', sortOrder: 3 },
  { ageCategoryCode: '12_14_female', disciplineCode: 'hyong', beltMin: 2, beltMax: 1, name: 'Девушки 12-14 лет: 2-1 гып', sortOrder: 1 },
  { ageCategoryCode: '12_14_female', disciplineCode: 'hyong', beltMin: -1, beltMax: -1, name: 'Девушки 12-14 лет: 1 Дан', sortOrder: 2 },
  { ageCategoryCode: '12_14_female', disciplineCode: 'hyong', beltMin: -2, beltMax: -2, name: 'Девушки 12-14 лет: 2 Дан', sortOrder: 3 },

  // ЮНИОРЫ/ЮНИОРКИ 15-17 лет
  { ageCategoryCode: '15_17_male', disciplineCode: 'hyong', beltMin: 2, beltMax: 1, name: 'Юниоры 15-17 лет: 2-1 гып', sortOrder: 1 },
  { ageCategoryCode: '15_17_male', disciplineCode: 'hyong', beltMin: -1, beltMax: -1, name: 'Юниоры 15-17 лет: 1 Дан', sortOrder: 2 },
  { ageCategoryCode: '15_17_male', disciplineCode: 'hyong', beltMin: -2, beltMax: -2, name: 'Юниоры 15-17 лет: 2 Дан', sortOrder: 3 },
  { ageCategoryCode: '15_17_male', disciplineCode: 'hyong', beltMin: -3, beltMax: -3, name: 'Юниоры 15-17 лет: 3 Дан', sortOrder: 4 },
  { ageCategoryCode: '15_17_female', disciplineCode: 'hyong', beltMin: 2, beltMax: 1, name: 'Юниорки 15-17 лет: 2-1 гып', sortOrder: 1 },
  { ageCategoryCode: '15_17_female', disciplineCode: 'hyong', beltMin: -1, beltMax: -1, name: 'Юниорки 15-17 лет: 1 Дан', sortOrder: 2 },
  { ageCategoryCode: '15_17_female', disciplineCode: 'hyong', beltMin: -2, beltMax: -2, name: 'Юниорки 15-17 лет: 2 Дан', sortOrder: 3 },

  // МУЖЧИНЫ 18+
  { ageCategoryCode: '18_plus_male', disciplineCode: 'hyong', beltMin: -1, beltMax: -1, name: 'Мужчины: 1 Дан', sortOrder: 1 },
  { ageCategoryCode: '18_plus_male', disciplineCode: 'hyong', beltMin: -2, beltMax: -2, name: 'Мужчины: 2 Дан', sortOrder: 2 },
  { ageCategoryCode: '18_plus_male', disciplineCode: 'hyong', beltMin: -3, beltMax: -3, name: 'Мужчины: 3 Дан', sortOrder: 3 },
  { ageCategoryCode: '18_plus_male', disciplineCode: 'hyong', beltMin: -4, beltMax: -4, name: 'Мужчины: 4 Дан', sortOrder: 4 },
  { ageCategoryCode: '18_plus_male', disciplineCode: 'hyong', beltMin: -5, beltMax: -5, name: 'Мужчины: 5 Дан', sortOrder: 5 },
  { ageCategoryCode: '18_plus_male', disciplineCode: 'hyong', beltMin: -6, beltMax: -6, name: 'Мужчины: 6 Дан', sortOrder: 6 },

  // ЖЕНЩИНЫ 18+
  { ageCategoryCode: '18_plus_female', disciplineCode: 'hyong', beltMin: -1, beltMax: -1, name: 'Женщины: 1 Дан', sortOrder: 1 },
  { ageCategoryCode: '18_plus_female', disciplineCode: 'hyong', beltMin: -2, beltMax: -2, name: 'Женщины: 2 Дан', sortOrder: 2 },
  { ageCategoryCode: '18_plus_female', disciplineCode: 'hyong', beltMin: -3, beltMax: -3, name: 'Женщины: 3 Дан', sortOrder: 3 },
  { ageCategoryCode: '18_plus_female', disciplineCode: 'hyong', beltMin: -4, beltMax: -4, name: 'Женщины: 4 Дан', sortOrder: 4 },
  { ageCategoryCode: '18_plus_female', disciplineCode: 'hyong', beltMin: -5, beltMax: -5, name: 'Женщины: 5 Дан', sortOrder: 5 },
  { ageCategoryCode: '18_plus_female', disciplineCode: 'hyong', beltMin: -6, beltMax: -6, name: 'Женщины: 6 Дан', sortOrder: 6 },
]

// POST /api/superadmin/references/belt-categories/seed
export async function POST() {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all age categories and disciplines
    const ageCategories = await prisma.ageCategory.findMany()
    const disciplines = await prisma.discipline.findMany()

    const ageCategoryMap = new Map(ageCategories.map(a => [a.code, a.id]))
    const disciplineMap = new Map(disciplines.map(d => [d.code, d.id]))

    // Delete existing belt categories
    await prisma.beltCategory.deleteMany({})

    let created = 0
    let skipped = 0

    for (const seed of BELT_CATEGORIES_SEED) {
      const ageCategoryId = ageCategoryMap.get(seed.ageCategoryCode)
      const disciplineId = disciplineMap.get(seed.disciplineCode)

      if (!ageCategoryId || !disciplineId) {
        console.warn(`Skipping: age=${seed.ageCategoryCode} disc=${seed.disciplineCode} - not found`)
        skipped++
        continue
      }

      await prisma.beltCategory.create({
        data: {
          ageCategoryId,
          disciplineId,
          beltMin: seed.beltMin,
          beltMax: seed.beltMax,
          name: seed.name,
          sortOrder: seed.sortOrder,
          isActive: true,
        },
      })
      created++
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: BELT_CATEGORIES_SEED.length,
    })
  } catch (error) {
    console.error('Failed to seed belt categories:', error)
    return NextResponse.json({ error: 'Failed to seed belt categories' }, { status: 500 })
  }
}

// GET - show current seed data
export async function GET() {
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    message: 'POST to this endpoint to seed belt categories from GTF regulations',
    seedDataCount: BELT_CATEGORIES_SEED.length,
  })
}
