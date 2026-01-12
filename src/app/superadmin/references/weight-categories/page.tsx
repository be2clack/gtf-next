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

async function getWeightCategories() {
  return prisma.weightCategory.findMany({
    orderBy: [{ gender: 'asc' }, { minWeight: 'asc' }],
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

const genderLabels: Record<string, string> = {
  MALE: 'М',
  FEMALE: 'Ж',
}

const genderColors: Record<string, string> = {
  MALE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  FEMALE: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
}

export default async function WeightCategoriesPage() {
  const categories = await getWeightCategories()

  const formatWeight = (minWeight: number, maxWeight: number) => {
    if (maxWeight === 0 || maxWeight >= 999) {
      return `${minWeight}+ кг`
    }
    return `${minWeight}-${maxWeight} кг`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Весовые категории</h1>
          <p className="text-muted-foreground">
            Управление весовыми категориями спортсменов
          </p>
        </div>
        <Button asChild>
          <Link href="/superadmin/references/weight-categories/new">
            <Plus className="mr-2 h-4 w-4" />
            Добавить категорию
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список весовых категорий</CardTitle>
          <CardDescription>
            Весовые категории определяют допустимый вес участников
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Дисциплина</TableHead>
                <TableHead>Пол</TableHead>
                <TableHead>Вес</TableHead>
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
                    {category.discipline ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {category.discipline.nameRu || category.discipline.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${genderColors[category.gender] || 'bg-gray-100 text-gray-800'}`}>
                      {genderLabels[category.gender] || category.gender}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      {formatWeight(category.minWeight, category.maxWeight)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? 'default' : 'secondary'}>
                      {category.isActive ? 'Активна' : 'Неактивна'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/superadmin/references/weight-categories/${category.id}/edit`}>
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
              <p className="text-muted-foreground">Нет весовых категорий</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
