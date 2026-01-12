import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/prisma'
import { Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

async function getBeltCategories() {
  return prisma.beltCategory.findMany({
    orderBy: { minLevel: 'asc' },
    include: {
      discipline: {
        select: { id: true, code: true, nameRu: true, nameEn: true },
      },
      _count: {
        select: {
          competitionCategories: true,
        },
      },
    },
  })
}

export default async function BeltCategoriesPage() {
  const categories = await getBeltCategories()

  // Color mapping for belt display
  const getBeltColor = (code: string) => {
    const colors: Record<string, string> = {
      'white': 'bg-gray-100 text-gray-800',
      'yellow': 'bg-yellow-400 text-yellow-900',
      'green': 'bg-green-500 text-white',
      'blue': 'bg-blue-500 text-white',
      'red': 'bg-red-500 text-white',
      'black': 'bg-gray-900 text-white',
    }
    return colors[code.toLowerCase()] || 'bg-gray-300 text-gray-800'
  }

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
          <div className="divide-y">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold ${getBeltColor(category.code)}`}>
                    {category.minLevel}-{category.maxLevel}
                  </div>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {category.code} | Уровни: {category.minLevel}-{category.maxLevel} |
                      Используется в {category._count.competitionCategories} категориях
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={category.isActive ? 'default' : 'secondary'}>
                    {category.isActive ? 'Активна' : 'Неактивна'}
                  </Badge>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/superadmin/references/belt-categories/${category.id}/edit`}>
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
              <p className="text-muted-foreground">Нет категорий поясов</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
