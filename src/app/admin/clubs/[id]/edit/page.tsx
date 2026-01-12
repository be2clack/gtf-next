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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Region {
  id: number
  nameRu: string | null
  title: string | null
}

interface City {
  id: number
  nameRu: string | null
}

interface Club {
  id: number
  title: Record<string, string> | null
  description: Record<string, string> | null
  address: Record<string, string> | null
  phone: string | null
  instagram: string | null
  logo: string | null
  regionId: number | null
  cityId: number | null
}

export default function EditClubPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  // Form state - multilingual
  const [titleRu, setTitleRu] = React.useState('')
  const [titleEn, setTitleEn] = React.useState('')
  const [titleKg, setTitleKg] = React.useState('')
  const [descriptionRu, setDescriptionRu] = React.useState('')
  const [descriptionEn, setDescriptionEn] = React.useState('')
  const [descriptionKg, setDescriptionKg] = React.useState('')
  const [addressRu, setAddressRu] = React.useState('')
  const [addressEn, setAddressEn] = React.useState('')

  // Other fields
  const [phone, setPhone] = React.useState('')
  const [instagram, setInstagram] = React.useState('')
  const [regionId, setRegionId] = React.useState<string>('')
  const [cityId, setCityId] = React.useState<string>('')
  const [logo, setLogo] = React.useState<File | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const [existingLogo, setExistingLogo] = React.useState<string | null>(null)

  // Reference data
  const [regions, setRegions] = React.useState<Region[]>([])
  const [cities, setCities] = React.useState<City[]>([])

  // Load club data and reference data
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [clubRes, regionsRes] = await Promise.all([
          fetch(`/api/v1/clubs/${id}`),
          fetch('/api/v1/geolocation/regions'),
        ])

        if (!clubRes.ok) {
          toast.error('Клуб не найден')
          router.push('/admin/clubs')
          return
        }

        const clubData = await clubRes.json()
        const club: Club = clubData.data

        // Set form values
        const title = club.title || {}
        const description = club.description || {}
        const address = club.address || {}

        setTitleRu(title.ru || '')
        setTitleEn(title.en || '')
        setTitleKg(title.kg || '')
        setDescriptionRu(description.ru || '')
        setDescriptionEn(description.en || '')
        setDescriptionKg(description.kg || '')
        setAddressRu(address.ru || '')
        setAddressEn(address.en || '')
        setPhone(club.phone || '')
        setInstagram(club.instagram || '')
        setRegionId(club.regionId ? String(club.regionId) : '')
        setCityId(club.cityId ? String(club.cityId) : '')
        if (club.logo) {
          setExistingLogo(`/uploads/club/${club.logo}`)
        }

        if (regionsRes.ok) {
          const data = await regionsRes.json()
          setRegions(data.data || [])
        }

        // Load cities if region is set
        if (club.regionId) {
          const citiesRes = await fetch(`/api/v1/geolocation/regions/${club.regionId}/cities`)
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

  // Handle logo upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Размер логотипа не должен превышать 2MB')
        return
      }
      setLogo(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setExistingLogo(null)
    }
  }

  const removeLogo = () => {
    setLogo(null)
    setLogoPreview(null)
    setExistingLogo(null)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!titleRu.trim()) {
      toast.error('Укажите название клуба (на русском)')
      return
    }

    setIsSubmitting(true)

    try {
      const updateData = {
        title: {
          ru: titleRu.trim(),
          en: titleEn.trim() || titleRu.trim(),
          kg: titleKg.trim() || titleRu.trim(),
        },
        description: {
          ru: descriptionRu.trim(),
          en: descriptionEn.trim(),
          kg: descriptionKg.trim(),
        },
        address: {
          ru: addressRu.trim(),
          en: addressEn.trim(),
        },
        phone: phone.trim() || null,
        instagram: instagram.trim() || null,
        regionId: regionId || null,
        cityId: cityId || null,
      }

      const res = await fetch(`/api/v1/clubs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update club')
      }

      toast.success('Клуб успешно обновлен')
      router.push('/admin/clubs')
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка при обновлении клуба')
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
          <h1 className="text-3xl font-bold tracking-tight">Редактирование клуба</h1>
          <p className="text-muted-foreground">{titleRu}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Multilingual name */}
            <Card>
              <CardHeader>
                <CardTitle>Название клуба</CardTitle>
                <CardDescription>Название на разных языках</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ru">
                  <TabsList>
                    <TabsTrigger value="ru">Русский *</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="kg">Кыргызча</TabsTrigger>
                  </TabsList>
                  <TabsContent value="ru" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="titleRu">Название (русский) *</Label>
                      <Input
                        id="titleRu"
                        value={titleRu}
                        onChange={(e) => setTitleRu(e.target.value)}
                        placeholder="Название клуба"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descriptionRu">Описание (русский)</Label>
                      <Textarea
                        id="descriptionRu"
                        value={descriptionRu}
                        onChange={(e) => setDescriptionRu(e.target.value)}
                        placeholder="Описание клуба..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressRu">Адрес (русский)</Label>
                      <Input
                        id="addressRu"
                        value={addressRu}
                        onChange={(e) => setAddressRu(e.target.value)}
                        placeholder="Адрес клуба"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="en" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="titleEn">Title (English)</Label>
                      <Input
                        id="titleEn"
                        value={titleEn}
                        onChange={(e) => setTitleEn(e.target.value)}
                        placeholder="Club name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descriptionEn">Description (English)</Label>
                      <Textarea
                        id="descriptionEn"
                        value={descriptionEn}
                        onChange={(e) => setDescriptionEn(e.target.value)}
                        placeholder="Club description..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressEn">Address (English)</Label>
                      <Input
                        id="addressEn"
                        value={addressEn}
                        onChange={(e) => setAddressEn(e.target.value)}
                        placeholder="Club address"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="kg" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="titleKg">Аталышы (кыргызча)</Label>
                      <Input
                        id="titleKg"
                        value={titleKg}
                        onChange={(e) => setTitleKg(e.target.value)}
                        placeholder="Клубдун аталышы"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descriptionKg">Сүрөттөмө (кыргызча)</Label>
                      <Textarea
                        id="descriptionKg"
                        value={descriptionKg}
                        onChange={(e) => setDescriptionKg(e.target.value)}
                        placeholder="Клуб жөнүндө..."
                        rows={4}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
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
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+996 XXX XXX XXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="https://instagram.com/clubname"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Logo */}
            <Card>
              <CardHeader>
                <CardTitle>Логотип</CardTitle>
                <CardDescription>Логотип клуба</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logoPreview || existingLogo ? (
                    <div className="relative">
                      <img
                        src={logoPreview || existingLogo || undefined}
                        alt="Preview"
                        className="w-full aspect-square object-contain rounded-lg bg-muted"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeLogo}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Нажмите для загрузки</span>
                      <span className="text-xs text-muted-foreground mt-1">PNG, JPG до 2MB</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleLogoChange}
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
