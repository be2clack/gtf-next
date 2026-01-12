'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  Phone,
  Calendar,
  MapPin,
  Medal,
  Scale,
  Ruler,
  Building2,
  GraduationCap,
  History,
  Users,
  FileText,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Attestation {
  id: number
  level: number
  status: boolean
  examDate: string
  examiner: string | null
  comment: string | null
}

interface WeightHistory {
  id: number
  weight: number
  recordedAt: string
  notes: string | null
}

interface Representative {
  id: number
  firstName: string | null
  lastName: string | null
  phone: string | null
  relation: string | null
  telegramChatId: string | null
}

interface Sportsman {
  id: number
  publicId: string | null
  fio: string | null
  firstName: string | null
  lastName: string | null
  middleName: string | null
  firstNameLatin: string | null
  lastNameLatin: string | null
  sex: number
  dateOfBirth: string | null
  phone: string | null
  iin: string | null
  photo: string | null
  weight: number | null
  height: number | null
  gyp: number | null
  dan: number | null
  beltLevel: number | null
  dateMed: string | null
  dateStart: string | null
  instagram: string | null
  club: { id: number; title: string | Record<string, string> } | null
  trainer: { id: number; firstName: string | null; lastName: string | null; phone: string | null } | null
  country: { id: number; code: string; nameRu: string | null } | null
  region: { id: number; nameRu: string | null } | null
  city: { id: number; nameRu: string | null } | null
  attestations: Attestation[]
  weightHistory: WeightHistory[]
  representatives: { representative: Representative }[]
}

function getLocalizedString(value: unknown, locale = 'ru'): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, string>
    return obj[locale] || obj['ru'] || obj['en'] || Object.values(obj)[0] || ''
  }
  return String(value)
}

function getBeltName(level: number): string {
  if (level >= 101) return `${level - 100} дан`
  if (level > 0 && level <= 10) return `${level} гып`
  return 'Не определен'
}

