'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
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

interface Country {
  id: number
  code: string
  nameRu: string | null
  nameEn: string | null
  phoneCode: string | null
  flagEmoji: string | null
  sortOrder: number
  isActive: boolean
  _count: {
    regions: number
    federations: number
  }
}

export default function EditCountryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [country, setCountry] = useState<Country | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    nameRu: '',
    nameEn: '',
    phoneCode: '',
    flagEmoji: '',
    sortOrder: 0,
    isActive: true,
  })

  useEffect(() => {
    fetch(`/api/superadmin/locations/countries/${id}`)
      .then(res => res.json())
      .then(data => {
        setCountry(data)
        setFormData({
          code: data.code || '',
          nameRu: data.nameRu || '',
          nameEn: data.nameEn || '',
          phoneCode: data.phoneCode || '',
          flagEmoji: data.flagEmoji || '',
          sortOrder: data.sortOrder || 0,
          isActive: data.isActive !== false,
        })
      })
      .catch(() => router.push('/superadmin/locations/countries'))
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/superadmin/locations/countries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/superadmin/locations/countries')
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка сохранения')
      }
    } catch {
      alert('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      const response = await fetch(`/api/superadmin/locations/countries/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/superadmin/locations/countries')
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка удаления')
      }
    } catch {
      alert('Ошибка сети')
    } finally {
      setDeleting(false)
    }
  }

  if (!country) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/superadmin/locations/countries">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {country.flagEmoji} {country.nameRu || country.code}
            </h1>
            <p className="text-muted-foreground">Редактирование страны</p>
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
              <AlertDialogTitle>Удалить страну?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Страна будет удалена навсегда.
                {country._count.regions > 0 && (
                  <span className="block mt-2 text-destructive">
                    Внимание: у страны есть {country._count.regions} регионов
                  </span>
                )}
                {country._count.federations > 0 && (
                  <span className="block mt-2 text-destructive">
                    Внимание: у страны есть {country._count.federations} федераций
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleting}
              >
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Информация о стране</CardTitle>
          <CardDescription>
            Регионов: {country._count.regions} | Федераций: {country._count.federations}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Код (2 буквы) *</Label>
                <Input
                  id="code"
                  placeholder="KG"
                  maxLength={2}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
                <p className="text-xs text-muted-foreground">ISO 3166-1 alpha-2</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="flagEmoji">Флаг (эмодзи)</Label>
                <Input
                  id="flagEmoji"
                  placeholder="🇰🇬"
                  value={formData.flagEmoji}
                  onChange={(e) => setFormData({ ...formData, flagEmoji: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nameRu">Название (RU) *</Label>
                <Input
                  id="nameRu"
                  placeholder="Кыргызстан"
                  value={formData.nameRu}
                  onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">Название (EN) *</Label>
                <Input
                  id="nameEn"
                  placeholder="Kyrgyzstan"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phoneCode">Телефонный код</Label>
                <Input
                  id="phoneCode"
                  placeholder="+996"
                  value={formData.phoneCode}
                  onChange={(e) => setFormData({ ...formData, phoneCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Порядок сортировки</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Активна</Label>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/superadmin/locations/countries">Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
