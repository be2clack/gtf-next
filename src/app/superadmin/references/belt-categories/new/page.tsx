'use client'

import { useState, useEffect } from 'react'
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
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface AgeCategory {
  id: number
  code: string
  nameRu: string | null
  nameEn: string | null
}

interface Discipline {
  id: number
  code: string
  name: string
  nameRu: string | null
  hasBeltCategories?: boolean
}

export default function NewBeltCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [ageCategories, setAgeCategories] = useState<AgeCategory[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [formData, setFormData] = useState({
    ageCategoryId: '',
    disciplineId: '',
    beltMin: '',
    beltMax: '',
    name: '',
    sortOrder: '0',
    isActive: true,
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/superadmin/references/age-categories').then(res => res.json()),
      fetch('/api/superadmin/references/disciplines').then(res => res.json()),
    ])
      .then(([ageCats, discs]) => {
        setAgeCategories(Array.isArray(ageCats) ? ageCats.filter((a: AgeCategory) => a.id) : [])
        setDisciplines(Array.isArray(discs) ? discs.filter((d: Discipline) => d.hasBeltCategories !== false) : [])
      })
      .catch(() => {
        setAgeCategories([])
        setDisciplines([])
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/superadmin/references/belt-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/superadmin/references/belt-categories')
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка создания')
      }
    } catch {
      alert('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  // Format belt level for preview
  const getBeltName = (belt: number): string => {
    if (belt > 0) return `${belt} гып`
    if (belt < 0) return `${Math.abs(belt)} дан`
    return 'Не указан'
  }

  const beltPreview = () => {
    const min = parseInt(formData.beltMin)
    const max = parseInt(formData.beltMax)
    if (isNaN(min) || isNaN(max)) return null
    if (min === max) return getBeltName(max)
    return `${getBeltName(max)} - ${getBeltName(min)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/superadmin/references/belt-categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Новая категория поясов</h1>
          <p className="text-muted-foreground">Добавление категории по поясам</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Информация о категории</CardTitle>
          <CardDescription>Заполните данные для создания новой категории</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ageCategoryId">Возрастная категория *</Label>
              <Select
                value={formData.ageCategoryId}
                onValueChange={(value) => setFormData({ ...formData, ageCategoryId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите возрастную категорию" />
                </SelectTrigger>
                <SelectContent>
                  {ageCategories.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.nameRu || a.nameEn || a.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disciplineId">Дисциплина *</Label>
              <Select
                value={formData.disciplineId}
                onValueChange={(value) => setFormData({ ...formData, disciplineId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите дисциплину" />
                </SelectTrigger>
                <SelectContent>
                  {disciplines.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.nameRu || d.name} ({d.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="beltMin">Мин. пояс *</Label>
                <Input
                  id="beltMin"
                  type="number"
                  placeholder="4"
                  value={formData.beltMin}
                  onChange={(e) => setFormData({ ...formData, beltMin: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Положительные = гыпы (10=белый, 1=красно-черный)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="beltMax">Макс. пояс *</Label>
                <Input
                  id="beltMax"
                  type="number"
                  placeholder="3"
                  value={formData.beltMax}
                  onChange={(e) => setFormData({ ...formData, beltMax: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Отрицательные = даны (-1=1 дан, -6=6 дан)
                </p>
              </div>
            </div>

            {beltPreview() && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <span className="text-muted-foreground">Диапазон:</span>{' '}
                  <span className="font-medium">{beltPreview()}</span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                placeholder="Юноши 10-11 лет: 9 формальных комплексов (4-3 гып)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Порядок сортировки</Label>
              <Input
                id="sortOrder"
                type="number"
                placeholder="0"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
              />
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
                Создать категорию
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/superadmin/references/belt-categories">Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
