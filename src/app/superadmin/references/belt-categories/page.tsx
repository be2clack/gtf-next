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
    orderBy: [
      { ageCategoryId: 'asc' },
      { beltMin: 'desc' },
    ],
    include: {
      ageCategory: {
        select: { id: true, code: true, nameRu: true, nameEn: true },
      },
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

// Format belt level to human-readable string (Laravel logic)
// Positive = гыпы (10 = 10 гып, 1 = 1 гып)
// Negative = даны (-1 = 1 дан, -9 = 9 дан)
function getBeltName(belt: number): string {
  if (belt > 0) return `${belt} гып`
  if (belt < 0) return `${Math.abs(belt)} дан`
  return 'Не указан'
}

function formatBeltRange(beltMin: number, beltMax: number): string {
  const minName = getBeltName(beltMin)
  const maxName = getBeltName(beltMax)
  if (minName === maxName) {
    return minName
  }
  // Laravel shows: belt_max - belt_min (e.g., "3 гып - 4 гып")
  return `${maxName} - ${minName}`
}

// Get color class based on belt level
function getBeltColorClass(beltMin: number): string {
  // Check if it's a dan (negative)
  if (beltMin <= 0) {
    return 'bg-gray-900 text-white' // Black belt
  }

  // Check by gup level (higher number = lower rank)
  if (beltMin >= 8) {
    return 'bg-white text-gray-800 border border-gray-300' // White belt area (10-8 gup)
  } else if (beltMin >= 6) {
    return 'bg-yellow-400 text-yellow-900' // Yellow belt area (7-6 gup)
  } else if (beltMin >= 4) {
    return 'bg-blue-500 text-white' // Blue belt area (5-4 gup)
  } else if (beltMin >= 2) {
    return 'bg-red-500 text-white' // Red belt area (3-2 gup)
  } else {
    return 'bg-gray-700 text-white' // Red-black (1 gup)
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
            Управление категориями по поясам (гыпы и даны)
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
          <CardTitle>Список категорий по поясам</CardTitle>
          <CardDescription>
            Категории определяют уровень подготовки спортсменов для соревнований
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Возрастная категория</TableHead>
                <TableHead>Дисциплина</TableHead>
                <TableHead>Пояса</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    {category.name}
                  </TableCell>
                  <TableCell>
                    {category.ageCategory ? (
                      <span className="text-sm">
                        {category.ageCategory.nameRu || category.ageCategory.nameEn || category.ageCategory.code}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {category.discipline ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {category.discipline.nameRu || category.discipline.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getBeltColorClass(category.beltMin)}`}>
                      {formatBeltRange(category.beltMin, category.beltMax)}
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
              <p className="text-muted-foreground">Нет категорий по поясам</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
