'use client'

import { useState, useEffect, use } from 'react'
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
}

interface Region {
  id: number
  code: string
  nameRu: string | null
  nameEn: string | null
  countryId: number
  sortOrder: number
  isActive: boolean
  country: Country
  _count: {
    cities: number
  }
}

export default function EditRegionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [region, setRegion] = useState<Region | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [formData, setFormData] = useState({
    code: '',
    nameRu: '',
    nameEn: '',
    countryId: '',
    sortOrder: 0,
    isActive: true,
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/superadmin/locations/regions/${id}`).then(res => res.json()),
      fetch('/api/superadmin/locations/countries').then(res => res.json()),
    ])
      .then(([regionData, countriesData]) => {
        setRegion(regionData)
        setCountries(Array.isArray(countriesData) ? countriesData : [])
        setFormData({
          code: regionData.code || '',
          nameRu: regionData.nameRu || '',
          nameEn: regionData.nameEn || '',
          countryId: String(regionData.countryId),
          sortOrder: regionData.sortOrder || 0,
          isActive: regionData.isActive !== false,
        })
      })
      .catch(() => router.push('/superadmin/locations/regions'))
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/superadmin/locations/regions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          countryId: parseInt(formData.countryId),
        }),
      })

      if (response.ok) {
        router.push('/superadmin/locations/regions')
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
      const response = await fetch(`/api/superadmin/locations/regions/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/superadmin/locations/regions')
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

  if (!region) {
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
            <Link href="/superadmin/locations/regions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{region.nameRu || region.code}</h1>
            <p className="text-muted-foreground">
              Редактирование региона • {region.country?.nameRu}
            </p>
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
              <AlertDialogTitle>Удалить регион?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Регион будет удален навсегда.
                {region._count.cities > 0 && (
                  <span className="block mt-2 text-destructive">
                    Внимание: у региона есть {region._count.cities} городов
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
          <CardTitle>Информация о регионе</CardTitle>
          <CardDescription>Городов: {region._count.cities}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Код *</Label>
                <Input
                  id="code"
                  placeholder="chui"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                  required
                />
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
                <Label htmlFor="nameRu">Название (RU) *</Label>
                <Input
                  id="nameRu"
                  placeholder="Чуйская область"
                  value={formData.nameRu}
                  onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">Название (EN)</Label>
                <Input
                  id="nameEn"
                  placeholder="Chui Region"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Порядок сортировки</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Активен</Label>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/superadmin/locations/regions">Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
