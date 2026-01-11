import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Competition photo mappings from Laravel (games table)
// These are the actual photo filenames from /uploads/games/
const competitionPhotos: Record<number, string> = {
  // Add mappings: competitionId -> photo filename
  // Example: 34: '095803ed3f843429c5586e4648a365ba.jpg'
}

// News photo mappings from Laravel (news table)
const newsPhotos: Record<number, string> = {
  // Add mappings: newsId -> photo filename
}

export async function POST(request: Request) {
  try {
    const { secret, type } = await request.json()

    // Simple security check
    if (secret !== process.env.MIGRATE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (type === 'competitions') {
      // Update competition photos
      const updates = await Promise.all(
        Object.entries(competitionPhotos).map(async ([id, photo]) => {
          return prisma.competition.update({
            where: { id: parseInt(id) },
            data: { photo: `uploads/games/${photo}` },
          })
        })
      )
      return NextResponse.json({ success: true, updated: updates.length })
    }

    if (type === 'news') {
      // Update news photos and publish status
      const updates = await Promise.all(
        Object.entries(newsPhotos).map(async ([id, photo]) => {
          return prisma.news.update({
            where: { id: parseInt(id) },
            data: {
              photo: `uploads/news/${photo}`,
              published: true,
            },
          })
        })
      )
      return NextResponse.json({ success: true, updated: updates.length })
    }

    if (type === 'publish-news') {
      // Just publish all news
      const result = await prisma.news.updateMany({
        where: { published: false },
        data: { published: true },
      })
      return NextResponse.json({ success: true, updated: result.count })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}

export async function GET() {
  // Get current photo status
  const [competitionsWithPhoto, competitionsWithoutPhoto, newsWithPhoto, newsWithoutPhoto, unpublishedNews] = await Promise.all([
    prisma.competition.count({ where: { photo: { not: null } } }),
    prisma.competition.count({ where: { photo: null } }),
    prisma.news.count({ where: { photo: { not: null } } }),
    prisma.news.count({ where: { photo: null } }),
    prisma.news.count({ where: { published: false } }),
  ])

  return NextResponse.json({
    competitions: {
      withPhoto: competitionsWithPhoto,
      withoutPhoto: competitionsWithoutPhoto,
    },
    news: {
      withPhoto: newsWithPhoto,
      withoutPhoto: newsWithoutPhoto,
      unpublished: unpublishedNews,
    },
  })
}
