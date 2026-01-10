import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { testMySQLConnection, countMySQL } from '@/lib/mysql'

interface TableStatus {
  name: string
  label: string
  sourceCount: number
  targetCount: number
  percentage: number
}

export async function GET() {
  try {
    // Test MySQL connection
    const mysqlStatus = await testMySQLConnection()

    // Get counts from both databases
    const tables: TableStatus[] = []
    const tableList = [
      { name: 'countries', label: 'Countries' },
      { name: 'regions', label: 'Regions' },
      { name: 'cities', label: 'Cities' },
      { name: 'federations', label: 'Federations' },
      { name: 'clubs', label: 'Clubs' },
      { name: 'trainers', label: 'Trainers' },
      { name: 'users', label: 'Users' },
      { name: 'sportsmen', label: 'Sportsmen' },
      { name: 'competitions', label: 'Competitions' },
      { name: 'news', label: 'News' },
      { name: 'disciplines', label: 'Disciplines' },
      { name: 'age_categories', label: 'Age Categories' },
      { name: 'weight_categories', label: 'Weight Categories' },
      { name: 'belt_categories', label: 'Belt Categories' },
      { name: 'judges', label: 'Judges' },
      { name: 'partners', label: 'Partners' },
      { name: 'sliders', label: 'Sliders' },
      { name: 'settings', label: 'Settings' },
    ]

    for (const t of tableList) {
      let sourceCount = 0
      let targetCount = 0

      // Get source count from MySQL
      if (mysqlStatus.success) {
        try {
          sourceCount = await countMySQL(t.name)
        } catch {
          sourceCount = 0
        }
      }

      // Get target count from PostgreSQL
      try {
        switch (t.name) {
          case 'countries':
            targetCount = await prisma.country.count()
            break
          case 'regions':
            targetCount = await prisma.region.count()
            break
          case 'cities':
            targetCount = await prisma.city.count()
            break
          case 'federations':
            targetCount = await prisma.federation.count()
            break
          case 'clubs':
            targetCount = await prisma.club.count()
            break
          case 'trainers':
            targetCount = await prisma.trainer.count()
            break
          case 'users':
            targetCount = await prisma.user.count()
            break
          case 'sportsmen':
            targetCount = await prisma.sportsman.count()
            break
          case 'competitions':
            targetCount = await prisma.competition.count()
            break
          case 'news':
            targetCount = await prisma.news.count()
            break
          case 'disciplines':
            targetCount = await prisma.discipline.count()
            break
          case 'age_categories':
            targetCount = await prisma.ageCategory.count()
            break
          case 'weight_categories':
            targetCount = await prisma.weightCategory.count()
            break
          case 'belt_categories':
            targetCount = await prisma.beltCategory.count()
            break
          case 'judges':
            targetCount = await prisma.judge.count()
            break
          case 'partners':
            targetCount = await prisma.partner.count()
            break
          case 'sliders':
            targetCount = await prisma.slider.count()
            break
          case 'settings':
            targetCount = await prisma.setting.count()
            break
        }
      } catch {
        targetCount = 0
      }

      const percentage = sourceCount > 0 ? Math.round((targetCount / sourceCount) * 100) : (targetCount > 0 ? 100 : 0)

      tables.push({
        name: t.name,
        label: t.label,
        sourceCount,
        targetCount,
        percentage
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        mysqlConnected: mysqlStatus.success,
        mysqlInfo: mysqlStatus.info || mysqlStatus.error,
        postgresConnected: true,
        postgresInfo: 'Prisma Postgres (Accelerate)',
        tables,
        totalSource: tables.reduce((sum, t) => sum + t.sourceCount, 0),
        totalTarget: tables.reduce((sum, t) => sum + t.targetCount, 0),
      }
    })
  } catch (error) {
    console.error('Migration status error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get migration status' },
      { status: 500 }
    )
  }
}
