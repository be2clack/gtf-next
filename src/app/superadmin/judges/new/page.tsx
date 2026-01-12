'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  countryId: number
}

interface City {
  id: number
  nameRu: string | null
  nameEn: string | null
  regionId: number
}

interface Federation {
  id: number
  code: string
  name: string
}

const judgeRoles = [
  { value: 'ARBITER', label: 'Арбитр' },
  { value: 'REFEREE', label: 'Рефери' },
  { value: 'JUDGE', label: 'Судья' },
  { value: 'CORNER_JUDGE', label: 'Угловой судья' },
  { value: 'MIRROR_JUDGE', label: 'Зеркальный судья' },
  { value: 'LINE_JUDGE', label: 'Линейный судья' },
  { value: 'SECRETARY', label: 'Секретарь' },
  { value: 'DOCTOR', label: 'Врач' },
  { value: 'CLASSIFIER', label: 'Классификатор' },
]

const judgeCategories = [
  { value: 'INTERNATIONAL', label: 'Международный' },
  { value: 'NATIONAL', label: 'Национальный' },
  { value: 'REGIONAL', label: 'Региональный' },
]

export default function NewJudgePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [federations, setFederations] = useState<Federation[]>([])
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    patronymic: '',
    phone: '',
    email: '',
    countryId: '',
    regionId: '',
    cityId: '',
    judgeRole: 'JUDGE',
    judgeCategory: 'NATIONAL',
    certificateNumber: '',
    licenseDate: '',
    licenseExpiry: '',
    startDate: '',
    experienceYears: '',
    isInternational: false,
    isActive: true,
    federationId: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/superadmin/locations/countries').then(res => res.json()),
      fetch('/api/superadmin/federations').then(res => res.json()),
    ])
      .then(([countriesData, federationsData]) => {
        setCountries(Array.isArray(countriesData) ? countriesData : [])
        setFederations(Array.isArray(federationsData) ? federationsData : [])
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
      const response = await fetch('/api/superadmin/judges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/superadmin/judges')
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
          <Link href="/superadmin/judges">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Новый судья</h1>
          <p className="text-muted-foreground">Добавление судьи в глобальный реестр</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Личные данные</CardTitle>
            <CardDescription>Основная информация о судье</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия *</Label>
                <Input
                  id="lastName"
                  placeholder="Иванов"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя *</Label>
                <Input
                  id="firstName"
                  placeholder="Иван"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patronymic">Отчество</Label>
                <Input
                  id="patronymic"
                  placeholder="Иванович"
                  value={formData.patronymic}
                  onChange={(e) => setFormData({ ...formData, patronymic: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+996 XXX XXX XXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="judge@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Местоположение</CardTitle>
            <CardDescription>Географическая привязка судьи</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <CardTitle>Квалификация</CardTitle>
            <CardDescription>Категория, роль и лицензия судьи</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="judgeCategory">Категория *</Label>
                <Select
                  value={formData.judgeCategory}
                  onValueChange={(value) => setFormData({ ...formData, judgeCategory: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {judgeCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="judgeRole">Роль *</Label>
                <Select
                  value={formData.judgeRole}
                  onValueChange={(value) => setFormData({ ...formData, judgeRole: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {judgeRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="certificateNumber">Номер сертификата</Label>
                <Input
                  id="certificateNumber"
                  placeholder="GTF-2024-001"
                  value={formData.certificateNumber}
                  onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseDate">Дата выдачи лицензии</Label>
                <Input
                  id="licenseDate"
                  type="date"
                  value={formData.licenseDate}
                  onChange={(e) => setFormData({ ...formData, licenseDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseExpiry">Срок действия</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Начало судейской карьеры</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experienceYears">Лет опыта</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  min="0"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isInternational"
                  checked={formData.isInternational}
                  onCheckedChange={(checked) => setFormData({ ...formData, isInternational: checked })}
                />
                <Label htmlFor="isInternational">Международный судья</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Активен</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Добавить судью
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/superadmin/judges">Отмена</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
