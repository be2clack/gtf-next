import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { queryMySQL, countMySQL } from '@/lib/mysql'
import { Prisma } from '@prisma/client'

// Base URL for Laravel uploads
const LARAVEL_BASE_URL = process.env.LARAVEL_BASE_URL || 'https://kg.gtf.global'

interface MigrationResult {
  success: boolean
  table: string
  migrated: number
  total: number
  error?: string
}

// Helper to convert MySQL dates
function toDate(val: string | Date | null): Date | null {
  if (!val) return null
  if (val instanceof Date) return val
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

// Helper to ensure JSON object for Prisma (returns undefined for null/undefined)
function toJson(val: unknown): Prisma.InputJsonValue | undefined {
  if (val === null || val === undefined) return undefined
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      return parsed as Prisma.InputJsonValue
    } catch {
      return { ru: val }
    }
  }
  return val as Prisma.InputJsonValue
}

// Helper to build full URL for uploads
function buildUploadUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${LARAVEL_BASE_URL}/uploads/${path}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { table, batchSize = 500, offset = 0 } = body

    const result = await migrateTable(table, batchSize, offset)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed'
    }, { status: 500 })
  }
}

async function migrateTable(table: string, batchSize: number, offset: number): Promise<MigrationResult> {
  switch (table) {
    case 'countries':
      return migrateCountries(batchSize, offset)
    case 'regions':
      return migrateRegions(batchSize, offset)
    case 'cities':
      return migrateCities(batchSize, offset)
    case 'federations':
      return migrateFederations(batchSize, offset)
    case 'clubs':
      return migrateClubs(batchSize, offset)
    case 'trainers':
      return migrateTrainers(batchSize, offset)
    case 'users':
      return migrateUsers(batchSize, offset)
    case 'sportsmen':
      return migrateSportsmen(batchSize, offset)
    case 'competitions':
      return migrateCompetitions(batchSize, offset)
    case 'news':
      return migrateNews(batchSize, offset)
    case 'disciplines':
      return migrateDisciplines(batchSize, offset)
    case 'age_categories':
      return migrateAgeCategories(batchSize, offset)
    case 'weight_categories':
      return migrateWeightCategories(batchSize, offset)
    case 'belt_categories':
      return migrateBeltCategories(batchSize, offset)
    case 'judges':
      return migrateJudges(batchSize, offset)
    case 'partners':
      return migratePartners(batchSize, offset)
    case 'sliders':
      return migrateSliders(batchSize, offset)
    case 'settings':
      return migrateSettings(batchSize, offset)
    default:
      return { success: false, table, migrated: 0, total: 0, error: `Unknown table: ${table}` }
  }
}

// Countries Migration
async function migrateCountries(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('countries')
  const rows = await queryMySQL<{
    id: number
    name_ru: string
    name_en: string
    code: string
    phone_code: string
    flag_emoji: string
    created_at: string
    updated_at: string
  }>(`SELECT * FROM countries ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  for (const row of rows) {
    try {
      await prisma.country.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          nameRu: row.name_ru || '',
          nameEn: row.name_en || '',
          code: row.code || '',
          phoneCode: row.phone_code || '',
          flagEmoji: row.flag_emoji || '',
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          nameRu: row.name_ru || '',
          nameEn: row.name_en || '',
          code: row.code || '',
          phoneCode: row.phone_code || '',
          flagEmoji: row.flag_emoji || '',
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating country ${row.id}:`, e)
    }
  }

  return { success: true, table: 'countries', migrated, total }
}

// Regions Migration
async function migrateRegions(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('regions')
  const rows = await queryMySQL<{
    id: number
    country_id: number
    name_ru: string
    name_en: string
    code: string
    created_at: string
    updated_at: string
  }>(`SELECT * FROM regions ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  for (const row of rows) {
    try {
      await prisma.region.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          countryId: row.country_id,
          nameRu: row.name_ru || '',
          nameEn: row.name_en || '',
          code: row.code || '',
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          nameRu: row.name_ru || '',
          nameEn: row.name_en || '',
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating region ${row.id}:`, e)
    }
  }

  return { success: true, table: 'regions', migrated, total }
}

