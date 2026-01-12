'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Country {
  id: number
  code: string
  nameRu: string | null
  nameEn: string | null
}

interface Federation {
  id: number
  code: string
  name: string
  nameEn: string | null
  countryId: number
  currency: string | null
  timezone: string | null
  domain: string | null
  customDomain: string | null
  status: string
  primaryLanguage: string | null
  languages: string[]
  contactEmail: string | null
  contactPhone: string | null
  description: Record<string, string> | null
  siteTitle: Record<string, string> | null
  metaDescription: Record<string, string> | null
  aboutText: Record<string, string> | null
  address: Record<string, string> | null
  instagram: string | null
  facebook: string | null
  youtube: string | null
  phones: string[]
  logo: string | null
  heroBackground: string | null
  country: { id: number; code: string; nameRu: string | null; nameEn: string | null }
}

export default function EditFederationPage() {
  const router = useRouter()
  const params = useParams()
  const federationId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [federation, setFederation] = useState<Federation | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    countryId: '',
    currency: 'USD',
    timezone: 'UTC',
    domain: '',
    customDomain: '',
    status: 'ACTIVE',
    primaryLanguage: 'ru',
    contactEmail: '',
    contactPhone: '',
    descriptionRu: '',
    descriptionEn: '',
    siteTitleRu: '',
    siteTitleEn: '',
    aboutTextRu: '',
    aboutTextEn: '',
    addressRu: '',
    addressEn: '',
    instagram: '',
    facebook: '',
    youtube: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/superadmin/locations/countries').then(res => res.json()),
      fetch(`/api/superadmin/federations/${federationId}`).then(res => res.json()),
    ]).then(([countriesData, federationData]) => {
      setCountries(Array.isArray(countriesData) ? countriesData : [])
      if (federationData && !federationData.error) {
        setFederation(federationData)
        setFormData({
          name: federationData.name || '',
          nameEn: federationData.nameEn || '',
          countryId: String(federationData.countryId) || '',
          currency: federationData.currency || 'USD',
          timezone: federationData.timezone || 'UTC',
          domain: federationData.domain || '',
          customDomain: federationData.customDomain || '',
          status: federationData.status || 'ACTIVE',
          primaryLanguage: federationData.primaryLanguage || 'ru',
          contactEmail: federationData.contactEmail || '',
          contactPhone: federationData.contactPhone || '',
          descriptionRu: federationData.description?.ru || '',
          descriptionEn: federationData.description?.en || '',
          siteTitleRu: federationData.siteTitle?.ru || '',
          siteTitleEn: federationData.siteTitle?.en || '',
          aboutTextRu: federationData.aboutText?.ru || '',
          aboutTextEn: federationData.aboutText?.en || '',
          addressRu: federationData.address?.ru || '',
          addressEn: federationData.address?.en || '',
          instagram: federationData.instagram || '',
          facebook: federationData.facebook || '',
          youtube: federationData.youtube || '',
        })
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [federationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/superadmin/federations/${federationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          nameEn: formData.nameEn || null,
          countryId: formData.countryId,
          currency: formData.currency,
          timezone: formData.timezone,
          domain: formData.domain,
          customDomain: formData.customDomain || null,
          status: formData.status,
          primaryLanguage: formData.primaryLanguage,
          contactEmail: formData.contactEmail || null,
          contactPhone: formData.contactPhone || null,
          description: {
            ru: formData.descriptionRu,
            en: formData.descriptionEn,
          },
          siteTitle: {
            ru: formData.siteTitleRu,
            en: formData.siteTitleEn,
          },
          aboutText: {
            ru: formData.aboutTextRu,
            en: formData.aboutTextEn,
          },
          address: {
            ru: formData.addressRu,
            en: formData.addressEn,
          },
          instagram: formData.instagram || null,
          facebook: formData.facebook || null,
          youtube: formData.youtube || null,
        }),
      })

      if (response.ok) {
        router.push(`/superadmin/federations/${federationId}`)
      } else {
        const error = await response.json()
        alert(error.message || 'Ошибка сохранения')
      }
    } catch {
      alert('Ошибка сети')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!federation) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Федерация не найдена</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/superadmin/federations/${federationId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Редактирование {federation.code.toUpperCase()}</h1>
            <Badge variant={federation.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {federation.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{federation.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">Основное</TabsTrigger>
            <TabsTrigger value="content">Контент</TabsTrigger>
            <TabsTrigger value="contacts">Контакты</TabsTrigger>
            <TabsTrigger value="social">Соц. сети</TabsTrigger>
          </TabsList>

          {/* Основное */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
                <CardDescription>Базовые настройки федерации</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Название (RU) *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameEn">Название (EN)</Label>
                    <Input
                      id="nameEn"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="countryId">Страна</Label>
                    <Select
                      value={formData.countryId}
                      onValueChange={(value) => setFormData({ ...formData, countryId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label htmlFor="status">Статус</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Активна</SelectItem>
                        <SelectItem value="INACTIVE">Неактивна</SelectItem>
                        <SelectItem value="SUSPENDED">Приостановлена</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="primaryLanguage">Основной язык</Label>
                    <Select
                      value={formData.primaryLanguage}
                      onValueChange={(value) => setFormData({ ...formData, primaryLanguage: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ky">Кыргызча</SelectItem>
                        <SelectItem value="kk">Казахша</SelectItem>
                        <SelectItem value="uz">O'zbek</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="KGS">KGS</SelectItem>
                        <SelectItem value="KZT">KZT</SelectItem>
                        <SelectItem value="RUB">RUB</SelectItem>
                        <SelectItem value="UZS">UZS</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Часовой пояс</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Asia/Bishkek">Asia/Bishkek</SelectItem>
                        <SelectItem value="Asia/Almaty">Asia/Almaty</SelectItem>
                        <SelectItem value="Asia/Tashkent">Asia/Tashkent</SelectItem>
                        <SelectItem value="Europe/Moscow">Europe/Moscow</SelectItem>
                        <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="domain">Домен</Label>
                    <Input
                      id="domain"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customDomain">Кастомный домен</Label>
                    <Input
                      id="customDomain"
                      placeholder="taekwondo.kg"
                      value={formData.customDomain}
                      onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Контент */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Описание и контент</CardTitle>
                <CardDescription>Текстовый контент для сайта федерации</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteTitleRu">Заголовок сайта (RU)</Label>
                    <Input
                      id="siteTitleRu"
                      value={formData.siteTitleRu}
                      onChange={(e) => setFormData({ ...formData, siteTitleRu: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteTitleEn">Заголовок сайта (EN)</Label>
                    <Input
                      id="siteTitleEn"
                      value={formData.siteTitleEn}
                      onChange={(e) => setFormData({ ...formData, siteTitleEn: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="descriptionRu">Описание (RU)</Label>
                    <Textarea
                      id="descriptionRu"
                      rows={3}
                      value={formData.descriptionRu}
                      onChange={(e) => setFormData({ ...formData, descriptionRu: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionEn">Описание (EN)</Label>
                    <Textarea
                      id="descriptionEn"
                      rows={3}
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="aboutTextRu">О федерации (RU)</Label>
                    <Textarea
                      id="aboutTextRu"
                      rows={5}
                      value={formData.aboutTextRu}
                      onChange={(e) => setFormData({ ...formData, aboutTextRu: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aboutTextEn">О федерации (EN)</Label>
                    <Textarea
                      id="aboutTextEn"
                      rows={5}
                      value={formData.aboutTextEn}
                      onChange={(e) => setFormData({ ...formData, aboutTextEn: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Контакты */}
          <TabsContent value="contacts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Контактная информация</CardTitle>
                <CardDescription>Контакты федерации</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Телефон</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="addressRu">Адрес (RU)</Label>
                    <Textarea
                      id="addressRu"
                      rows={2}
                      value={formData.addressRu}
                      onChange={(e) => setFormData({ ...formData, addressRu: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressEn">Адрес (EN)</Label>
                    <Textarea
                      id="addressEn"
                      rows={2}
                      value={formData.addressEn}
                      onChange={(e) => setFormData({ ...formData, addressEn: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Соц. сети */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Социальные сети</CardTitle>
                <CardDescription>Ссылки на социальные сети федерации</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      placeholder="https://instagram.com/..."
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      placeholder="https://facebook.com/..."
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      placeholder="https://youtube.com/..."
                      value={formData.youtube}
                      onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-4 pt-6">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Сохранить изменения
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/superadmin/federations/${federationId}`}>Отмена</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
