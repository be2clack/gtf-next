import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/prisma'
import { Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

async function getWeightCategories() {
  return prisma.weightCategory.findMany({
    orderBy: [{ gender: 'asc' }, { minWeight: 'asc' }],
    include: {
      _count: {
        select: {
          competitionCategories: true,
        },
      },
    },
  })
}

export default async function WeightCategoriesPage() {
  const categories = await getWeightCategories()

  const maleCategories = categories.filter((c) => c.gender === 'MALE')
  const femaleCategories = categories.filter((c) => c.gender === 'FEMALE')

  const CategoryList = ({ items, title }: { items: typeof categories; title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {items.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between py-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 font-bold text-green-500 text-sm">
                  {category.maxWeight ? `${category.minWeight}-${category.maxWeight}` : `${category.minWeight}+`}
                </div>
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {category.code} |
                    {category.maxWeight
                      ? ` ${category.minWeight}-${category.maxWeight} кг`
                      : ` свыше ${category.minWeight} кг`
                    } |
                    Используется в {category._count.competitionCategories} категориях
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={category.isActive ? 'default' : 'secondary'}>
                  {category.isActive ? 'Активна' : 'Неактивна'}
                </Badge>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/superadmin/references/weight-categories/${category.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Нет весовых категорий</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

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

      <div className="grid gap-6 md:grid-cols-2">
        <CategoryList items={maleCategories} title="Мужские категории" />
        <CategoryList items={femaleCategories} title="Женские категории" />
      </div>
    </div>
  )
}
