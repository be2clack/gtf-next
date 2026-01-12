'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

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

const competitionStatuses = [
  { value: 'DRAFT', label: 'Черновик' },
  { value: 'PUBLISHED', label: 'Опубликовано' },
  { value: 'REGISTRATION_OPEN', label: 'Регистрация открыта' },
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

export default function NewCompetitionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
      fetch('/api/superadmin/federations').then(res => res.json()),
      fetch('/api/superadmin/locations/countries').then(res => res.json()),
    ])
      .then(([federationsData, countriesData]) => {
        setFederations(Array.isArray(federationsData) ? federationsData : [])
        setCountries(Array.isArray(countriesData) ? countriesData : [])
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (formData.countryId) {
      fetch(`/api/superadmin/locations/regions?countryId=${formData.countryId}`)
        .then(res => res.json())
        .then(data => setRegions(Array.isArray(data) ? data : []))
        .catch(() => setRegions([]))
    } else {
      setRegions([])
      setFormData(prev => ({ ...prev, regionId: '', cityId: '' }))
    }
  }, [formData.countryId])

  useEffect(() => {
    if (formData.regionId) {
      fetch(`/api/superadmin/locations/cities?regionId=${formData.regionId}`)
        .then(res => res.json())
        .then(data => setCities(Array.isArray(data) ? data : []))
        .catch(() => setCities([]))
    } else {
      setCities([])
      setFormData(prev => ({ ...prev, cityId: '' }))
    }
  }, [formData.regionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/superadmin/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const competition = await response.json()
        router.push(`/superadmin/competitions/${competition.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка создания')
      }
    } catch {
      alert('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/superadmin/competitions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Новое соревнование</h1>
          <p className="text-muted-foreground">Создание соревнования в системе GTF</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
            <CardDescription>Название и описание соревнования</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="federationId">Федерация *</Label>
              <Select
                value={formData.federationId}
                onValueChange={(value) => setFormData({ ...formData, federationId: value })}
                required
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
                <Label htmlFor="titleRu">Название (RU) *</Label>
                <Input
                  id="titleRu"
                  placeholder="Чемпионат Кыргызстана по тхэквондо"
                  value={formData.titleRu}
                  onChange={(e) => setFormData({ ...formData, titleRu: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titleEn">Название (EN)</Label>
                <Input
                  id="titleEn"
                  placeholder="Kyrgyzstan Taekwondo Championship"
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
                  placeholder="Описание соревнования..."
                  value={formData.descriptionRu}
                  onChange={(e) => setFormData({ ...formData, descriptionRu: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionEn">Описание (EN)</Label>
                <Textarea
                  id="descriptionEn"
                  placeholder="Competition description..."
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Место проведения</CardTitle>
            <CardDescription>Адрес и локация соревнования</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="venueRu">Место проведения (RU)</Label>
                <Input
                  id="venueRu"
                  placeholder="Дворец спорта им. Кожомкула"
                  value={formData.venueRu}
                  onChange={(e) => setFormData({ ...formData, venueRu: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venueEn">Место проведения (EN)</Label>
                <Input
                  id="venueEn"
                  placeholder="Kozhomkul Sports Palace"
                  value={formData.venueEn}
                  onChange={(e) => setFormData({ ...formData, venueEn: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="countryId">Страна</Label>
                <Select
                  value={formData.countryId}
                  onValueChange={(value) => setFormData({ ...formData, countryId: value, regionId: '', cityId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите страну" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={String(country.id)}>
                        {country.nameRu || country.nameEn || country.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="regionId">Регион</Label>
                <Select
                  value={formData.regionId}
                  onValueChange={(value) => setFormData({ ...formData, regionId: value, cityId: '' })}
                  disabled={!formData.countryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите регион" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={String(region.id)}>
                        {region.nameRu || region.nameEn || region.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cityId">Город</Label>
                <Select
                  value={formData.cityId}
                  onValueChange={(value) => setFormData({ ...formData, cityId: value })}
                  disabled={!formData.regionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={String(city.id)}>
                        {city.nameRu || city.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Даты</CardTitle>
            <CardDescription>Даты проведения и регистрации</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Дата начала *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Дата окончания *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="registrationDeadline">Дедлайн регистрации</Label>
                <Input
                  id="registrationDeadline"
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdrawalDeadline">Дедлайн отзыва заявок</Label>
                <Input
                  id="withdrawalDeadline"
                  type="date"
                  value={formData.withdrawalDeadline}
                  onChange={(e) => setFormData({ ...formData, withdrawalDeadline: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Параметры соревнования</CardTitle>
            <CardDescription>Тип, уровень и другие настройки</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="status">Статус</Label>
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
                <Label htmlFor="type">Тип</Label>
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
                <Label htmlFor="level">Уровень</Label>
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
                <Label htmlFor="ratingType">Тип рейтинга</Label>
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
                <Label htmlFor="tatamiCount">Кол-во татами</Label>
                <Input
                  id="tatamiCount"
                  type="number"
                  min="1"
                  value={formData.tatamiCount}
                  onChange={(e) => setFormData({ ...formData, tatamiCount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationFee">Взнос за участие</Label>
                <Input
                  id="registrationFee"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.registrationFee}
                  onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                  disabled={!formData.isPaid}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Валюта</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KGS">KGS (сом)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="RUB">RUB (руб)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
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

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Создать соревнование
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/superadmin/competitions">Отмена</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
