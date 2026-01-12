'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Upload, X, Info } from 'lucide-react'
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

const languages = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'kg', name: 'Кыргызча' },
]

export default function NewCompetitionPage() {
  const router = useRouter()
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
    if (!level) {
      toast.error('Выберите уровень соревнования')
      return
    }
    if (!venue.ru?.trim()) {
      toast.error('Укажите место проведения')
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
      if (photo) formData.append('photo', photo)

      const res = await fetch('/api/v1/competitions', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create competition')
      }

      const result = await res.json()
      toast.success('Соревнование успешно создано')
      router.push(`/admin/competitions/${result.data.id}`)
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка при создании соревнования')
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
          <h1 className="text-3xl font-bold tracking-tight">Новое соревнование</h1>
          <p className="text-muted-foreground">
            Заполните данные для создания соревнования
          </p>
        </div>
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
                          required={lang.code === 'ru'}
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
                        <Label htmlFor={`venue-${lang.code}`}>
                          Место проведения {lang.code === 'ru' && '*'}
                        </Label>
                        <Input
                          id={`venue-${lang.code}`}
                          value={venue[lang.code] || ''}
                          onChange={(e) => setVenue({ ...venue, [lang.code]: e.target.value })}
                          placeholder={`Адрес / спортзал на ${lang.name.toLowerCase()}`}
                          required={lang.code === 'ru'}
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
                <CardDescription>Даты проведения и регистрации</CardDescription>
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
                      max={startDate}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawalDeadline">Дедлайн отмены</Label>
                    <Input
                      id="withdrawalDeadline"
                      type="date"
                      value={withdrawalDeadline}
                      onChange={(e) => setWithdrawalDeadline(e.target.value)}
                      max={startDate}
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
                <CardDescription>Формат проведения соревнования</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">Тип соревнования *</Label>
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
                    <Label htmlFor="level">Уровень соревнования *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="rulesVersion">Версия правил</Label>
                  <Input
                    id="rulesVersion"
                    value={rulesVersion}
                    onChange={(e) => setRulesVersion(e.target.value)}
                    placeholder="2025"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Fees */}
            <Card>
              <CardHeader>
                <CardTitle>Оплата</CardTitle>
                <CardDescription>Регистрационные взносы</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Простая система:</strong> Один взнос за регистрацию.
                    <br />
                    <strong>Мультидисциплинарная:</strong> Базовый взнос + доплата за дополнительные дисциплины.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="registrationFee">Регистрационный взнос (простая система)</Label>
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
                    <p className="text-xs text-muted-foreground">Включает 1 дисциплину</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="additionalDisciplineFee">Доплата за дисциплину</Label>
                    <Input
                      id="additionalDisciplineFee"
                      type="number"
                      min="0"
                      step="100"
                      value={additionalDisciplineFee}
                      onChange={(e) => setAdditionalDisciplineFee(e.target.value)}
                      placeholder="500 KGS"
                    />
                    <p className="text-xs text-muted-foreground">За каждую дополнительную</p>
                  </div>
                </div>

                {(type === 'TEAM' || type === 'MIXED') && (
                  <div className="space-y-2">
                    <Label htmlFor="teamFeePerPerson">Командный взнос (за участника)</Label>
                    <Input
                      id="teamFeePerPerson"
                      type="number"
                      min="0"
                      step="100"
                      value={teamFeePerPerson}
                      onChange={(e) => setTeamFeePerPerson(e.target.value)}
                      placeholder="500 KGS"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Локация</CardTitle>
                <CardDescription>Регион и город проведения</CardDescription>
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
                <CardTitle>Постер</CardTitle>
                <CardDescription>Изображение соревнования</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {photoPreview ? (
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
                        onClick={removePhoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
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
                  <div className="space-y-0.5">
                    <Label>Мед. допуск</Label>
                    <p className="text-xs text-muted-foreground">
                      Требовать справку
                    </p>
                  </div>
                  <Switch
                    checked={medicalCheckRequired}
                    onCheckedChange={setMedicalCheckRequired}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Страховка</Label>
                    <p className="text-xs text-muted-foreground">
                      Требовать полис
                    </p>
                  </div>
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
                {isSubmitting ? 'Создание...' : 'Создать соревнование'}
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
