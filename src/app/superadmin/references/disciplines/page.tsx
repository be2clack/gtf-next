import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/prisma'
import { Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

async function getDisciplines() {
  return prisma.discipline.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          competitionDisciplines: true,
        },
      },
    },
  })
}

export default async function DisciplinesPage() {
  const disciplines = await getDisciplines()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Дисциплины</h1>
          <p className="text-muted-foreground">
            Управление спортивными дисциплинами тхэквондо
          </p>
        </div>
        <Button asChild>
          <Link href="/superadmin/references/disciplines/new">
            <Plus className="mr-2 h-4 w-4" />
            Добавить дисциплину
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список дисциплин</CardTitle>
          <CardDescription>
            Дисциплины используются при создании соревнований и категорий
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {disciplines.map((discipline) => (
              <div
                key={discipline.id}
                className="flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                    {discipline.sortOrder}
                  </div>
                  <div>
                    <p className="font-medium">{discipline.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {discipline.code} | Используется в {discipline._count.competitionDisciplines} соревнованиях
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={discipline.isActive ? 'default' : 'secondary'}>
                    {discipline.isActive ? 'Активна' : 'Неактивна'}
                  </Badge>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/superadmin/references/disciplines/${discipline.id}/edit`}>
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

          {disciplines.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Нет дисциплин</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