// Cities Migration
async function migrateCities(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('cities')
  const rows = await queryMySQL<{
    id: number
    region_id: number
    name_ru: string
    name_en: string
    created_at: string
    updated_at: string
  }>(`SELECT * FROM cities ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  for (const row of rows) {
    try {
      await prisma.city.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          regionId: row.region_id,
          nameRu: row.name_ru || '',
          nameEn: row.name_en || '',
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          nameRu: row.name_ru || '',
          nameEn: row.name_en || '',
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating city ${row.id}:`, e)
    }
  }

  return { success: true, table: 'cities', migrated, total }
}

// Federations Migration
async function migrateFederations(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('federations')
  const rows = await queryMySQL<{
    id: number
    name: string
    code: string
    country_id: number
    description: string
    site_title: string
    logo: string
    hero_background_url: string
    domain: string
    settings: string
    status: string
    currency: string
    membership_fee: number
    registration_fee: number
    timezone: string
    created_at: string
    updated_at: string
  }>(`SELECT * FROM federations ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  for (const row of rows) {
    try {
      // Domain and countryId are required in the schema
      const domain = row.domain || row.code || `federation-${row.id}`
      const countryId = row.country_id || 1 // Default to country 1 if not set

      await prisma.federation.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: row.name || '',
          code: row.code || '',
          countryId,
          description: toJson(row.description),
          siteTitle: toJson(row.site_title),
          logo: buildUploadUrl(row.logo),
          heroBackground: buildUploadUrl(row.hero_background_url),
          domain,
          settings: toJson(row.settings),
          status: (row.status?.toUpperCase() || 'ACTIVE') as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
          currency: row.currency || 'KGS',
          timezone: row.timezone || 'Asia/Bishkek',
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          name: row.name || '',
          description: toJson(row.description),
          siteTitle: toJson(row.site_title),
          logo: buildUploadUrl(row.logo),
          heroBackground: buildUploadUrl(row.hero_background_url),
          settings: toJson(row.settings),
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating federation ${row.id}:`, e)
    }
  }

  return { success: true, table: 'federations', migrated, total }
}

// Clubs Migration
async function migrateClubs(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('clubs')
  const rows = await queryMySQL<{
    id: number
    federation_id: number
    title: string
    address: string
    description: string
    city_id: number
    region_id: number
    country_id: number
    logo: string
    instagram: string
    rating: number
    created_at: string
    updated_at: string
  }>(`SELECT * FROM clubs ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  for (const row of rows) {
    try {
      await prisma.club.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          federationId: row.federation_id || undefined,
          title: toJson(row.title),
          description: toJson(row.description),
          address: toJson(row.address),
          cityId: row.city_id || undefined,
          regionId: row.region_id || undefined,
          countryId: row.country_id || undefined,
          logo: buildUploadUrl(row.logo),
          instagram: row.instagram || undefined,
          rating: row.rating || 0,
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          title: toJson(row.title),
          description: toJson(row.description),
          logo: buildUploadUrl(row.logo),
          rating: row.rating || 0,
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating club ${row.id}:`, e)
    }
  }

  return { success: true, table: 'clubs', migrated, total }
}

// Trainers Migration
async function migrateTrainers(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('trainers')
  const rows = await queryMySQL<{
    id: number
    federation_id: number
    club_id: number
    first_name: string
    last_name: string
    middle_name: string
    first_name_en: string
    last_name_en: string
    photo: string
    phone: string
    date_of_birth: string
    rank: string
    country_id: number
    region_id: number
    city_id: number
    instagram: string
    ordering: number
    created_at: string
    updated_at: string
  }>(`SELECT * FROM trainers ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  type TrainerRank = 'HEAD_COACH' | 'SENIOR_COACH' | 'COACH' | 'ASSISTANT_COACH'
  const rankMap: Record<string, TrainerRank> = {
    'master': 'HEAD_COACH',
    'grand_master': 'HEAD_COACH',
    'coach': 'COACH',
    'senior_coach': 'SENIOR_COACH',
    'head_coach': 'HEAD_COACH',
    'assistant_coach': 'ASSISTANT_COACH'
  }

  for (const row of rows) {
    try {
      const rank: TrainerRank = rankMap[row.rank?.toLowerCase()] || 'COACH'
      const fio = [row.last_name, row.first_name, row.middle_name].filter(Boolean).join(' ')
      await prisma.trainer.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          federationId: row.federation_id || undefined,
          clubId: row.club_id || undefined,
          fio: fio || undefined,
          firstName: row.first_name || undefined,
          lastName: row.last_name || undefined,
          middleName: row.middle_name || undefined,
          firstNameLatin: row.first_name_en || undefined,
          lastNameLatin: row.last_name_en || undefined,
          photo: buildUploadUrl(row.photo),
          phone: row.phone || undefined,
          dateOfBirth: toDate(row.date_of_birth),
          rank,
          countryId: row.country_id || undefined,
          regionId: row.region_id || undefined,
          cityId: row.city_id || undefined,
          instagram: row.instagram || undefined,
          ordering: row.ordering || 0,
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          fio: fio || undefined,
          firstName: row.first_name || undefined,
          lastName: row.last_name || undefined,
          photo: buildUploadUrl(row.photo),
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating trainer ${row.id}:`, e)
    }
  }

  return { success: true, table: 'trainers', migrated, total }
}

