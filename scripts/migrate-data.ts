import mysql from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// MySQL connection config (Laravel database)
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'gtf',
};

async function migrateData() {
  console.log('🚀 Starting data migration from MySQL to PostgreSQL...');
  console.log('MySQL Config:', { ...mysqlConfig, password: '***' });
  
  const mysql_conn = await mysql.createConnection(mysqlConfig);
  
  try {
    // 1. Migrate Countries
    console.log('\n📍 Migrating countries...');
    const [countries] = await mysql_conn.query('SELECT * FROM countries') as any;
    for (const c of countries) {
      await prisma.country.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          code: c.code || '',
          nameRu: c.name_ru || c.name || '',
          nameEn: c.name_en || c.name || '',
          nameKg: c.name_kg,
          flagEmoji: c.flag_emoji,
          phoneCode: c.phone_code,
          isActive: c.is_active === 1,
        },
      });
    }
    console.log(`  ✓ Migrated ${countries.length} countries`);

    // 2. Migrate Regions
    console.log('\n📍 Migrating regions...');
    const [regions] = await mysql_conn.query('SELECT * FROM regions') as any;
    for (const r of regions) {
      // Parse title from JSON if possible, otherwise use as-is
      let titleStr: string | null = null;
      try {
        const parsed = r.title ? JSON.parse(r.title) : null;
        titleStr = parsed?.ru || parsed?.en || r.title || null;
      } catch { titleStr = r.title || null; }

      await prisma.region.upsert({
        where: { id: r.id },
        update: {},
        create: {
          id: r.id,
          countryId: r.country_id,
          code: r.code || '',
          title: titleStr,
          isActive: r.is_active === 1,
        },
      });
    }
    console.log(`  ✓ Migrated ${regions.length} regions`);

    // 3. Migrate Cities
    console.log('\n📍 Migrating cities...');
    const [cities] = await mysql_conn.query('SELECT * FROM cities') as any;
    for (const c of cities) {
      await prisma.city.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          regionId: c.region_id,
          nameRu: c.name_ru || c.name || '',
          nameEn: c.name_en,
          nameKg: c.name_kg,
          isActive: c.is_active === 1,
          isCapital: c.is_capital === 1,
        },
      });
    }
    console.log(`  ✓ Migrated ${cities.length} cities`);

    // 4. Migrate Federations
    console.log('\n🏛️ Migrating federations...');
    const [federations] = await mysql_conn.query('SELECT * FROM federations') as any;
    for (const f of federations) {
      await prisma.federation.upsert({
        where: { id: f.id },
        update: {},
        create: {
          id: f.id,
          countryId: f.country_id,
          code: f.code || '',
          name: f.name || '',
          nameEn: f.name_en,
          fullName: safeJsonParse(f.full_name),
          domain: f.domain || '',
          customDomain: f.custom_domain,
          logo: f.logo,
          heroBackground: f.hero_background,
          description: safeJsonParse(f.description),
          siteTitle: safeJsonParse(f.site_title),
          metaDescription: safeJsonParse(f.meta_description),
          timezone: f.timezone || 'Asia/Bishkek',
          currency: f.currency || 'KGS',
          languages: safeJsonParse(f.languages) || ['ru'],
          primaryLanguage: f.primary_language || 'ru',
          contactEmail: f.contact_email,
          contactPhone: f.contact_phone,
          instagram: f.instagram,
          facebook: f.facebook,
          youtube: f.youtube,
          status: f.status || 'ACTIVE',
          settings: safeJsonParse(f.settings) || {},
        },
      });
    }
    console.log(`  ✓ Migrated ${federations.length} federations`);

    // 5. Migrate Clubs
    console.log('\n🏫 Migrating clubs...');
    const [clubs] = await mysql_conn.query('SELECT * FROM clubs') as any;
    for (const c of clubs) {
      await prisma.club.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          federationId: c.federation_id,
          title: safeJsonParse(c.title) || { ru: c.name || '' },
          description: safeJsonParse(c.description),
          logo: c.logo,
          address: safeJsonParse(c.address),
          instagram: c.instagram,
          rating: c.rating || 0,
          countryId: c.country_id,
          regionId: c.region_id,
          cityId: c.city_id,
        },
      });
    }
    console.log(`  ✓ Migrated ${clubs.length} clubs`);

    // 6. Migrate Trainers
    console.log('\n👨‍🏫 Migrating trainers...');
    const [trainers] = await mysql_conn.query('SELECT * FROM trainers') as any;
    for (const t of trainers) {
      await prisma.trainer.upsert({
        where: { id: t.id },
        update: {},
        create: {
          id: t.id,
          federationId: t.federation_id,
          fio: t.fio,
          lastName: t.last_name,
          firstName: t.first_name,
          middleName: t.middle_name,
          phone: t.phone,
          photo: t.photo,
          clubId: t.club_id,
          countryId: t.country_id,
          regionId: t.region_id,
          cityId: t.city_id,
          instagram: t.instagram,
          dateOfBirth: t.date_of_birth ? new Date(t.date_of_birth) : null,
          rank: mapTrainerRank(t.rank),
        },
      });
    }
    console.log(`  ✓ Migrated ${trainers.length} trainers`);

    // 7. Migrate Sportsmen
    console.log('\n🥋 Migrating sportsmen...');
    const [sportsmen] = await mysql_conn.query('SELECT * FROM sportsmen') as any;
    for (const s of sportsmen) {
      await prisma.sportsman.upsert({
        where: { id: s.id },
        update: {},
        create: {
          id: s.id,
          federationId: s.federation_id,
          fio: s.fio,
          lastName: s.last_name,
          firstName: s.first_name,
          middleName: s.middle_name,
          firstNameLatin: s.first_name_latin,
          lastNameLatin: s.last_name_latin,
          photo: s.photo,
          dateOfBirth: s.date_of_birth ? new Date(s.date_of_birth) : null,
          sex: s.sex || 1,
          iin: s.iin,
          phone: s.phone,
          clubId: s.club_id,
          trainerId: s.trainer_id,
          countryId: s.country_id,
          regionId: s.region_id,
          cityId: s.city_id,
          weight: s.weight ? parseFloat(s.weight) : null,
          height: s.height ? parseInt(s.height) : null,
          gyp: s.gyp,
          dan: s.dan,
          instagram: s.instagram,
          rating: s.rating || 0,
        },
      });
    }
    console.log(`  ✓ Migrated ${sportsmen.length} sportsmen`);

    // 8. Migrate Users
    console.log('\n👤 Migrating users...');
    const [users] = await mysql_conn.query('SELECT * FROM users') as any;
    for (const u of users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          name: u.name || '',
          email: u.email,
          emailVerifiedAt: u.email_verified_at ? new Date(u.email_verified_at) : null,
          phone: u.phone,
          type: mapUserType(u.type),
          federationId: u.federation_id,
          telegramChatId: u.telegram_chat_id,
          telegramUsername: u.telegram_username,
        },
      });
    }
    console.log(`  ✓ Migrated ${users.length} users`);

    // 9. Migrate Competitions
    console.log('\n🏆 Migrating competitions...');
    const [competitions] = await mysql_conn.query('SELECT * FROM competitions') as any;
    for (const c of competitions) {
      await prisma.competition.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          federationId: c.federation_id,
          title: safeJsonParse(c.title) || { ru: c.name || '' },
          description: safeJsonParse(c.description),
          photo: c.photo,
          venue: safeJsonParse(c.venue),
          countryId: c.country_id,
          regionId: c.region_id,
          cityId: c.city_id,
          startDate: new Date(c.start_date || c.date_from || new Date()),
          endDate: new Date(c.end_date || c.date_to || new Date()),
          registrationDeadline: c.registration_deadline ? new Date(c.registration_deadline) : null,
          status: mapCompetitionStatus(c.status),
          type: c.type || 'MIXED',
          level: c.level || 'NATIONAL',
          isPaid: c.is_paid === 1,
          entryFee: c.entry_fee,
        },
      });
    }
    console.log(`  ✓ Migrated ${competitions.length} competitions`);

    console.log('\n✅ Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await mysql_conn.end();
    await prisma.$disconnect();
  }
}

