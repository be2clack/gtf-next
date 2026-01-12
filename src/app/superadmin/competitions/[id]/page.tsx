'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Trash2, Calendar, MapPin, Users, Trophy } from 'lucide-react'
import Link from 'next/link'
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

interface Federation {
  id: number
  code: string
  name: string
}

interface Country {
  id: number
  code: string
  nameRu: string | null
  nameEn: string | null
}

interface Region {
  id: number
  code: string
  nameRu: string | null
  nameEn: string | null
}

interface City {
  id: number
  nameRu: string | null
  nameEn: string | null
}

interface Competition {
  id: number
  federationId: number | null
  title: { ru?: string; en?: string } | null
  description: { ru?: string; en?: string } | null
  venue: { ru?: string; en?: string } | null
  countryId: number | null
  regionId: number | null
  cityId: number | null
  startDate: string
  endDate: string
  registrationDeadline: string | null
  withdrawalDeadline: string | null
  status: string
  type: string
  level: string
  ratingType: string
  isPaid: boolean
  registrationFee: string | null
  currency: string
  tatamiCount: number
  federation: Federation | null
  _count: {
    registrations: number
    categories: number
    disciplines: number
  }
}

const competitionStatuses = [
  { value: 'DRAFT', label: 'Черновик' },
  { value: 'PUBLISHED', label: 'Опубликовано' },
  { value: 'REGISTRATION_OPEN', label: 'Регистрация открыта' },
  { value: 'REGISTRATION_CLOSED', label: 'Регистрация закрыта' },
  { value: 'DRAW_COMPLETED', label: 'Жеребьёвка завершена' },
  { value: 'ONGOING', label: 'Идёт' },
  { value: 'COMPLETED', label: 'Завершено' },
  { value: 'CANCELLED', label: 'Отменено' },
]

const competitionTypes = [
  { value: 'MIXED', label: 'Смешанный' },
  { value: 'PERSONAL', label: 'Личный' },
  { value: 'TEAM', label: 'Командный' },
]

const competitionLevels = [
  { value: 'INTERNATIONAL', label: 'Международный' },
  { value: 'NATIONAL', label: 'Национальный' },
  { value: 'REGIONAL', label: 'Региональный' },
  { value: 'CLUB', label: 'Клубный' },
]

const ratingTypes = [
  { value: 'OFFICIAL', label: 'Официальный' },
  { value: 'FESTIVAL', label: 'Фестиваль' },
]

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500',
  PUBLISHED: 'bg-blue-500',
  REGISTRATION_OPEN: 'bg-green-500',
  REGISTRATION_CLOSED: 'bg-yellow-500',
  DRAW_COMPLETED: 'bg-indigo-500',
  ONGOING: 'bg-orange-500',
  COMPLETED: 'bg-purple-500',
  CANCELLED: 'bg-red-500',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

function getTitle(title: { ru?: string; en?: string } | null): string {
  if (!title) return 'Без названия'
  return title.ru || title.en || 'Без названия'
}

