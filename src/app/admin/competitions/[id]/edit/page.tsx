'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Upload, X, Info, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

interface Region {
  id: number
  nameRu: string | null
  title: string | null
}

interface City {
  id: number
  nameRu: string | null
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

const teamTypeLabels: Record<string, string> = {
  club: 'Клубные команды',
  regional: 'Региональные команды',
  city: 'Городские команды',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликовано',
  REGISTRATION_OPEN: 'Регистрация открыта',
  REGISTRATION_CLOSED: 'Регистрация закрыта',
  DRAW_COMPLETED: 'Жеребьевка завершена',
  ONGOING: 'Проводится',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
}

const languages = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'kg', name: 'Кыргызча' },
]

export default function EditCompetitionPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params.id as string

  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('ru')

  // Form state - Multilingual
  const [title, setTitle] = React.useState<Record<string, string>>({ ru: '', en: '', kg: '' })
  const [description, setDescription] = React.useState<Record<string, string>>({ ru: '', en: '', kg: '' })
  const [venue, setVenue] = React.useState<Record<string, string>>({ ru: '', en: '', kg: '' })

  // Form state - Dates
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [registrationDeadline, setRegistrationDeadline] = React.useState('')
  const [withdrawalDeadline, setWithdrawalDeadline] = React.useState('')
  const [weighInDate, setWeighInDate] = React.useState('')

  // Form state - Competition type
  const [type, setType] = React.useState<string>('MIXED')
  const [teamType, setTeamType] = React.useState<string>('')
  const [level, setLevel] = React.useState<string>('REGIONAL')
  const [status, setStatus] = React.useState<string>('DRAFT')
  const [rulesVersion, setRulesVersion] = React.useState('2025')

  // Form state - Fees
  const [registrationFee, setRegistrationFee] = React.useState('')
  const [baseRegistrationFee, setBaseRegistrationFee] = React.useState('')
  const [additionalDisciplineFee, setAdditionalDisciplineFee] = React.useState('')
  const [teamFeePerPerson, setTeamFeePerPerson] = React.useState('')

  // Form state - Settings
  const [tatamiCount, setTatamiCount] = React.useState('2')
  const [medicalCheckRequired, setMedicalCheckRequired] = React.useState(true)
  const [insuranceRequired, setInsuranceRequired] = React.useState(true)

  // Form state - Location
  const [regionId, setRegionId] = React.useState<string>('')
  const [cityId, setCityId] = React.useState<string>('')

  // Form state - Photo
  const [photo, setPhoto] = React.useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = React.useState(false)

  // Reference data
  const [regions, setRegions] = React.useState<Region[]>([])
  const [cities, setCities] = React.useState<City[]>([])

  // Load competition and reference data
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [compRes, regionsRes] = await Promise.all([
          fetch(`/api/v1/competitions/${competitionId}`),
          fetch('/api/v1/geolocation/regions'),
        ])

        if (!compRes.ok) {
          throw new Error('Competition not found')
        }

        const compData = await compRes.json()
        const regionsData = await regionsRes.json()
        const comp = compData.data

        setRegions(regionsData.data || [])

        // Set form values
        // Handle multilingual fields
        if (typeof comp.title === 'object') {
          setTitle(comp.title || { ru: '', en: '', kg: '' })
        } else {
          setTitle({ ru: comp.title || '', en: '', kg: '' })
        }

        if (typeof comp.description === 'object') {
          setDescription(comp.description || { ru: '', en: '', kg: '' })
        } else {
          setDescription({ ru: comp.description || '', en: '', kg: '' })
        }

        if (typeof comp.venue === 'object') {
          setVenue(comp.venue || { ru: '', en: '', kg: '' })
        } else {
          setVenue({ ru: comp.venue || '', en: '', kg: '' })
        }

        // Dates
        setStartDate(comp.startDate ? comp.startDate.split('T')[0] : '')
        setEndDate(comp.endDate ? comp.endDate.split('T')[0] : '')
        setRegistrationDeadline(comp.registrationDeadline ? comp.registrationDeadline.split('T')[0] : '')
        setWithdrawalDeadline(comp.withdrawalDeadline ? comp.withdrawalDeadline.split('T')[0] : '')
        setWeighInDate(comp.weighInDate ? comp.weighInDate.split('T')[0] : '')

        // Type and level
        setType(comp.type || 'MIXED')
        setTeamType(comp.teamType || '')
        setLevel(comp.level || 'REGIONAL')
        setStatus(comp.status || 'DRAFT')
        setRulesVersion(comp.rulesVersion || '2025')

        // Fees
        setRegistrationFee(comp.registrationFee ? String(comp.registrationFee) : '')
        setBaseRegistrationFee(comp.baseRegistrationFee ? String(comp.baseRegistrationFee) : '')
        setAdditionalDisciplineFee(comp.additionalDisciplineFee ? String(comp.additionalDisciplineFee) : '')
        setTeamFeePerPerson(comp.teamRegistrationFeePerPerson ? String(comp.teamRegistrationFeePerPerson) : '')

        // Settings
        setTatamiCount(String(comp.tatamiCount || 2))
        setMedicalCheckRequired(comp.medicalCheckRequired !== false)
        setInsuranceRequired(comp.insuranceRequired !== false)

        // Location
        setRegionId(comp.regionId ? String(comp.regionId) : '')
        setCityId(comp.cityId ? String(comp.cityId) : '')

        // Photo
        if (comp.photo) {
          setPhotoPreview(`/uploads/competitions/${comp.photo}`)
        }

        // Load cities if region is set
        if (comp.regionId) {
          const citiesRes = await fetch(`/api/v1/geolocation/regions/${comp.regionId}/cities`)
          if (citiesRes.ok) {
            const citiesData = await citiesRes.json()
            setCities(citiesData.data || [])
          }
        }
      } catch (error) {
        console.error('Failed to load competition:', error)
        toast.error('Ошибка загрузки данных')
        router.push('/admin/competitions')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [competitionId, router])

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
      setRemovePhoto(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
    setRemovePhoto(true)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!title.ru?.trim()) {
      toast.error('Укажите название соревнования')
      return
    }
    if (!startDate) {
      toast.error('Укажите дату начала')
      return
    }
    if (!endDate) {
      toast.error('Укажите дату окончания')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()

      // Multilingual fields as JSON
      formData.append('title', JSON.stringify(title))
      formData.append('description', JSON.stringify(description))
      formData.append('venue', JSON.stringify(venue))

      // Dates
      formData.append('startDate', startDate)
      formData.append('endDate', endDate)
      if (registrationDeadline) formData.append('registrationDeadline', registrationDeadline)
      if (withdrawalDeadline) formData.append('withdrawalDeadline', withdrawalDeadline)
      if (weighInDate) formData.append('weighInDate', weighInDate)

      // Type and level
      formData.append('type', type)
      formData.append('level', level)
      formData.append('status', status)
      if (teamType) formData.append('teamType', teamType)
      if (rulesVersion) formData.append('rulesVersion', rulesVersion)

      // Fees
      if (registrationFee) formData.append('registrationFee', registrationFee)
      if (baseRegistrationFee) formData.append('baseRegistrationFee', baseRegistrationFee)
      if (additionalDisciplineFee) formData.append('additionalDisciplineFee', additionalDisciplineFee)
      if (teamFeePerPerson) formData.append('teamRegistrationFeePerPerson', teamFeePerPerson)

      // Settings
      formData.append('tatamiCount', tatamiCount)
      formData.append('medicalCheckRequired', medicalCheckRequired ? 'true' : 'false')
      formData.append('insuranceRequired', insuranceRequired ? 'true' : 'false')

      // Location
      if (regionId) formData.append('regionId', regionId)
      if (cityId) formData.append('cityId', cityId)

      // Photo
      if (photo) {
        formData.append('photo', photo)
      } else if (removePhoto) {
        formData.append('removePhoto', 'true')
      }

      const res = await fetch(`/api/v1/competitions/${competitionId}`, {
        method: 'PUT',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update competition')
      }

      toast.success('Соревнование успешно обновлено')
      router.push(`/admin/competitions/${competitionId}`)
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка при обновлении соревнования')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

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
            <h1 className="text-3xl font-bold tracking-tight">Редактирование соревнования</h1>
            <p className="text-muted-foreground">{title.ru}</p>
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

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic info with tabs for languages */}
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
                <CardDescription>Название и описание соревнования</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    {languages.map((lang) => (
                      <TabsTrigger key={lang.code} value={lang.code}>
                        {lang.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {languages.map((lang) => (
                    <TabsContent key={lang.code} value={lang.code} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`title-${lang.code}`}>
                          Название {lang.code === 'ru' && '*'}
                        </Label>
                        <Input
                          id={`title-${lang.code}`}
                          value={title[lang.code] || ''}
                          onChange={(e) => setTitle({ ...title, [lang.code]: e.target.value })}
                          placeholder={`Название на ${lang.name.toLowerCase()}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`description-${lang.code}`}>Описание</Label>
                        <Textarea
                          id={`description-${lang.code}`}
                          value={description[lang.code] || ''}
                          onChange={(e) => setDescription({ ...description, [lang.code]: e.target.value })}
                          placeholder={`Описание на ${lang.name.toLowerCase()}`}
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`venue-${lang.code}`}>Место проведения</Label>
                        <Input
                          id={`venue-${lang.code}`}
                          value={venue[lang.code] || ''}
                          onChange={(e) => setVenue({ ...venue, [lang.code]: e.target.value })}
                          placeholder={`Адрес / спортзал на ${lang.name.toLowerCase()}`}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Даты</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Дата начала *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Дата окончания *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="registrationDeadline">Дедлайн регистрации</Label>
                    <Input
                      id="registrationDeadline"
                      type="date"
                      value={registrationDeadline}
                      onChange={(e) => setRegistrationDeadline(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawalDeadline">Дедлайн отмены</Label>
                    <Input
                      id="withdrawalDeadline"
                      type="date"
                      value={withdrawalDeadline}
                      onChange={(e) => setWithdrawalDeadline(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weighInDate">Дата взвешивания</Label>
                    <Input
                      id="weighInDate"
                      type="date"
                      value={weighInDate}
                      onChange={(e) => setWeighInDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Type and Level */}
            <Card>
              <CardHeader>
                <CardTitle>Тип и уровень</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="type">Тип</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(typeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">Уровень</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите уровень" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(levelLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Статус</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(type === 'TEAM' || type === 'MIXED') && (
                  <div className="space-y-2">
                    <Label htmlFor="teamType">Тип команды</Label>
                    <Select value={teamType} onValueChange={setTeamType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип команды" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(teamTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fees */}
            <Card>
              <CardHeader>
                <CardTitle>Оплата</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationFee">Регистрационный взнос</Label>
                  <Input
                    id="registrationFee"
                    type="number"
                    min="0"
                    step="10"
                    value={registrationFee}
                    onChange={(e) => setRegistrationFee(e.target.value)}
                    placeholder="0 KGS"
                  />
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="baseRegistrationFee">Базовый взнос</Label>
                    <Input
                      id="baseRegistrationFee"
                      type="number"
                      min="0"
                      step="100"
                      value={baseRegistrationFee}
                      onChange={(e) => setBaseRegistrationFee(e.target.value)}
                      placeholder="1500 KGS"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="additionalDisciplineFee">За доп. дисциплину</Label>
                    <Input
                      id="additionalDisciplineFee"
                      type="number"
                      min="0"
                      step="100"
                      value={additionalDisciplineFee}
                      onChange={(e) => setAdditionalDisciplineFee(e.target.value)}
                      placeholder="500 KGS"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Локация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="region">Регион</Label>
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
                        <SelectValue placeholder="Выберите город" />
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
                <CardTitle>Постер</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {photoPreview && !removePhoto ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemovePhoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Нажмите для загрузки</span>
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

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Настройки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tatamiCount">Количество татами</Label>
                  <Input
                    id="tatamiCount"
                    type="number"
                    min="1"
                    max="20"
                    value={tatamiCount}
                    onChange={(e) => setTatamiCount(e.target.value)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label>Мед. допуск</Label>
                  <Switch
                    checked={medicalCheckRequired}
                    onCheckedChange={setMedicalCheckRequired}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Страховка</Label>
                  <Switch
                    checked={insuranceRequired}
                    onCheckedChange={setInsuranceRequired}
                  />
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