// Users Migration
async function migrateUsers(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('users')
  const rows = await queryMySQL<{
    id: number
    name: string
    phone: string
    email: string
    login: string
    type: number
    federation_id: number
    telegram_chat_id: string
    telegram_username: string
    created_at: string
    updated_at: string
  }>(`SELECT * FROM users ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  type UserType = 'ADMIN' | 'JUDGE' | 'ARBITER' | 'SPORTSMAN' | 'REPRESENTATIVE' | 'TRAINER'
  // Type mapping: 1=SPORTSMAN, 2=TRAINER, 3=REPRESENTATIVE, 4=JUDGE, 5=ARBITER, 6=ADMIN
  const typeMap: Record<number, UserType> = {
    1: 'SPORTSMAN',
    2: 'TRAINER',
    3: 'REPRESENTATIVE',
    4: 'JUDGE',
    5: 'ARBITER',
    6: 'ADMIN'
  }

  for (const row of rows) {
    try {
      const userType: UserType = typeMap[row.type] || 'SPORTSMAN'
      await prisma.user.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: row.name || '',
          phone: row.phone || undefined,
          email: row.email || undefined,
          login: row.login || undefined,
          type: userType,
          federationId: row.federation_id || undefined,
          telegramChatId: row.telegram_chat_id || undefined,
          telegramUsername: row.telegram_username || undefined,
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          name: row.name || '',
          phone: row.phone || undefined,
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating user ${row.id}:`, e)
    }
  }

  return { success: true, table: 'users', migrated, total }
}

// Sportsmen Migration
async function migrateSportsmen(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('sportsmen')
  const rows = await queryMySQL<{
    id: number
    federation_id: number
    club_id: number
    trainer_id: number
    first_name: string
    last_name: string
    middle_name: string
    first_name_en: string
    last_name_en: string
    photo: string
    phone: string
    date_of_birth: string
    sex: number
    weight: number
    height: number
    gyp: number
    dan: number
    belt_level: number
    rating: number
    country_id: number
    region_id: number
    city_id: number
    instagram: string
    created_at: string
    updated_at: string
  }>(`SELECT * FROM sportsmen ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  for (const row of rows) {
    try {
      const fio = [row.last_name, row.first_name, row.middle_name].filter(Boolean).join(' ')
      await prisma.sportsman.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          federationId: row.federation_id || undefined,
          clubId: row.club_id || undefined,
          trainerId: row.trainer_id || undefined,
          fio: fio || undefined,
          firstName: row.first_name || undefined,
          lastName: row.last_name || undefined,
          middleName: row.middle_name || undefined,
          firstNameLatin: row.first_name_en || undefined,
          lastNameLatin: row.last_name_en || undefined,
          photo: buildUploadUrl(row.photo),
          phone: row.phone || undefined,
          dateOfBirth: toDate(row.date_of_birth),
          sex: row.sex || 0,
          weight: row.weight || undefined,
          height: row.height || undefined,
          gyp: row.gyp || 10,
          dan: row.dan || 0,
          beltLevel: row.belt_level || 10,
          rating: row.rating || 0,
          countryId: row.country_id || undefined,
          regionId: row.region_id || undefined,
          cityId: row.city_id || undefined,
          instagram: row.instagram || undefined,
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          fio: fio || undefined,
          firstName: row.first_name || undefined,
          lastName: row.last_name || undefined,
          photo: buildUploadUrl(row.photo),
          rating: row.rating || 0,
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating sportsman ${row.id}:`, e)
    }
  }

  return { success: true, table: 'sportsmen', migrated, total }
}