export default function CompetitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [federations, setFederations] = useState<Federation[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [formData, setFormData] = useState({
    federationId: '',
    titleRu: '',
    titleEn: '',
    descriptionRu: '',
    descriptionEn: '',
    venueRu: '',
    venueEn: '',
    countryId: '',
    regionId: '',
    cityId: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    withdrawalDeadline: '',
    status: 'DRAFT',
    type: 'MIXED',
    level: 'NATIONAL',
    ratingType: 'OFFICIAL',
    isPaid: false,
    registrationFee: '',
    currency: 'KGS',
    tatamiCount: '1',
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/superadmin/competitions/${id}`).then(res => res.json()),
      fetch('/api/superadmin/federations').then(res => res.json()),
      fetch('/api/superadmin/locations/countries').then(res => res.json()),
    ])
      .then(([competitionData, federationsData, countriesData]) => {
        setCompetition(competitionData)
        setFederations(Array.isArray(federationsData) ? federationsData : [])
        setCountries(Array.isArray(countriesData) ? countriesData : [])
        setFormData({
          federationId: competitionData.federationId ? String(competitionData.federationId) : '',
          titleRu: competitionData.title?.ru || '',
          titleEn: competitionData.title?.en || '',
          descriptionRu: competitionData.description?.ru || '',
          descriptionEn: competitionData.description?.en || '',
          venueRu: competitionData.venue?.ru || '',
          venueEn: competitionData.venue?.en || '',
          countryId: competitionData.countryId ? String(competitionData.countryId) : '',
          regionId: competitionData.regionId ? String(competitionData.regionId) : '',
          cityId: competitionData.cityId ? String(competitionData.cityId) : '',
          startDate: formatDate(competitionData.startDate),
          endDate: formatDate(competitionData.endDate),
          registrationDeadline: formatDate(competitionData.registrationDeadline),
          withdrawalDeadline: formatDate(competitionData.withdrawalDeadline),
          status: competitionData.status || 'DRAFT',
          type: competitionData.type || 'MIXED',
          level: competitionData.level || 'NATIONAL',
          ratingType: competitionData.ratingType || 'OFFICIAL',
          isPaid: competitionData.isPaid || false,
          registrationFee: competitionData.registrationFee || '',
          currency: competitionData.currency || 'KGS',
          tatamiCount: String(competitionData.tatamiCount || 1),
        })

        if (competitionData.countryId) {
          fetch(`/api/superadmin/locations/regions?countryId=${competitionData.countryId}`)
            .then(res => res.json())
            .then(data => setRegions(Array.isArray(data) ? data : []))
        }
        if (competitionData.regionId) {
          fetch(`/api/superadmin/locations/cities?regionId=${competitionData.regionId}`)
            .then(res => res.json())
            .then(data => setCities(Array.isArray(data) ? data : []))
        }
      })
      .catch(() => router.push('/superadmin/competitions'))
  }, [id, router])

  useEffect(() => {
    if (formData.countryId && competition && formData.countryId !== String(competition.countryId)) {
      fetch(`/api/superadmin/locations/regions?countryId=${formData.countryId}`)
        .then(res => res.json())
        .then(data => setRegions(Array.isArray(data) ? data : []))
        .catch(() => setRegions([]))
      setFormData(prev => ({ ...prev, regionId: '', cityId: '' }))
      setCities([])
    }
  }, [formData.countryId, competition])

  useEffect(() => {
    if (formData.regionId && competition && formData.regionId !== String(competition.regionId)) {
      fetch(`/api/superadmin/locations/cities?regionId=${formData.regionId}`)
        .then(res => res.json())
        .then(data => setCities(Array.isArray(data) ? data : []))
        .catch(() => setCities([]))
      setFormData(prev => ({ ...prev, cityId: '' }))
    }
  }, [formData.regionId, competition])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/superadmin/competitions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updated = await response.json()
        setCompetition(prev => prev ? { ...prev, ...updated } : null)
        alert('Сохранено')
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка сохранения')
      }
    } catch {
      alert('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      const response = await fetch(`/api/superadmin/competitions/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/superadmin/competitions')
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка удаления')
      }
    } catch {
      alert('Ошибка сети')
    } finally {
      setDeleting(false)
    }
  }

  if (!competition) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const title = getTitle(competition.title)
  const statusLabel = competitionStatuses.find(s => s.value === competition.status)?.label || competition.status

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/superadmin/competitions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{title}</h1>
              <Badge className={statusColors[competition.status]}>{statusLabel}</Badge>
            </div>
            <p className="text-muted-foreground">
              {competition.federation?.code.toUpperCase()} • {new Date(competition.startDate).toLocaleDateString('ru-RU')}
            </p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить соревнование?</AlertDialogTitle>
              <AlertDialogDescription>
                {competition._count.registrations > 0
                  ? `Соревнование будет отменено (есть ${competition._count.registrations} регистраций)`
                  : 'Соревнование будет удалено навсегда'
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleting}
              >
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Дата</p>
                <p className="font-medium">
                  {new Date(competition.startDate).toLocaleDateString('ru-RU')} - {new Date(competition.endDate).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Участники</p>
                <p className="font-medium">{competition._count.registrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Категории</p>
                <p className="font-medium">{competition._count.categories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Татами</p>
                <p className="font-medium">{competition.tatamiCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Основное</TabsTrigger>
          <TabsTrigger value="location">Место</TabsTrigger>
          <TabsTrigger value="dates">Даты</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="federationId">Федерация</Label>
                  <Select
                    value={formData.federationId}
                    onValueChange={(value) => setFormData({ ...formData, federationId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите федерацию" />
                    </SelectTrigger>
                    <SelectContent>
                      {federations.map((fed) => (
                        <SelectItem key={fed.id} value={String(fed.id)}>
                          {fed.code.toUpperCase()} - {fed.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="titleRu">Название (RU)</Label>
                    <Input
                      id="titleRu"
                      value={formData.titleRu}
                      onChange={(e) => setFormData({ ...formData, titleRu: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleEn">Название (EN)</Label>
                    <Input
                      id="titleEn"
                      value={formData.titleEn}
                      onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="descriptionRu">Описание (RU)</Label>
                    <Textarea
                      id="descriptionRu"
                      value={formData.descriptionRu}
                      onChange={(e) => setFormData({ ...formData, descriptionRu: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionEn">Описание (EN)</Label>
                    <Textarea
                      id="descriptionEn"
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Место проведения</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="venueRu">Место (RU)</Label>
                    <Input
                      id="venueRu"
                      value={formData.venueRu}
                      onChange={(e) => setFormData({ ...formData, venueRu: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venueEn">Место (EN)</Label>
                    <Input
                      id="venueEn"
                      value={formData.venueEn}
                      onChange={(e) => setFormData({ ...formData, venueEn: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Страна</Label>
                    <Select
                      value={formData.countryId}
                      onValueChange={(value) => setFormData({ ...formData, countryId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nameRu || c.nameEn || c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Регион</Label>
                    <Select
                      value={formData.regionId}
                      onValueChange={(value) => setFormData({ ...formData, regionId: value })}
                      disabled={!formData.countryId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.nameRu || r.nameEn || r.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Город</Label>
                    <Select
                      value={formData.cityId}
                      onValueChange={(value) => setFormData({ ...formData, cityId: value })}
                      disabled={!formData.regionId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nameRu || c.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Даты</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Дата начала</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Дата окончания</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Дедлайн регистрации</Label>
                    <Input
                      type="date"
                      value={formData.registrationDeadline}
                      onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Дедлайн отзыва</Label>
                    <Input
                      type="date"
                      value={formData.withdrawalDeadline}
                      onChange={(e) => setFormData({ ...formData, withdrawalDeadline: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Параметры</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Статус</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {competitionStatuses.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Тип</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {competitionTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Уровень</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => setFormData({ ...formData, level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {competitionLevels.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Рейтинг</Label>
                    <Select
                      value={formData.ratingType}
                      onValueChange={(value) => setFormData({ ...formData, ratingType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ratingTypes.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Татами</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.tatamiCount}
                      onChange={(e) => setFormData({ ...formData, tatamiCount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Взнос</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.registrationFee}
                      onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                      disabled={!formData.isPaid}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Валюта</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KGS">KGS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="RUB">RUB</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="isPaid"
                    checked={formData.isPaid}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
                  />
                  <Label htmlFor="isPaid">Платное участие</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex gap-4 mt-6">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить изменения
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/superadmin/competitions">Назад к списку</Link>
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  )
}