function getBeltColor(level: number): string {
  if (level >= 101) return 'bg-black text-white' // Dan - black
  if (level === 10) return 'bg-white text-black border' // 10 gyp - white
  if (level === 9) return 'bg-white text-black border' // 9 gyp - white with yellow stripe
  if (level === 8) return 'bg-yellow-400 text-black' // 8 gyp - yellow
  if (level === 7) return 'bg-yellow-400 text-black' // 7 gyp - yellow with green stripe
  if (level === 6) return 'bg-green-500 text-white' // 6 gyp - green
  if (level === 5) return 'bg-green-500 text-white' // 5 gyp - green with blue stripe
  if (level === 4) return 'bg-blue-500 text-white' // 4 gyp - blue
  if (level === 3) return 'bg-blue-500 text-white' // 3 gyp - blue with red stripe
  if (level === 2) return 'bg-red-500 text-white' // 2 gyp - red
  if (level === 1) return 'bg-red-500 text-white' // 1 gyp - red with black stripe
  return 'bg-gray-200'
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('ru-RU')
}

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null
  const birth = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export default function SportsmanViewPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [sportsman, setSportsman] = React.useState<Sportsman | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    const loadSportsman = async () => {
      try {
        const res = await fetch(`/api/v1/sportsmen/${id}`)
        if (res.ok) {
          const data = await res.json()
          setSportsman(data.data)
        } else {
          toast.error('Спортсмен не найден')
          router.push('/admin/sportsmen')
        }
      } catch (error) {
        console.error('Load sportsman error:', error)
        toast.error('Ошибка загрузки данных')
      } finally {
        setIsLoading(false)
      }
    }

    loadSportsman()
  }, [id, router])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/v1/sportsmen/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Спортсмен удален')
        router.push('/admin/sportsmen')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Ошибка удаления')
      }
    } catch {
      toast.error('Ошибка удаления')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!sportsman) {
    return null
  }

  const fullName = sportsman.fio ||
    `${sportsman.lastName || ''} ${sportsman.firstName || ''} ${sportsman.middleName || ''}`.trim()

  const age = calculateAge(sportsman.dateOfBirth)
  const currentBelt = sportsman.dan && sportsman.dan > 0
    ? sportsman.dan + 100
    : sportsman.gyp || sportsman.beltLevel || 10

  const photoUrl = sportsman.photo
    ? `/uploads/sportsman/${sportsman.photo}`
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{fullName}</h1>
            <p className="text-muted-foreground">
              ID: {sportsman.publicId || sportsman.id}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/sportsmen/${id}/edit`)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Редактировать
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Личные данные
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ФИО</p>
                  <p className="font-medium">{fullName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ФИО (лат.)</p>
                  <p className="font-medium">
                    {sportsman.lastNameLatin} {sportsman.firstNameLatin}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Дата рождения
                  </p>
                  <p className="font-medium">
                    {formatDate(sportsman.dateOfBirth)}
                    {age !== null && <span className="text-muted-foreground ml-2">({age} лет)</span>}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Пол</p>
                  <Badge variant={sportsman.sex === 0 ? 'default' : 'secondary'}>
                    {sportsman.sex === 0 ? 'Мужской' : 'Женский'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Телефон
                  </p>
                  <p className="font-medium">{sportsman.phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ИИН</p>
                  <p className="font-medium font-mono">{sportsman.iin || '-'}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Scale className="h-4 w-4" />
                    Вес
                  </p>
                  <p className="font-medium">
                    {sportsman.weight ? `${sportsman.weight} кг` : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Ruler className="h-4 w-4" />
                    Рост
                  </p>
                  <p className="font-medium">
                    {sportsman.height ? `${sportsman.height} см` : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Тренировочные данные
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    Клуб
                  </p>
                  <p className="font-medium">
                    {sportsman.club ? getLocalizedString(sportsman.club.title) : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Тренер</p>
                  <p className="font-medium">
                    {sportsman.trainer
                      ? `${sportsman.trainer.lastName || ''} ${sportsman.trainer.firstName || ''}`
                      : '-'}
                  </p>
                  {sportsman.trainer?.phone && (
                    <p className="text-sm text-muted-foreground">{sportsman.trainer.phone}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Medal className="h-4 w-4" />
                    Пояс
                  </p>
                  <Badge className={getBeltColor(currentBelt)}>
                    {getBeltName(currentBelt)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Дата начала занятий</p>
                  <p className="font-medium">{formatDate(sportsman.dateStart)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Мед. справка до
                  </p>
                  <p className="font-medium">
                    {sportsman.dateMed ? (
                      <Badge variant={new Date(sportsman.dateMed) >= new Date() ? 'default' : 'destructive'}>
                        {formatDate(sportsman.dateMed)}
                      </Badge>
                    ) : '-'}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Страна
                  </p>
                  <p className="font-medium">
                    {sportsman.country?.nameRu || '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Регион</p>
                  <p className="font-medium">{sportsman.region?.nameRu || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Город</p>
                  <p className="font-medium">{sportsman.city?.nameRu || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                История
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="attestations">
                <TabsList>
                  <TabsTrigger value="attestations">
                    Аттестации ({sportsman.attestations?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="weight">
                    История веса ({sportsman.weightHistory?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="attestations" className="mt-4">
                  {sportsman.attestations?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Дата</TableHead>
                          <TableHead>Пояс</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Экзаменатор</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sportsman.attestations.map((att) => (
                          <TableRow key={att.id}>
                            <TableCell>{formatDate(att.examDate)}</TableCell>
                            <TableCell>
                              <Badge className={getBeltColor(att.level)}>
                                {getBeltName(att.level)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={att.status ? 'default' : 'destructive'}>
                                {att.status ? 'Сдан' : 'Не сдан'}
                              </Badge>
                            </TableCell>
                            <TableCell>{att.examiner || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Нет записей об аттестациях
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="weight" className="mt-4">
                  {sportsman.weightHistory?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Дата</TableHead>
                          <TableHead>Вес</TableHead>
                          <TableHead>Примечание</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sportsman.weightHistory.map((wh) => (
                          <TableRow key={wh.id}>
                            <TableCell>{formatDate(wh.recordedAt)}</TableCell>
                            <TableCell>{wh.weight} кг</TableCell>
                            <TableCell>{wh.notes || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Нет записей о весе
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Photo */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-48 w-48">
                  <AvatarImage src={photoUrl || undefined} alt={fullName} />
                  <AvatarFallback className="text-4xl">
                    {(sportsman.firstName?.[0] || '') + (sportsman.lastName?.[0] || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4 text-center">
                  <p className="text-xl font-semibold">{fullName}</p>
                  <Badge className={`mt-2 ${getBeltColor(currentBelt)}`}>
                    {getBeltName(currentBelt)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Representatives */}
          {sportsman.representatives && sportsman.representatives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Представители
                </CardTitle>
                <CardDescription>
                  Родители/опекуны спортсмена
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sportsman.representatives.map(({ representative: rep }) => (
                  <div key={rep.id} className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {(rep.firstName?.[0] || '') + (rep.lastName?.[0] || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {rep.lastName} {rep.firstName}
                      </p>
                      {rep.relation && (
                        <Badge variant="outline" className="text-xs">
                          {rep.relation}
                        </Badge>
                      )}
                      {rep.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {rep.phone}
                        </p>
                      )}
                      {rep.telegramChatId && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          Telegram подключен
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick stats */}
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Аттестаций</span>
                <span className="font-medium">{sportsman.attestations?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Записей веса</span>
                <span className="font-medium">{sportsman.weightHistory?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Представителей</span>
                <span className="font-medium">{sportsman.representatives?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить спортсмена?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить спортсмена <strong>{fullName}</strong>?
              Это действие нельзя отменить. Все связанные данные (аттестации, история веса)
              также будут удалены.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