// Competitions Migration
async function migrateCompetitions(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('competitions')
  const rows = await queryMySQL<{
    id: number
    federation_id: number
    title: string
    description: string
    poster: string
    start_date: string
    end_date: string
    registration_deadline: string
    venue: string
    city_id: number
    country_id: number
    level: string
    type: string
    status: string
    is_paid: number
    base_registration_fee: number
    created_at: string
    updated_at: string
  }>(`SELECT * FROM competitions ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  const statusMap: Record<string, string> = {
    'draft': 'DRAFT',
    'published': 'PUBLISHED',
    'registration_open': 'REGISTRATION_OPEN',
    'registration_closed': 'REGISTRATION_CLOSED',
    'draw_completed': 'DRAW_COMPLETED',
    'ongoing': 'ONGOING',
    'in_progress': 'ONGOING',
    'completed': 'COMPLETED',
    'cancelled': 'CANCELLED'
  }

  type CompetitionStatus = 'DRAFT' | 'PUBLISHED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'DRAW_COMPLETED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  const typedStatusMap: Record<string, CompetitionStatus> = statusMap as Record<string, CompetitionStatus>

  for (const row of rows) {
    try {
      const startDate = toDate(row.start_date) || new Date()
      const endDate = toDate(row.end_date) || startDate
      const status: CompetitionStatus = typedStatusMap[row.status?.toLowerCase()] || 'DRAFT'

      await prisma.competition.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          federationId: row.federation_id || undefined,
          title: toJson(row.title),
          description: toJson(row.description),
          photo: buildUploadUrl(row.poster),
          startDate,
          endDate,
          registrationDeadline: toDate(row.registration_deadline) || undefined,
          venue: toJson(row.venue),
          cityId: row.city_id || undefined,
          countryId: row.country_id || undefined,
          status,
          isPaid: row.is_paid === 1,
          baseRegistrationFee: row.base_registration_fee ? new Prisma.Decimal(row.base_registration_fee) : undefined,
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          title: toJson(row.title),
          description: toJson(row.description),
          photo: buildUploadUrl(row.poster),
          status,
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating competition ${row.id}:`, e)
    }
  }

  return { success: true, table: 'competitions', migrated, total }
}

// News Migration
async function migrateNews(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('news')
  const rows = await queryMySQL<{
    id: number
    federation_id: number
    title: string
    description: string
    content: string
    photo: string
    is_published: number
    date: string
    ordering: number
    created_at: string
    updated_at: string
  }>(`SELECT * FROM news ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  for (const row of rows) {
    try {
      await prisma.news.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          federationId: row.federation_id || undefined,
          title: toJson(row.title),
          description: toJson(row.description),
          content: toJson(row.content),
          photo: buildUploadUrl(row.photo),
          published: row.is_published === 1,
          date: toDate(row.date) || undefined,
          ordering: row.ordering || 0,
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          title: toJson(row.title),
          description: toJson(row.description),
          content: toJson(row.content),
          photo: buildUploadUrl(row.photo),
          published: row.is_published === 1,
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating news ${row.id}:`, e)
    }
  }

  return { success: true, table: 'news', migrated, total }
}

