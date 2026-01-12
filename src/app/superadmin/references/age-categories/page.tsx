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

async function getAgeCategories() {
  return prisma.ageCategory.findMany({
    orderBy: [{ minAge: 'asc' }, { gender: 'asc' }],
    include: {
      _count: {
        select: {
          competitionCategories: true,
        },
      },
    },
  })
}

const genderLabels: Record<string, string> = {
  MALE: 'Мужчины',
  FEMALE: 'Женщины',
  MIXED: 'Смешанная',
}

const genderColors: Record<string, string> = {
  MALE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  FEMALE: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  MIXED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
}

export default async function AgeCategoriesPage() {
  const categories = await getAgeCategories()

  const formatAgeRange = (minAge: number, maxAge: number) => {
    if (maxAge >= 99) {
      return `${minAge}+ лет`
    }
    return `${minAge}-${maxAge} лет`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Возрастные категории</h1>
          <p className="text-muted-foreground">
            Управление возрастными группами спортсменов
          </p>
        </div>
        <Button asChild>
          <Link href="/superadmin/references/age-categories/new">
            <Plus className="mr-2 h-4 w-4" />
            Добавить категорию
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список возрастных категорий</CardTitle>
          <CardDescription>
            Категории определяют допустимый возраст участников соревнований
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Код</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Возраст</TableHead>
                <TableHead>Пол</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                      {category.code}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">
                    {category.nameRu || category.nameEn || category.code}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                      {formatAgeRange(category.minAge, category.maxAge)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${genderColors[category.gender] || 'bg-gray-100 text-gray-800'}`}>
                      {genderLabels[category.gender] || category.gender}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? 'default' : 'secondary'}>
                      {category.isActive ? 'Активна' : 'Неактивна'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/superadmin/references/age-categories/${category.id}/edit`}>
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
              <p className="text-muted-foreground">Нет возрастных категорий</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
