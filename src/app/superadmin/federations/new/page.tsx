'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Country {
  id: number
  code: string
  nameRu: string | null
  nameEn: string | null
}

export default function NewFederationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameEn: '',
    countryId: '',
    currency: 'USD',
    timezone: 'UTC',
    domain: '',
    primaryLanguage: 'ru',
    contactEmail: '',
    contactPhone: '',
    description: '',
  })

  useEffect(() => {
    fetch('/api/superadmin/locations/countries')
      .then(res => res.json())
      .then(data => setCountries(Array.isArray(data) ? data : []))
      .catch(() => setCountries([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/superadmin/federations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/superadmin/federations/${data.id}`)
      } else {
        const error = await response.json()
        alert(error.message || 'Ошибка создания федерации')
      }
    } catch (error) {
      alert('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/superadmin/federations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Новая федерация</h1>
          <p className="text-muted-foreground">
            Создание национальной федерации тхэквондо
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
          <CardDescription>
            Заполните данные для создания новой федерации
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Основная информация */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Основная информация</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Код (2 буквы) *</Label>
                  <Input
                    id="code"
                    placeholder="kg"
                    maxLength={2}
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toLowerCase() })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    ISO 3166-1 alpha-2 код страны
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countryId">Страна *</Label>
                  <Select
                    value={formData.countryId}
                    onValueChange={(value) => setFormData({ ...formData, countryId: value })}
                    required
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
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Название (RU) *</Label>
                  <Input
                    id="name"
                    placeholder="Федерация Тхэквондо Кыргызстана"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nameEn">Название (EN)</Label>
                  <Input
                    id="nameEn"
                    placeholder="Kyrgyzstan Taekwondo Federation"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  placeholder="Краткое описание федерации..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Настройки */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Настройки</h3>

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
                      <SelectItem value="USD">USD - Доллар США</SelectItem>
                      <SelectItem value="EUR">EUR - Евро</SelectItem>
                      <SelectItem value="KGS">KGS - Кыргызский сом</SelectItem>
                      <SelectItem value="KZT">KZT - Казахстанский тенге</SelectItem>
                      <SelectItem value="RUB">RUB - Российский рубль</SelectItem>
                      <SelectItem value="UZS">UZS - Узбекский сум</SelectItem>
                      <SelectItem value="AED">AED - Дирхам ОАЭ</SelectItem>
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
                      <SelectItem value="Asia/Bishkek">Asia/Bishkek (UTC+6)</SelectItem>
                      <SelectItem value="Asia/Almaty">Asia/Almaty (UTC+6)</SelectItem>
                      <SelectItem value="Asia/Tashkent">Asia/Tashkent (UTC+5)</SelectItem>
                      <SelectItem value="Europe/Moscow">Europe/Moscow (UTC+3)</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai (UTC+4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Домен</Label>
                <Input
                  id="domain"
                  placeholder="kg.gtf.global"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Оставьте пустым для использования стандартного субдомена
                </p>
              </div>
            </div>

            {/* Контакты */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Контактная информация</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="info@federation.kg"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Телефон</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+996 XXX XXX XXX"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Создать федерацию
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/superadmin/federations">Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