function safeJsonParse(value: string | null | undefined): any {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function mapUserType(type: string | null): 'ADMIN' | 'JUDGE' | 'ARBITER' | 'SPORTSMAN' | 'REPRESENTATIVE' | 'TRAINER' {
  const typeMap: Record<string, 'ADMIN' | 'JUDGE' | 'ARBITER' | 'SPORTSMAN' | 'REPRESENTATIVE' | 'TRAINER'> = {
    'admin': 'ADMIN',
    'judge': 'JUDGE',
    'arbiter': 'ARBITER',
    'sportsman': 'SPORTSMAN',
    'representative': 'REPRESENTATIVE',
    'trainer': 'TRAINER',
    'user': 'SPORTSMAN',
  };
  return typeMap[type?.toLowerCase() || ''] || 'ADMIN';
}

function mapTrainerRank(rank: string | null): 'COACH' | 'SENIOR_COACH' | 'HEAD_COACH' | 'ASSISTANT_COACH' {
  const rankMap: Record<string, 'COACH' | 'SENIOR_COACH' | 'HEAD_COACH' | 'ASSISTANT_COACH'> = {
    'coach': 'COACH',
    'senior_coach': 'SENIOR_COACH',
    'head_coach': 'HEAD_COACH',
    'assistant_coach': 'ASSISTANT_COACH',
    'master': 'HEAD_COACH',
    'grand_master': 'HEAD_COACH',
  };
  return rankMap[rank?.toLowerCase() || ''] || 'COACH';
}

function mapCompetitionStatus(status: string | null): 'DRAFT' | 'PUBLISHED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'DRAW_COMPLETED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' {
  const statusMap: Record<string, 'DRAFT' | 'PUBLISHED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'DRAW_COMPLETED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'> = {
    'draft': 'DRAFT',
    'published': 'PUBLISHED',
    'registration_open': 'REGISTRATION_OPEN',
    'registration_closed': 'REGISTRATION_CLOSED',
    'draw_completed': 'DRAW_COMPLETED',
    'in_progress': 'ONGOING',
    'ongoing': 'ONGOING',
    'completed': 'COMPLETED',
    'cancelled': 'CANCELLED',
  };
  return statusMap[status?.toLowerCase() || ''] || 'DRAFT';
}

migrateData().catch(console.error);