// Disciplines Migration
async function migrateDisciplines(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('disciplines')
  const rows = await queryMySQL<{
    id: number
    code: string
    name: string
    name_ru: string
    name_en: string
    type: string
    description: string
    sort_order: number
    is_active: number
    created_at: string
    updated_at: string
  }>(`SELECT * FROM disciplines ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  type DisciplineType = 'HYONG' | 'MASSOGI' | 'POINT_STOP' | 'TEAM_HYONG' | 'TEAM_MASSOGI' | 'TEAM_POINT_STOP' | 'SPECIAL_TECHNIQUE' | 'POWER_BREAKING'
  const typeMap: Record<string, DisciplineType> = {
    'hyong': 'HYONG',
    'tul': 'HYONG',
    'massogi': 'MASSOGI',
    'sparring': 'MASSOGI',
    'point_stop': 'POINT_STOP',
    'point': 'POINT_STOP',
    'team_hyong': 'TEAM_HYONG',
    'team_massogi': 'TEAM_MASSOGI',
    'team_point_stop': 'TEAM_POINT_STOP',
    'special_technique': 'SPECIAL_TECHNIQUE',
    'power_breaking': 'POWER_BREAKING'
  }

  for (const row of rows) {
    try {
      const code = row.code || row.name?.toLowerCase().replace(/\s+/g, '_') || `discipline_${row.id}`
      const disciplineType: DisciplineType = typeMap[row.type?.toLowerCase()] || 'MASSOGI'

      await prisma.discipline.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          code,
          name: row.name || '',
          nameRu: row.name_ru || undefined,
          nameEn: row.name_en || undefined,
          type: disciplineType,
          description: row.description || undefined,
          sortOrder: row.sort_order || 0,
          isActive: row.is_active === 1,
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          name: row.name || '',
          nameRu: row.name_ru || undefined,
          nameEn: row.name_en || undefined,
          isActive: row.is_active === 1,
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating discipline ${row.id}:`, e)
    }
  }

  return { success: true, table: 'disciplines', migrated, total }
}

// Age Categories Migration
async function migrateAgeCategories(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('age_categories')
  const rows = await queryMySQL<{
    id: number
    code: string
    name_ru: string
    name_en: string
    min_age: number
    max_age: number
    created_at: string
    updated_at: string
  }>(`SELECT * FROM age_categories ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  for (const row of rows) {
    try {
      const code = row.code || `age_${row.id}`
      await prisma.ageCategory.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          code,
          nameRu: row.name_ru || undefined,
          nameEn: row.name_en || undefined,
          minAge: row.min_age || 0,
          maxAge: row.max_age || 99,
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          nameRu: row.name_ru || undefined,
          nameEn: row.name_en || undefined,
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating age category ${row.id}:`, e)
    }
  }

  return { success: true, table: 'age_categories', migrated, total }
}

// Weight Categories Migration
async function migrateWeightCategories(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('weight_categories')
  const rows = await queryMySQL<{
    id: number
    age_category_id: number
    discipline_id: number
    name: string
    min_weight: number
    max_weight: number
    gender: string
    sort_order: number
    is_active: number
    created_at: string
    updated_at: string
  }>(`SELECT * FROM weight_categories ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  type Gender = 'MALE' | 'FEMALE' | 'MIXED'
  const genderMap: Record<string, Gender> = {
    'male': 'MALE',
    'm': 'MALE',
    'female': 'FEMALE',
    'f': 'FEMALE',
    'mixed': 'MIXED'
  }

  for (const row of rows) {
    try {
      // Generate code from name and id
      const code = `wc_${row.id}`
      const gender: Gender = genderMap[row.gender?.toLowerCase()] || 'MALE'

      const minWeight = parseFloat(String(row.min_weight)) || 0
      const maxWeight = parseFloat(String(row.max_weight)) || 200

      await prisma.weightCategory.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          disciplineId: row.discipline_id || undefined,
          code,
          name: row.name || '',
          minWeight,
          maxWeight,
          gender,
          isActive: row.is_active === 1,
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          name: row.name || '',
          minWeight,
          maxWeight,
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating weight category ${row.id}:`, e)
    }
  }

  return { success: true, table: 'weight_categories', migrated, total }
}

// Belt Categories Migration
async function migrateBeltCategories(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('belt_categories')
  const rows = await queryMySQL<{
    id: number
    code: string
    name: string
    name_ru: string
    name_en: string
    min_level: number
    max_level: number
    is_active: number
    created_at: string
    updated_at: string
  }>(`SELECT * FROM belt_categories ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  for (const row of rows) {
    try {
      const code = row.code || `belt_${row.id}`
      const name = row.name || row.name_ru || row.name_en || ''

      await prisma.beltCategory.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          code,
          name,
          minLevel: row.min_level || 0,
          maxLevel: row.max_level || 99,
          isActive: row.is_active === 1,
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          name,
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating belt category ${row.id}:`, e)
    }
  }

  return { success: true, table: 'belt_categories', migrated, total }
}

