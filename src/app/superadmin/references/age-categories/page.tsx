import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/prisma'
import { Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

async function getAgeCategories() {
  return prisma.ageCategory.findMany({
    orderBy: { minAge: 'asc' },
    include: {
      _count: {
        select: {
          competitionCategories: true,
        },
      },
    },
  })
}

export default async function AgeCategoriesPage() {
  const categories = await getAgeCategories()

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
          <div className="divide-y">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 font-bold text-blue-500">
                    {category.minAge}-{category.maxAge}
                  </div>
                  <div>
                    <p className="font-medium">{category.nameRu || category.nameEn || category.code}</p>
                    <p className="text-sm text-muted-foreground">
                      {category.code} | {category.minAge}-{category.maxAge} лет |
                      Используется в {category._count.competitionCategories} категориях
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={category.isActive ? 'default' : 'secondary'}>
                    {category.isActive ? 'Активна' : 'Неактивна'}
                  </Badge>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/superadmin/references/age-categories/${category.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

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
