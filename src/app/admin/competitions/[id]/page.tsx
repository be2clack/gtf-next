'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Pencil, Trash2, Calendar, MapPin, Users, Trophy,
  CheckCircle, Clock, AlertCircle, Scale, FileText
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Competition {
  id: number
  title: string
  description: string | null
  venue: string | null
  photo: string | null
  startDate: string
  endDate: string
  registrationDeadline: string | null
  weighInDate: string | null
  status: string
  level: string
  type: string
  tatamiCount: number
  medicalCheckRequired: boolean
  insuranceRequired: boolean
  rulesVersion: string | null
  isPaid: boolean
  registrationFee: number | null
  baseRegistrationFee: number | null
  additionalDisciplineFee: number | null
  currency: string
  federation: { id: number; code: string; name: string } | null
  country: { nameRu: string; flagEmoji: string | null } | null
  region: { nameRu: string } | null
  city: { nameRu: string } | null
  disciplines: Array<{
    id: number
    discipline: { id: number; name: string; nameRu: string }
  }>
  categories: Array<{
    id: number
    name: string | null
    gender: string
    ageCategory: { name: string } | null
    weightCategory: { name: string } | null
    beltCategory: { name: string } | null
    discipline: { nameRu: string } | null
    _count: { registrations: number }
  }>
  _count: {
    registrations: number
    categories: number
    judges: number
  }
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Черновик', color: 'bg-gray-500', icon: FileText },
  PUBLISHED: { label: 'Опубликовано', color: 'bg-blue-500', icon: CheckCircle },
  REGISTRATION_OPEN: { label: 'Регистрация открыта', color: 'bg-green-500', icon: Users },
  REGISTRATION_CLOSED: { label: 'Регистрация закрыта', color: 'bg-yellow-500', icon: AlertCircle },
  DRAW_COMPLETED: { label: 'Жеребьевка завершена', color: 'bg-purple-500', icon: Scale },
  ONGOING: { label: 'Проводится', color: 'bg-orange-500', icon: Clock },
  COMPLETED: { label: 'Завершено', color: 'bg-green-600', icon: Trophy },
  CANCELLED: { label: 'Отменено', color: 'bg-red-500', icon: AlertCircle },
}

const levelLabels: Record<string, string> = {
  CLUB: 'Клубный',
  REGIONAL: 'Региональный',
  NATIONAL: 'Национальный',
  INTERNATIONAL: 'Международный',
}

const typeLabels: Record<string, string> = {
  PERSONAL: 'Личные',
  TEAM: 'Командные',
  MIXED: 'Смешанные',
}

export default function CompetitionViewPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params.id as string

  const [competition, setCompetition] = React.useState<Competition | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const loadCompetition = async () => {
      try {
        const res = await fetch(`/api/v1/competitions/${competitionId}`)
        if (!res.ok) {
          throw new Error('Competition not found')
        }
        const data = await res.json()
        setCompetition(data.data)
      } catch (error) {
        console.error('Failed to load competition:', error)
        toast.error('Ошибка загрузки данных')
        router.push('/admin/competitions')
      } finally {
        setIsLoading(false)
      }
    }

    loadCompetition()
  }, [competitionId, router])

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/v1/competitions/${competitionId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete')
      }

      toast.success('Соревнование удалено')
      router.push('/admin/competitions')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка удаления')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Соревнование не найдено</div>
      </div>
    )
  }

  const status = statusConfig[competition.status] || statusConfig.DRAFT
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{competition.title}</h1>
              <Badge className={`${status.color} text-white`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(competition.startDate)}
                {competition.startDate !== competition.endDate && (
                  <> - {formatDate(competition.endDate)}</>
                )}
              </span>
              {competition.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {competition.city.nameRu}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/competitions/${competition.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Редактировать
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить соревнование?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить. Соревнование будет архивировано.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Участники</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="h-6 w-6 text-muted-foreground" />
              {competition._count.registrations}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Категории</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Trophy className="h-6 w-6 text-muted-foreground" />
              {competition._count.categories}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Судьи</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Scale className="h-6 w-6 text-muted-foreground" />
              {competition._count.judges}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Татами</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-muted-foreground" />
              {competition.tatamiCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="categories">Категории</TabsTrigger>
          <TabsTrigger value="disciplines">Дисциплины</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Уровень</p>
                    <p className="font-medium">{levelLabels[competition.level] || competition.level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Тип</p>
                    <p className="font-medium">{typeLabels[competition.type] || competition.type}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Место проведения</p>
                  <p className="font-medium">{competition.venue || '—'}</p>
                  {competition.city && (
                    <p className="text-sm text-muted-foreground">
                      {[competition.city.nameRu, competition.region?.nameRu, competition.country?.nameRu]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>

                {competition.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Описание</p>
                      <p className="font-medium">{competition.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Даты</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Начало</p>
                    <p className="font-medium">{formatDate(competition.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Окончание</p>
                    <p className="font-medium">{formatDate(competition.endDate)}</p>
                  </div>
                </div>

                {competition.registrationDeadline && (
                  <div>
                    <p className="text-sm text-muted-foreground">Дедлайн регистрации</p>
                    <p className="font-medium">{formatDate(competition.registrationDeadline)}</p>
                  </div>
                )}

                {competition.weighInDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Взвешивание</p>
                    <p className="font-medium">{formatDate(competition.weighInDate)}</p>
                  </div>
                )}

                <Separator />

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${competition.medicalCheckRequired ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className="text-sm">Мед. допуск</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${competition.insuranceRequired ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className="text-sm">Страховка</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            {competition.isPaid && (
              <Card>
                <CardHeader>
                  <CardTitle>Оплата</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {competition.registrationFee && (
                    <div>
                      <p className="text-sm text-muted-foreground">Регистрационный взнос</p>
                      <p className="font-medium text-lg">{competition.registrationFee} {competition.currency}</p>
                    </div>
                  )}

                  {competition.baseRegistrationFee && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Базовый взнос</p>
                        <p className="font-medium">{competition.baseRegistrationFee} {competition.currency}</p>
                      </div>
                      {competition.additionalDisciplineFee && (
                        <div>
                          <p className="text-sm text-muted-foreground">За доп. дисциплину</p>
                          <p className="font-medium">{competition.additionalDisciplineFee} {competition.currency}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Категории ({competition.categories?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {competition.categories?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Категория</TableHead>
                      <TableHead>Пол</TableHead>
                      <TableHead>Возраст</TableHead>
                      <TableHead>Вес</TableHead>
                      <TableHead>Дисциплина</TableHead>
                      <TableHead className="text-center">Участников</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competition.categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">
                          {cat.name || `Категория #${cat.id}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {cat.gender === 'male' ? 'М' : 'Ж'}
                          </Badge>
                        </TableCell>
                        <TableCell>{cat.ageCategory?.name || '—'}</TableCell>
                        <TableCell>{cat.weightCategory?.name || '—'}</TableCell>
                        <TableCell>{cat.discipline?.nameRu || '—'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{cat._count.registrations}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Категории не добавлены</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disciplines">
          <Card>
            <CardHeader>
              <CardTitle>Дисциплины ({competition.disciplines?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {competition.disciplines?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {competition.disciplines.map((d) => (
                    <Badge key={d.id} variant="secondary" className="text-sm py-1 px-3">
                      {d.discipline.nameRu || d.discipline.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Дисциплины не добавлены</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
