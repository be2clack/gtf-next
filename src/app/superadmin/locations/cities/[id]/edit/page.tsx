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

interface Region {
  id: number
  code: string
  nameRu: string | null
  nameEn: string | null
  country?: { nameRu: string | null }
}

interface City {
  id: number
  code: string | null
  nameRu: string | null
  nameEn: string | null
  regionId: number
  sortOrder: number
  isActive: boolean
  region: Region & {
    country: { id: number; code: string; nameRu: string | null; nameEn: string | null }
  }
}

export default function EditCityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [city, setCity] = useState<City | null>(null)
  const [regions, setRegions] = useState<Region[]>([])
  const [formData, setFormData] = useState({
    code: '',
    nameRu: '',
    nameEn: '',
    regionId: '',
    sortOrder: 0,
    isActive: true,
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/superadmin/locations/cities/${id}`).then(res => res.json()),
      fetch('/api/superadmin/locations/regions').then(res => res.json()),
    ])
      .then(([cityData, regionsData]) => {
        setCity(cityData)
        setRegions(Array.isArray(regionsData) ? regionsData : [])
        setFormData({
          code: cityData.code || '',
          nameRu: cityData.nameRu || '',
          nameEn: cityData.nameEn || '',
          regionId: String(cityData.regionId),
          sortOrder: cityData.sortOrder || 0,
          isActive: cityData.isActive !== false,
        })
      })
      .catch(() => router.push('/superadmin/locations/cities'))
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/superadmin/locations/cities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          regionId: parseInt(formData.regionId),
        }),
      })

      if (response.ok) {
        router.push('/superadmin/locations/cities')
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
      const response = await fetch(`/api/superadmin/locations/cities/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/superadmin/locations/cities')
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

  if (!city) {
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
            <Link href="/superadmin/locations/cities">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{city.nameRu || city.code}</h1>
            <p className="text-muted-foreground">
              Редактирование города • {city.region?.nameRu}, {city.region?.country?.nameRu}
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
              <AlertDialogTitle>Удалить город?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Город будет удален навсегда.
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
          <CardTitle>Информация о городе</CardTitle>
          <CardDescription>
            Регион: {city.region?.nameRu} | Страна: {city.region?.country?.nameRu}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Код</Label>
                <Input
                  id="code"
                  placeholder="bishkek"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regionId">Регион *</Label>
                <Select
                  value={formData.regionId}
                  onValueChange={(value) => setFormData({ ...formData, regionId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите регион" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={String(region.id)}>
                        {region.nameRu || region.nameEn || region.code}
                        {region.country?.nameRu && ` (${region.country.nameRu})`}
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
                  placeholder="Бишкек"
                  value={formData.nameRu}
                  onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">Название (EN)</Label>
                <Input
                  id="nameEn"
                  placeholder="Bishkek"
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
                <Link href="/superadmin/locations/cities">Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