// Judges Migration
async function migrateJudges(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('judges')
  const rows = await queryMySQL<{
    id: number
    federation_id: number
    first_name: string
    last_name: string
    middle_name: string
    photo: string
    phone: string
    email: string
    country_id: number
    region_id: number
    city_id: number
    category: string
    is_active: number
    created_at: string
    updated_at: string
  }>(`SELECT * FROM judges ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  type JudgeCategoryType = 'INTERNATIONAL' | 'NATIONAL' | 'REGIONAL'
  const categoryMap: Record<string, JudgeCategoryType> = {
    'international': 'INTERNATIONAL',
    'national': 'NATIONAL',
    'regional': 'REGIONAL',
    'local': 'REGIONAL'
  }

  for (const row of rows) {
    try {
      const judgeCategory: JudgeCategoryType = categoryMap[row.category?.toLowerCase()] || 'NATIONAL'

      await prisma.judge.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          federationId: row.federation_id || undefined,
          firstName: row.first_name || '',
          lastName: row.last_name || '',
          patronymic: row.middle_name || undefined,
          photo: buildUploadUrl(row.photo),
          phone: row.phone || undefined,
          email: row.email || undefined,
          countryId: row.country_id || undefined,
          regionId: row.region_id || undefined,
          cityId: row.city_id || undefined,
          judgeCategory,
          isActive: row.is_active === 1,
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          firstName: row.first_name || '',
          lastName: row.last_name || '',
          photo: buildUploadUrl(row.photo),
          isActive: row.is_active === 1,
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating judge ${row.id}:`, e)
    }
  }

  return { success: true, table: 'judges', migrated, total }
}

// Partners Migration
async function migratePartners(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('partners')
  const rows = await queryMySQL<{
    id: number
    federation_id: number
    name: string
    logo: string
    url: string
    description: string
    sort_order: number
    is_active: number
    created_at: string
    updated_at: string
  }>(`SELECT * FROM partners ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  for (const row of rows) {
    try {
      await prisma.partner.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          federationId: row.federation_id || undefined,
          name: row.name || '',
          logo: buildUploadUrl(row.logo),
          url: row.url || undefined,
          description: row.description || undefined,
          sortOrder: row.sort_order || 0,
          isActive: row.is_active === 1,
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          name: row.name || '',
          logo: buildUploadUrl(row.logo),
          isActive: row.is_active === 1,
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating partner ${row.id}:`, e)
    }
  }

  return { success: true, table: 'partners', migrated, total }
}

// Sliders Migration
async function migrateSliders(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('sliders')
  const rows = await queryMySQL<{
    id: number
    title: string
    subtitle: string
    image: string
    link: string
    sort_order: number
    is_active: number
    created_at: string
    updated_at: string
  }>(`SELECT * FROM sliders ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  for (const row of rows) {
    try {
      await prisma.slider.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          title: row.title || undefined,
          subtitle: row.subtitle || undefined,
          image: buildUploadUrl(row.image),
          link: row.link || undefined,
          sortOrder: row.sort_order || 0,
          isActive: row.is_active === 1,
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          title: row.title || undefined,
          subtitle: row.subtitle || undefined,
          image: buildUploadUrl(row.image),
          isActive: row.is_active === 1,
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating slider ${row.id}:`, e)
    }
  }

  return { success: true, table: 'sliders', migrated, total }
}

// Settings Migration
async function migrateSettings(batchSize: number, offset: number): Promise<MigrationResult> {
  const total = await countMySQL('settings')
  const rows = await queryMySQL<{
    id: number
    federation_id: number
    key: string
    value: string
    created_at: string
    updated_at: string
  }>(`SELECT * FROM settings ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`)

  let migrated = 0
  for (const row of rows) {
    try {
      await prisma.setting.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          federationId: row.federation_id,
          key: row.key || '',
          value: row.value || '',
          createdAt: toDate(row.created_at) || new Date(),
          updatedAt: toDate(row.updated_at) || new Date(),
        },
        update: {
          value: row.value || '',
        }
      })
      migrated++
    } catch (e) {
      console.error(`Error migrating setting ${row.id}:`, e)
    }
  }

  return { success: true, table: 'settings', migrated, total }
}
