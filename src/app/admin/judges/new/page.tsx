'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface Region {
  id: number
  nameRu: string | null
  title: string | null
}

interface City {
  id: number
  nameRu: string | null
}

interface Discipline {
  id: number
  code: string
  name: string
  nameRu: string | null
}

const roleLabels: Record<string, string> = {
  JUDGE: 'Судья',
  ARBITER: 'Арбитр (главный судья)',
  REFEREE: 'Рефери',
  CORNER_JUDGE: 'Угловой судья',
  MIRROR_JUDGE: 'Зеркальный судья',
  LINE_JUDGE: 'Линейный судья',
  SECRETARY: 'Технический секретарь',
  DOCTOR: 'Врач',
  CLASSIFIER: 'Судья-классификатор',
}

const categoryLabels: Record<string, string> = {
  NATIONAL: 'Национальная',
  REGIONAL: 'Региональная',
}

export default function NewJudgePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form state
  const [lastName, setLastName] = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [patronymic, setPatronymic] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [telegramChatId, setTelegramChatId] = React.useState('')
  const [regionId, setRegionId] = React.useState<string>('')
  const [cityId, setCityId] = React.useState<string>('')
  const [judgeRole, setJudgeRole] = React.useState<string>('JUDGE')
  const [judgeCategory, setJudgeCategory] = React.useState<string>('NATIONAL')
  const [certificateNumber, setCertificateNumber] = React.useState('')
  const [licenseDate, setLicenseDate] = React.useState('')
  const [licenseExpiry, setLicenseExpiry] = React.useState('')
  const [startDate, setStartDate] = React.useState('')
  const [experienceYears, setExperienceYears] = React.useState('')
  const [isActive, setIsActive] = React.useState(true)
  const [selectedDisciplines, setSelectedDisciplines] = React.useState<number[]>([])
  const [photo, setPhoto] = React.useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null)

  // Reference data
  const [regions, setRegions] = React.useState<Region[]>([])
  const [cities, setCities] = React.useState<City[]>([])
  const [disciplines, setDisciplines] = React.useState<Discipline[]>([])
  const [isLoadingData, setIsLoadingData] = React.useState(true)

  // Load reference data
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [regionsRes, disciplinesRes] = await Promise.all([
          fetch('/api/v1/geolocation/regions'),
          fetch('/api/v1/disciplines'),
        ])

        if (regionsRes.ok) {
          const data = await regionsRes.json()
          setRegions(data.data || [])
        }

        if (disciplinesRes.ok) {
          const data = await disciplinesRes.json()
          setDisciplines(data.data || [])
        }
      } catch (error) {
        console.error('Failed to load reference data:', error)
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [])

  // Load cities when region changes
  React.useEffect(() => {
    if (!regionId) {
      setCities([])
      setCityId('')
      return
    }

    const loadCities = async () => {
      try {
        const res = await fetch(`/api/v1/geolocation/regions/${regionId}/cities`)
        if (res.ok) {
          const data = await res.json()
          setCities(data.data || [])
        }
      } catch (error) {
        console.error('Failed to load cities:', error)
      }
    }

    loadCities()
  }, [regionId])

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 5MB')
        return
      }
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
  }

  // Toggle discipline selection
  const toggleDiscipline = (disciplineId: number) => {
    setSelectedDisciplines(prev =>
      prev.includes(disciplineId)
        ? prev.filter(id => id !== disciplineId)
        : [...prev, disciplineId]
    )
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!lastName.trim()) {
      toast.error('Укажите фамилию')
      return
    }
    if (!firstName.trim()) {
      toast.error('Укажите имя')
      return
    }
    if (!phone.trim()) {
      toast.error('Укажите телефон')
      return
    }
    if (!judgeRole) {
      toast.error('Выберите роль судьи')
      return
    }
    if (!judgeCategory) {
      toast.error('Выберите категорию судьи')
      return
    }
    if (selectedDisciplines.length === 0) {
      toast.error('Выберите хотя бы одну дисциплину')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('lastName', lastName.trim())
      formData.append('firstName', firstName.trim())
      if (patronymic) formData.append('patronymic', patronymic.trim())
      formData.append('phone', phone.trim())
      if (email) formData.append('email', email.trim())
      if (telegramChatId) formData.append('telegramChatId', telegramChatId.trim())
      if (regionId) formData.append('regionId', regionId)
      if (cityId) formData.append('cityId', cityId)
      formData.append('judgeRole', judgeRole)
      formData.append('judgeCategory', judgeCategory)
      if (certificateNumber) formData.append('certificateNumber', certificateNumber.trim())
      if (licenseDate) formData.append('licenseDate', licenseDate)
      if (licenseExpiry) formData.append('licenseExpiry', licenseExpiry)
      if (startDate) formData.append('startDate', startDate)
      if (experienceYears) formData.append('experienceYears', experienceYears)
      formData.append('isActive', isActive ? 'true' : 'false')

      // Add disciplines
      selectedDisciplines.forEach(id => {
        formData.append('disciplineIds[]', String(id))
      })

      if (photo) formData.append('photo', photo)

      const res = await fetch('/api/v1/judges', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create judge')
      }

      toast.success('Судья успешно создан')
      router.push('/admin/judges')
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка при создании судьи')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Загрузка данных...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Новый судья</h1>
          <p className="text-muted-foreground">
            Заполните данные для регистрации нового судьи
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal data */}
            <Card>
              <CardHeader>
                <CardTitle>Личные данные</CardTitle>
                <CardDescription>Основная информация о судье</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Фамилия *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Иванов"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Имя *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Иван"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patronymic">Отчество</Label>
                    <Input
                      id="patronymic"
                      value={patronymic}
                      onChange={(e) => setPatronymic(e.target.value)}
                      placeholder="Иванович"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact information */}
            <Card>
              <CardHeader>
                <CardTitle>Контактная информация</CardTitle>
                <CardDescription>Способы связи с судьей</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+996 XXX XXX XXX"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="judge@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telegramChatId">Telegram Chat ID</Label>
                    <Input
                      id="telegramChatId"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="123456789"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Локация</CardTitle>
                <CardDescription>Регион и город судьи</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="region">Регион / Область</Label>
                    <Select value={regionId} onValueChange={(value) => {
                      setRegionId(value)
                      setCityId('')
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите регион" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={String(region.id)}>
                            {region.nameRu || region.title || `Регион #${region.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Город</Label>
                    <Select
                      value={cityId}
                      onValueChange={setCityId}
                      disabled={!regionId || cities.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!regionId ? "Сначала выберите регион" : "Выберите город"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={String(city.id)}>
                            {city.nameRu || `Город #${city.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Qualification */}
            <Card>
              <CardHeader>
                <CardTitle>Квалификация</CardTitle>
                <CardDescription>Роль и категория судьи</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="judgeRole">Роль судьи *</Label>
                    <Select value={judgeRole} onValueChange={setJudgeRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите роль" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="judgeCategory">Категория судьи *</Label>
                    <Select value={judgeCategory} onValueChange={setJudgeCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Федерация не может создавать судей международной категории
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Специализация (дисциплины) *</Label>
                  <div className="flex flex-wrap gap-2">
                    {disciplines.map((discipline) => (
                      <Badge
                        key={discipline.id}
                        variant={selectedDisciplines.includes(discipline.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleDiscipline(discipline.id)}
                      >
                        {discipline.nameRu || discipline.name}
                      </Badge>
                    ))}
                  </div>
                  {selectedDisciplines.length === 0 && (
                    <p className="text-xs text-destructive">Выберите хотя бы одну дисциплину</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Experience and certification */}
            <Card>
              <CardHeader>
                <CardTitle>Опыт и сертификация</CardTitle>
                <CardDescription>Информация о лицензии и опыте</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Дата начала работы судьей</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Опыт судейства (лет)</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      min="0"
                      max="100"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certificateNumber">Номер сертификата</Label>
                    <Input
                      id="certificateNumber"
                      value={certificateNumber}
                      onChange={(e) => setCertificateNumber(e.target.value)}
                      placeholder="GTF-2024-001"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="licenseDate">Дата получения лицензии</Label>
                    <Input
                      id="licenseDate"
                      type="date"
                      value={licenseDate}
                      onChange={(e) => setLicenseDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseExpiry">Срок действия лицензии</Label>
                    <Input
                      id="licenseExpiry"
                      type="date"
                      value={licenseExpiry}
                      onChange={(e) => setLicenseExpiry(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Photo */}
            <Card>
              <CardHeader>
                <CardTitle>Фото</CardTitle>
                <CardDescription>Загрузите фото судьи</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full aspect-[3/4] object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removePhoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Нажмите для загрузки</span>
                      <span className="text-xs text-muted-foreground mt-1">JPG, PNG до 5MB</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Статус</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Активен</Label>
                    <p className="text-xs text-muted-foreground">
                      Активные судьи отображаются в списках назначений
                    </p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Сохранение...' : 'Создать судью'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="w-full"
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
