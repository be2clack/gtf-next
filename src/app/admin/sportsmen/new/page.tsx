'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface Trainer {
  id: number
  firstName: string | null
  lastName: string | null
  middleName: string | null
  fio: string | null
  clubId: number | null
  club?: { id: number; title: string } | null
}

interface Club {
  id: number
  title: string | Record<string, string>
}

interface Region {
  id: number
  nameRu: string | null
  title: string | null
}

interface City {
  id: number
  nameRu: string | null
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

export default function NewSportsmanPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form state
  const [lastName, setLastName] = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [middleName, setMiddleName] = React.useState('')
  const [dateOfBirth, setDateOfBirth] = React.useState('')
  const [sex, setSex] = React.useState<string>('')
  const [phone, setPhone] = React.useState('')
  const [trainerId, setTrainerId] = React.useState<string>('')
  const [regionId, setRegionId] = React.useState<string>('')
  const [cityId, setCityId] = React.useState<string>('')
  const [iin, setIin] = React.useState('')
  const [weight, setWeight] = React.useState('')
  const [height, setHeight] = React.useState('')
  const [dateMed, setDateMed] = React.useState('')
  const [dateStart, setDateStart] = React.useState('')
  const [photo, setPhoto] = React.useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null)

  // Reference data
  const [trainers, setTrainers] = React.useState<Trainer[]>([])
  const [clubs, setClubs] = React.useState<Club[]>([])
  const [regions, setRegions] = React.useState<Region[]>([])
  const [cities, setCities] = React.useState<City[]>([])
  const [selectedClub, setSelectedClub] = React.useState<Club | null>(null)
  const [isLoadingData, setIsLoadingData] = React.useState(true)

  // Load reference data
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [trainersRes, clubsRes, regionsRes] = await Promise.all([
          fetch('/api/v1/trainers'),
          fetch('/api/v1/clubs'),
          fetch('/api/v1/geolocation/regions'),
        ])

        if (trainersRes.ok) {
          const data = await trainersRes.json()
          setTrainers(data.data || [])
        }

        if (clubsRes.ok) {
          const data = await clubsRes.json()
          setClubs(data.data || [])
        }

        if (regionsRes.ok) {
          const data = await regionsRes.json()
          setRegions(data.data || [])
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

  // Auto-select club when trainer is selected
  React.useEffect(() => {
    if (!trainerId) {
      setSelectedClub(null)
      return
    }

    const trainer = trainers.find(t => t.id === parseInt(trainerId))
    if (trainer?.clubId) {
      const club = clubs.find(c => c.id === trainer.clubId)
      setSelectedClub(club || null)
    } else {
      setSelectedClub(null)
    }
  }, [trainerId, trainers, clubs])

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

  // Get trainer display name
  const getTrainerName = (trainer: Trainer) => {
    if (trainer.fio) return trainer.fio
    const parts = [trainer.lastName, trainer.firstName, trainer.middleName].filter(Boolean)
    return parts.join(' ') || `Тренер #${trainer.id}`
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
    if (!dateOfBirth) {
      toast.error('Укажите дату рождения')
      return
    }
    if (!sex) {
      toast.error('Укажите пол')
      return
    }
    if (!trainerId) {
      toast.error('Выберите тренера')
      return
    }

    // Check age (minimum 5 years)
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    if (age < 5) {
      toast.error('Спортсмен должен быть старше 5 лет')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('lastName', lastName.trim())
      formData.append('firstName', firstName.trim())
      if (middleName) formData.append('middleName', middleName.trim())
      formData.append('dateOfBirth', dateOfBirth)
      formData.append('sex', sex)
      if (phone) formData.append('phone', phone.trim())
      formData.append('trainerId', trainerId)
      if (selectedClub) formData.append('clubId', String(selectedClub.id))
      if (regionId) formData.append('regionId', regionId)
      if (cityId) formData.append('cityId', cityId)
      if (iin) formData.append('iin', iin.trim())
      if (weight) formData.append('weight', weight)
      if (height) formData.append('height', height)
      if (dateMed) formData.append('dateMed', dateMed)
      if (dateStart) formData.append('dateStart', dateStart)
      if (photo) formData.append('photo', photo)

      const res = await fetch('/api/v1/sportsmen', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create sportsman')
      }

      toast.success('Спортсмен успешно создан с начальным поясом (10 гып)')
      router.push('/admin/sportsmen')
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка при создании спортсмена')
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
          <h1 className="text-3xl font-bold tracking-tight">Новый спортсмен</h1>
          <p className="text-muted-foreground">
            Заполните данные для регистрации нового спортсмена
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
                <CardDescription>Основная информация о спортсмене</CardDescription>
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
                    <Label htmlFor="middleName">Отчество</Label>
                    <Input
                      id="middleName"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      placeholder="Иванович"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Дата рождения *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      max={new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sex">Пол *</Label>
                    <Select value={sex} onValueChange={setSex}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите пол" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Мужской</SelectItem>
                        <SelectItem value="female">Женский</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+996 XXX XXX XXX"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="iin">ИИН (персональный номер)</Label>
                    <Input
                      id="iin"
                      value={iin}
                      onChange={(e) => setIin(e.target.value)}
                      placeholder="14 цифр"
                      maxLength={14}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Training data */}
            <Card>
              <CardHeader>
                <CardTitle>Тренировочные данные</CardTitle>
                <CardDescription>Информация о тренере и клубе</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="trainer">Тренер *</Label>
                    <Select value={trainerId} onValueChange={setTrainerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тренера" />
                      </SelectTrigger>
                      <SelectContent>
                        {trainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={String(trainer.id)}>
                            {getTrainerName(trainer)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Клуб (автоматически)</Label>
                    <Input
                      value={selectedClub ? getLocalizedString(selectedClub.title) : 'Не определен'}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Вес (кг)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      min="0"
                      max="200"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="50.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Рост (см)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="0"
                      max="250"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="165"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dateStart">Дата начала занятий</Label>
                    <Input
                      id="dateStart"
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateMed">Мед. справка до</Label>
                    <Input
                      id="dateMed"
                      type="date"
                      value={dateMed}
                      onChange={(e) => setDateMed(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Место проживания</CardTitle>
                <CardDescription>Регион и город спортсмена</CardDescription>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Photo */}
            <Card>
              <CardHeader>
                <CardTitle>Фото</CardTitle>
                <CardDescription>Загрузите фото спортсмена</CardDescription>
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

            {/* Info */}
            <Card>
              <CardHeader>
                <CardTitle>Информация</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>При создании спортсмену автоматически присваивается:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Начальный пояс (10 гып - белый)</li>
                  <li>Уникальный ID</li>
                </ul>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Сохранение...' : 'Создать спортсмена'}
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
