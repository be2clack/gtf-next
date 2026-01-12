import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/prisma'
import { Plus, Edit, Check, X, Users } from 'lucide-react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

async function getDisciplines() {
  return prisma.discipline.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          competitionDisciplines: true,
          weightCategories: true,
          beltCategories: true,
        },
      },
    },
  })
}

const disciplineTypeLabels: Record<string, string> = {
  HYONG: 'Туль',
  MASSOGI: 'Массоги',
  POINT_STOP: 'Поинт-стоп',
  TEAM_HYONG: 'Командный туль',
  TEAM_MASSOGI: 'Командный массоги',
  TEAM_POINT_STOP: 'Командный поинт-стоп',
  SPECIAL_TECHNIQUE: 'Спец. техника',
  POWER_BREAKING: 'Силовое разбивание',
}

const disciplineTypeColors: Record<string, string> = {
  HYONG: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  MASSOGI: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  POINT_STOP: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  TEAM_HYONG: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  TEAM_MASSOGI: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  TEAM_POINT_STOP: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  SPECIAL_TECHNIQUE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  POWER_BREAKING: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Код</TableHead>
                <TableHead>Название (RU)</TableHead>
                <TableHead>Название (EN)</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead className="text-center">Вес</TableHead>
                <TableHead className="text-center">Пояса</TableHead>
                <TableHead className="text-center">Команда</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disciplines.map((discipline) => (
                <TableRow key={discipline.id}>
                  <TableCell className="font-medium">{discipline.sortOrder}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                      {discipline.code}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">
                    {discipline.nameRu || discipline.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {discipline.nameEn || '-'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${disciplineTypeColors[discipline.type] || 'bg-gray-100 text-gray-800'}`}>
                      {disciplineTypeLabels[discipline.type] || discipline.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {discipline.hasWeightCategories ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {discipline.hasBeltCategories ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {discipline.teamSize ? (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3" />
                        {discipline.teamSize}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={discipline.isActive ? 'default' : 'secondary'}>
                      {discipline.isActive ? 'Активна' : 'Неактивна'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/superadmin/references/disciplines/${discipline.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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
