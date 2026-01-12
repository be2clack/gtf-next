import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/prisma'
import { Plus, Edit } from 'lucide-react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

async function getBeltCategories() {
  return prisma.beltCategory.findMany({
    orderBy: { minLevel: 'asc' },
    include: {
      discipline: {
        select: { id: true, code: true, nameRu: true, name: true },
      },
      _count: {
        select: {
          competitionCategories: true,
        },
      },
    },
  })
}

// Format belt level to human-readable string
// In ITF TKD: 10 gup (white) to 1 gup (red-black), then 1 dan to 9 dan
// Storage: positive = gup (10 is lowest), negative = dan (e.g., -1 = 1 dan)
function formatBeltLevel(level: number): string {
  if (level > 0) {
    return `${level} гып`
  } else if (level <= 0) {
    return `${Math.abs(level) || 1} дан`
  }
  return String(level)
}

function formatBeltRange(minLevel: number, maxLevel: number): string {
  const minStr = formatBeltLevel(minLevel)
  const maxStr = formatBeltLevel(maxLevel)
  if (minStr === maxStr) {
    return minStr
  }
  return `${minStr} — ${maxStr}`
}

// Get color class based on belt level range
function getBeltColorClass(minLevel: number, maxLevel: number): string {
  // Check if range includes dan (any negative or zero)
  if (maxLevel <= 0) {
    return 'bg-gray-900 text-white' // Black belt
  }

  // Check by gup level (higher number = lower rank)
  if (minLevel >= 8) {
    return 'bg-gray-100 text-gray-800 border border-gray-300' // White belt area (10-8 gup)
  } else if (minLevel >= 6) {
    return 'bg-yellow-400 text-yellow-900' // Yellow belt area (7-6 gup)
  } else if (minLevel >= 4) {
    return 'bg-green-500 text-white' // Green belt area (5-4 gup)
  } else if (minLevel >= 2) {
    return 'bg-blue-500 text-white' // Blue belt area (3-2 gup)
  } else {
    return 'bg-red-500 text-white' // Red belt area (1 gup)
  }
}

export default async function BeltCategoriesPage() {
  const categories = await getBeltCategories()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Категории поясов</h1>
          <p className="text-muted-foreground">
            Управление категориями поясов (гупы и даны)
          </p>
        </div>
        <Button asChild>
          <Link href="/superadmin/references/belt-categories/new">
            <Plus className="mr-2 h-4 w-4" />
            Добавить категорию
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список категорий поясов</CardTitle>
          <CardDescription>
            Категории определяют уровень подготовки спортсменов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Код</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Уровень</TableHead>
                <TableHead>Дисциплина</TableHead>
                <TableHead>Использование</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category, index) => (
                <TableRow key={category.id}>
                  <TableCell className="text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {category.code}
                  </TableCell>
                  <TableCell className="font-medium">
                    {category.name}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getBeltColorClass(category.minLevel, category.maxLevel)}`}>
                      {formatBeltRange(category.minLevel, category.maxLevel)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {category.discipline ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {category.discipline.nameRu || category.discipline.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Все</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {category._count.competitionCategories} категорий
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? 'default' : 'secondary'}>
                      {category.isActive ? 'Активна' : 'Неактивна'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/superadmin/references/belt-categories/${category.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {categories.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Нет категорий поясов</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
