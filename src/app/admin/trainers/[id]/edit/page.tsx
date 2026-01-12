'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

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

interface Trainer {
  id: number
  firstName: string | null
  lastName: string | null
  middleName: string | null
  dateOfBirth: string | null
  phone: string | null
  photo: string | null
  clubId: number | null
  regionId: number | null
  cityId: number | null
  rank: string | null
  position: string | null
  instagram: string | null
  description: string | null
  contacts: string | null
  dateStart: string | null
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

const TRAINER_RANKS = [
  { value: 'COACH', label: 'Тренер' },
  { value: 'SENIOR_COACH', label: 'Старший тренер' },
  { value: 'HEAD_COACH', label: 'Главный тренер' },
]

export default function EditTrainerPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  // Form state
  const [lastName, setLastName] = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [middleName, setMiddleName] = React.useState('')
  const [dateOfBirth, setDateOfBirth] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [clubId, setClubId] = React.useState<string>('')
  const [regionId, setRegionId] = React.useState<string>('')
  const [cityId, setCityId] = React.useState<string>('')
  const [rank, setRank] = React.useState<string>('COACH')
  const [position, setPosition] = React.useState('')
  const [instagram, setInstagram] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [contacts, setContacts] = React.useState('')
  const [dateStart, setDateStart] = React.useState('')
  const [photo, setPhoto] = React.useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null)
  const [existingPhoto, setExistingPhoto] = React.useState<string | null>(null)

  // Reference data
  const [clubs, setClubs] = React.useState<Club[]>([])
  const [regions, setRegions] = React.useState<Region[]>([])
  const [cities, setCities] = React.useState<City[]>([])

  // Load trainer data and reference data
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [trainerRes, clubsRes, regionsRes] = await Promise.all([
          fetch(`/api/v1/trainers/${id}`),
          fetch('/api/v1/clubs'),
          fetch('/api/v1/geolocation/regions'),
        ])

        if (!trainerRes.ok) {
          toast.error('Тренер не найден')
          router.push('/admin/trainers')
          return
        }

        const trainerData = await trainerRes.json()
        const trainer: Trainer = trainerData.data

        // Set form values
        setLastName(trainer.lastName || '')
        setFirstName(trainer.firstName || '')
        setMiddleName(trainer.middleName || '')
        setDateOfBirth(trainer.dateOfBirth ? trainer.dateOfBirth.split('T')[0] : '')
        setPhone(trainer.phone || '')
        setClubId(trainer.clubId ? String(trainer.clubId) : '')
        setRegionId(trainer.regionId ? String(trainer.regionId) : '')
        setCityId(trainer.cityId ? String(trainer.cityId) : '')
        setRank(trainer.rank || 'COACH')
        setPosition(trainer.position || '')
        setInstagram(trainer.instagram || '')
        setDescription(trainer.description || '')
        setContacts(trainer.contacts || '')
        setDateStart(trainer.dateStart ? trainer.dateStart.split('T')[0] : '')
        if (trainer.photo) {
          setExistingPhoto(`/uploads/trainer/${trainer.photo}`)
        }

        if (clubsRes.ok) {
          const data = await clubsRes.json()
          setClubs(data.data || [])
        }

        if (regionsRes.ok) {
          const data = await regionsRes.json()
          setRegions(data.data || [])
        }

        // Load cities if region is set
        if (trainer.regionId) {
          const citiesRes = await fetch(`/api/v1/geolocation/regions/${trainer.regionId}/cities`)
          if (citiesRes.ok) {
            const citiesData = await citiesRes.json()
            setCities(citiesData.data || [])
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        toast.error('Ошибка загрузки данных')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id, router])

  // Load cities when region changes
  React.useEffect(() => {
    if (!regionId || isLoading) {
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
  }, [regionId, isLoading])

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
      setExistingPhoto(null)
    }
  }

  const removePhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
    setExistingPhoto(null)
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

    setIsSubmitting(true)

    try {
      const updateData = {
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        middleName: middleName.trim() || null,
        dateOfBirth: dateOfBirth || null,
        phone: phone.trim() || null,
        clubId: clubId || null,
        regionId: regionId || null,
        cityId: cityId || null,
        rank: rank || 'COACH',
        position: position.trim() || null,
        instagram: instagram.trim() || null,
        description: description.trim() || null,
        contacts: contacts.trim() || null,
        dateStart: dateStart || null,
      }

      const res = await fetch(`/api/v1/trainers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update trainer')
      }

      toast.success('Тренер успешно обновлен')
      router.push('/admin/trainers')
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка при обновлении тренера')
    } finally {
      setIsSubmitting(false)
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
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
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
          <h1 className="text-3xl font-bold tracking-tight">Редактирование тренера</h1>
          <p className="text-muted-foreground">
            {lastName} {firstName} {middleName}
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
                <CardDescription>Основная информация о тренере</CardDescription>
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Дата рождения</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
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
              </CardContent>
            </Card>

            {/* Work data */}
            <Card>
              <CardHeader>
                <CardTitle>Рабочие данные</CardTitle>
                <CardDescription>Информация о месте работы и должности</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="club">Клуб</Label>
                    <Select value={clubId} onValueChange={setClubId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите клуб" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubs.map((club) => (
                          <SelectItem key={club.id} value={String(club.id)}>
                            {getLocalizedString(club.title)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rank">Звание</Label>
                    <Select value={rank} onValueChange={setRank}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите звание" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRAINER_RANKS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="position">Должность</Label>
                    <Input
                      id="position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="Тренер по таэквон-до"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateStart">Дата начала работы</Label>
                    <Input
                      id="dateStart"
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="description">Описание / Биография</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Краткое описание тренера, достижения..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location & Contacts */}
            <Card>
              <CardHeader>
                <CardTitle>Местоположение и контакты</CardTitle>
                <CardDescription>Регион и контактная информация</CardDescription>
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

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contacts">Дополнительные контакты</Label>
                    <Input
                      id="contacts"
                      value={contacts}
                      onChange={(e) => setContacts(e.target.value)}
                      placeholder="Telegram, WhatsApp и др."
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
                <CardDescription>Фото тренера</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {photoPreview || existingPhoto ? (
                    <div className="relative">
                      <img
                        src={photoPreview || existingPhoto || undefined}
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

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
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
