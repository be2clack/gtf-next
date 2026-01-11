/**
 * Script to migrate images from gtf.global to Vercel Blob Storage
 *
 * Prerequisites:
 * 1. Set BLOB_READ_WRITE_TOKEN environment variable
 * 2. Run: npx tsx scripts/migrate-images-to-blob.ts
 *
 * Usage:
 *   npx tsx scripts/migrate-images-to-blob.ts [--dry-run] [--type=<type>]
 *
 * Options:
 *   --dry-run    Preview what would be migrated without making changes
 *   --type       Migrate specific type: sportsmen, trainers, clubs, federations, news, judges
 */

import 'dotenv/config';
import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create Prisma client with pg adapter
const directUrl = process.env.DIRECT_DATABASE_URL;
if (!directUrl) {
  throw new Error('DIRECT_DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString: directUrl, max: 5 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PRODUCTION_URL = 'https://gtf.global';
const BATCH_SIZE = 10; // Process images in batches to avoid rate limits

interface MigrationResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

type ImageType = 'sportsmen' | 'trainers' | 'clubs' | 'federations' | 'news' | 'judges' | 'all';

/**
 * Fix subdomain URLs - kg.gtf.global, kz.gtf.global, etc. -> gtf.global
 */
function normalizeUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http')) {
    return url.replace(/https?:\/\/\w+\.gtf\.global\//, `${PRODUCTION_URL}/`);
  }
  return url;
}

/**
 * Build full URL for an image path
 * Handles various path formats stored in database:
 * - Full URLs: https://gtf.global/uploads/sportsman/xxx.jpg
 * - Relative with dir: uploads/sportsman/xxx.jpg
 * - Just filename: xxx.jpg (need to add directory)
 */
function buildFullUrl(photo: string | null, directory: string): string | null {
  if (!photo) return null;

  const normalized = normalizeUrl(photo);
  if (!normalized) return null;

  // Already a full URL
  if (normalized.startsWith('http')) {
    // Check if URL already has proper directory structure
    if (normalized.includes(`/uploads/${directory}/`) || normalized.includes(`/storage/${directory}/`)) {
      return normalized;
    }
    // URL exists but without directory - try to fix common patterns
    // e.g. https://gtf.global/uploads/xxx.jpg -> https://gtf.global/uploads/sportsman/xxx.jpg
    const match = normalized.match(/\/uploads\/([^/]+\.(jpg|jpeg|png|gif|webp))$/i);
    if (match) {
      return normalized.replace(/\/uploads\/([^/]+\.(jpg|jpeg|png|gif|webp))$/i, `/uploads/${directory}/$1`);
    }
    return normalized;
  }

  // Relative path with directory already included
  if (normalized.includes('/')) {
    return `${PRODUCTION_URL}/${normalized}`;
  }

  // Just filename - add directory
  return `${PRODUCTION_URL}/uploads/${directory}/${normalized}`;
}

/**
 * Download image from URL and upload to Vercel Blob
 */
async function migrateImage(
  sourceUrl: string,
  blobPath: string,
  dryRun: boolean
): Promise<{ newUrl: string | null; error?: string }> {
  try {
    if (dryRun) {
      console.log(`    [DRY-RUN] Would migrate: ${sourceUrl} -> ${blobPath}`);
      return { newUrl: `https://blob.vercel-storage.com/${blobPath}` };
    }

    // Download image from gtf.global
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      return { newUrl: null, error: `Failed to fetch: ${response.status} ${response.statusText}` };
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    // Upload to Vercel Blob
    const blob = await put(blobPath, Buffer.from(buffer), {
      access: 'public',
      contentType,
    });

    return { newUrl: blob.url };
  } catch (error) {
    return { newUrl: null, error: String(error) };
  }
}

/**
 * Process items in batches
 */
async function processBatch<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  batchSize: number = BATCH_SIZE
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(processor));
    if (i + batchSize < items.length) {
      // Small delay between batches to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

/**
 * Migrate sportsmen photos
 */
async function migrateSportsmenPhotos(dryRun: boolean): Promise<MigrationResult> {
  console.log('\n👤 Migrating sportsmen photos...');
  const result: MigrationResult = { success: 0, failed: 0, skipped: 0, errors: [] };

  const sportsmen = await prisma.sportsman.findMany({
    where: {
      photo: { not: null },
      NOT: { photo: { startsWith: 'https://blob' } }, // Skip already migrated
    },
    select: { id: true, photo: true, firstName: true, lastName: true },
  });

  console.log(`  Found ${sportsmen.length} sportsmen with photos to migrate`);

  await processBatch(sportsmen, async (s) => {
    const sourceUrl = buildFullUrl(s.photo, 'sportsman');
    if (!sourceUrl) {
      result.skipped++;
      return;
    }

    const ext = sourceUrl.split('.').pop() || 'jpg';
    const blobPath = `sportsmen/${s.id}.${ext}`;

    const { newUrl, error } = await migrateImage(sourceUrl, blobPath, dryRun);

    if (newUrl) {
      if (!dryRun) {
        await prisma.sportsman.update({
          where: { id: s.id },
          data: { photo: newUrl },
        });
      }
      result.success++;
      console.log(`  ✓ ${s.lastName} ${s.firstName} (${s.id})`);
    } else {
      result.failed++;
      result.errors.push(`Sportsman ${s.id}: ${error}`);
      console.log(`  ✗ ${s.lastName} ${s.firstName} (${s.id}): ${error}`);
    }
  });

  return result;
}

/**
 * Migrate trainer photos
 */
async function migrateTrainerPhotos(dryRun: boolean): Promise<MigrationResult> {
  console.log('\n🏋️ Migrating trainer photos...');
  const result: MigrationResult = { success: 0, failed: 0, skipped: 0, errors: [] };

  const trainers = await prisma.trainer.findMany({
    where: {
      photo: { not: null },
      NOT: { photo: { startsWith: 'https://blob' } },
    },
    select: { id: true, photo: true, firstName: true, lastName: true },
  });

  console.log(`  Found ${trainers.length} trainers with photos to migrate`);

  await processBatch(trainers, async (t) => {
    const sourceUrl = buildFullUrl(t.photo, 'trainer');
    if (!sourceUrl) {
      result.skipped++;
      return;
    }

    const ext = sourceUrl.split('.').pop() || 'jpg';
    const blobPath = `trainers/${t.id}.${ext}`;

    const { newUrl, error } = await migrateImage(sourceUrl, blobPath, dryRun);

    if (newUrl) {
      if (!dryRun) {
        await prisma.trainer.update({
          where: { id: t.id },
          data: { photo: newUrl },
        });
      }
      result.success++;
      console.log(`  ✓ ${t.lastName} ${t.firstName} (${t.id})`);
    } else {
      result.failed++;
      result.errors.push(`Trainer ${t.id}: ${error}`);
      console.log(`  ✗ ${t.lastName} ${t.firstName} (${t.id}): ${error}`);
    }
  });

  return result;
}

/**
 * Migrate club logos
 */
async function migrateClubLogos(dryRun: boolean): Promise<MigrationResult> {
  console.log('\n🏢 Migrating club logos...');
  const result: MigrationResult = { success: 0, failed: 0, skipped: 0, errors: [] };

  const clubs = await prisma.club.findMany({
    where: {
      logo: { not: null },
      NOT: { logo: { startsWith: 'https://blob' } },
    },
    select: { id: true, logo: true, title: true },
  });

  console.log(`  Found ${clubs.length} clubs with logos to migrate`);

  await processBatch(clubs, async (c) => {
    const sourceUrl = buildFullUrl(c.logo, 'club');
    if (!sourceUrl) {
      result.skipped++;
      return;
    }

    const ext = sourceUrl.split('.').pop() || 'png';
    const blobPath = `clubs/${c.id}.${ext}`;
    const title = (c.title as Record<string, string>)?.ru || `Club ${c.id}`;

    const { newUrl, error } = await migrateImage(sourceUrl, blobPath, dryRun);

    if (newUrl) {
      if (!dryRun) {
        await prisma.club.update({
          where: { id: c.id },
          data: { logo: newUrl },
        });
      }
      result.success++;
      console.log(`  ✓ ${title} (${c.id})`);
    } else {
      result.failed++;
      result.errors.push(`Club ${c.id}: ${error}`);
      console.log(`  ✗ ${title} (${c.id}): ${error}`);
    }
  });

  return result;
}

/**
 * Migrate federation logos
 */
async function migrateFederationLogos(dryRun: boolean): Promise<MigrationResult> {
  console.log('\n🏛️ Migrating federation logos...');
  const result: MigrationResult = { success: 0, failed: 0, skipped: 0, errors: [] };

  const federations = await prisma.federation.findMany({
    where: {
      logo: { not: null },
      NOT: { logo: { startsWith: 'https://blob' } },
    },
    select: { id: true, logo: true, name: true, code: true },
  });

  console.log(`  Found ${federations.length} federations with logos to migrate`);

  await processBatch(federations, async (f) => {
    const sourceUrl = buildFullUrl(f.logo, 'federations');
    if (!sourceUrl) {
      result.skipped++;
      return;
    }

    const ext = sourceUrl.split('.').pop() || 'png';
    const blobPath = `federations/${f.code || f.id}.${ext}`;

    const { newUrl, error } = await migrateImage(sourceUrl, blobPath, dryRun);

    if (newUrl) {
      if (!dryRun) {
        await prisma.federation.update({
          where: { id: f.id },
          data: { logo: newUrl },
        });
      }
      result.success++;
      console.log(`  ✓ ${f.name} (${f.code})`);
    } else {
      result.failed++;
      result.errors.push(`Federation ${f.id}: ${error}`);
      console.log(`  ✗ ${f.name} (${f.code}): ${error}`);
    }
  });

  return result;
}

/**
 * Migrate news photos
 */
async function migrateNewsPhotos(dryRun: boolean): Promise<MigrationResult> {
  console.log('\n📰 Migrating news photos...');
  const result: MigrationResult = { success: 0, failed: 0, skipped: 0, errors: [] };

  const news = await prisma.news.findMany({
    where: {
      photo: { not: null },
      NOT: { photo: { startsWith: 'https://blob' } },
    },
    select: { id: true, photo: true, title: true },
  });

  console.log(`  Found ${news.length} news items with photos to migrate`);

  await processBatch(news, async (n) => {
    const sourceUrl = buildFullUrl(n.photo, 'news');
    if (!sourceUrl) {
      result.skipped++;
      return;
    }

    const ext = sourceUrl.split('.').pop() || 'jpg';
    const blobPath = `news/${n.id}.${ext}`;
    const title = (n.title as Record<string, string>)?.ru || `News ${n.id}`;

    const { newUrl, error } = await migrateImage(sourceUrl, blobPath, dryRun);

    if (newUrl) {
      if (!dryRun) {
        await prisma.news.update({
          where: { id: n.id },
          data: { photo: newUrl },
        });
      }
      result.success++;
      console.log(`  ✓ ${title.substring(0, 50)}... (${n.id})`);
    } else {
      result.failed++;
      result.errors.push(`News ${n.id}: ${error}`);
      console.log(`  ✗ ${title.substring(0, 50)}... (${n.id}): ${error}`);
    }
  });

  return result;
}

/**
 * Migrate judge photos
 */
async function migrateJudgePhotos(dryRun: boolean): Promise<MigrationResult> {
  console.log('\n⚖️ Migrating judge photos...');
  const result: MigrationResult = { success: 0, failed: 0, skipped: 0, errors: [] };

  const judges = await prisma.judge.findMany({
    where: {
      photo: { not: null },
      NOT: { photo: { startsWith: 'https://blob' } },
    },
    select: { id: true, photo: true, firstName: true, lastName: true },
  });

  console.log(`  Found ${judges.length} judges with photos to migrate`);

  await processBatch(judges, async (j) => {
    const sourceUrl = buildFullUrl(j.photo, 'judges');
    if (!sourceUrl) {
      result.skipped++;
      return;
    }

    const ext = sourceUrl.split('.').pop() || 'jpg';
    const blobPath = `judges/${j.id}.${ext}`;

    const { newUrl, error } = await migrateImage(sourceUrl, blobPath, dryRun);

    if (newUrl) {
      if (!dryRun) {
        await prisma.judge.update({
          where: { id: j.id },
          data: { photo: newUrl },
        });
      }
      result.success++;
      console.log(`  ✓ ${j.lastName} ${j.firstName} (${j.id})`);
    } else {
      result.failed++;
      result.errors.push(`Judge ${j.id}: ${error}`);
      console.log(`  ✗ ${j.lastName} ${j.firstName} (${j.id}): ${error}`);
    }
  });

  return result;
}

/**
 * Main migration function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const typeArg = args.find(a => a.startsWith('--type='));
  const type: ImageType = (typeArg?.split('=')[1] as ImageType) || 'all';

  console.log('🚀 Starting image migration to Vercel Blob Storage');
  console.log(`   Mode: ${dryRun ? 'DRY-RUN (no changes will be made)' : 'LIVE'}`);
  console.log(`   Type: ${type}`);

  if (!process.env.BLOB_READ_WRITE_TOKEN && !dryRun) {
    console.error('\n❌ Error: BLOB_READ_WRITE_TOKEN environment variable is required');
    console.log('   Get it from: https://vercel.com/dashboard/stores');
    process.exit(1);
  }

  const results: Record<string, MigrationResult> = {};

  if (type === 'all' || type === 'sportsmen') {
    results.sportsmen = await migrateSportsmenPhotos(dryRun);
  }
  if (type === 'all' || type === 'trainers') {
    results.trainers = await migrateTrainerPhotos(dryRun);
  }
  if (type === 'all' || type === 'clubs') {
    results.clubs = await migrateClubLogos(dryRun);
  }
  if (type === 'all' || type === 'federations') {
    results.federations = await migrateFederationLogos(dryRun);
  }
  if (type === 'all' || type === 'news') {
    results.news = await migrateNewsPhotos(dryRun);
  }
  if (type === 'all' || type === 'judges') {
    results.judges = await migrateJudgePhotos(dryRun);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(50));

  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const [key, value] of Object.entries(results)) {
    console.log(`\n${key.toUpperCase()}:`);
    console.log(`  ✓ Success: ${value.success}`);
    console.log(`  ✗ Failed: ${value.failed}`);
    console.log(`  ⊘ Skipped: ${value.skipped}`);
    totalSuccess += value.success;
    totalFailed += value.failed;
    totalSkipped += value.skipped;

    if (value.errors.length > 0) {
      console.log('  Errors:');
      value.errors.slice(0, 5).forEach(e => console.log(`    - ${e}`));
      if (value.errors.length > 5) {
        console.log(`    ... and ${value.errors.length - 5} more`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('TOTAL:');
  console.log(`  ✓ Success: ${totalSuccess}`);
  console.log(`  ✗ Failed: ${totalFailed}`);
  console.log(`  ⊘ Skipped: ${totalSkipped}`);
  console.log('='.repeat(50));

  if (dryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to actually migrate.');
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (error) => {
  console.error('Migration failed:', error);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
