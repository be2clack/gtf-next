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

interface Discipline {
  id: number
  code: string
  name: string
  nameRu: string | null
  hasWeightCategories?: boolean
}

export default function NewWeightCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    minWeight: '',
    maxWeight: '',
    gender: 'MALE',
    disciplineId: '',
    isActive: true,
  })

  useEffect(() => {
    fetch('/api/superadmin/references/disciplines')
      .then(res => res.json())
      .then(data => setDisciplines(Array.isArray(data) ? data.filter((d: Discipline) => d.hasWeightCategories !== false) : []))
      .catch(() => setDisciplines([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/superadmin/references/weight-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minWeight: parseFloat(formData.minWeight) || 0,
          maxWeight: parseFloat(formData.maxWeight) || 0,
          disciplineId: formData.disciplineId ? parseInt(formData.disciplineId) : null,
        }),
      })

      if (response.ok) {
        router.push('/superadmin/references/weight-categories')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/superadmin/references/weight-categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Новая весовая категория</h1>
          <p className="text-muted-foreground">Добавление весовой категории</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Информация о категории</CardTitle>
          <CardDescription>Заполните данные для создания новой весовой категории</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Код *</Label>
                <Input
                  id="code"
                  placeholder="m_54"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Название *</Label>
                <Input
                  id="name"
                  placeholder="до 54 кг"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="minWeight">Мин. вес (кг) *</Label>
                <Input
                  id="minWeight"
                  type="number"
                  step="0.1"
                  placeholder="50"
                  value={formData.minWeight}
                  onChange={(e) => setFormData({ ...formData, minWeight: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxWeight">Макс. вес (кг)</Label>
                <Input
                  id="maxWeight"
                  type="number"
                  step="0.1"
                  placeholder="54"
                  value={formData.maxWeight}
                  onChange={(e) => setFormData({ ...formData, maxWeight: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Оставьте пустым для открытой категории (X+ кг)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Пол *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Мужской</SelectItem>
                    <SelectItem value="FEMALE">Женский</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disciplineId">Дисциплина</Label>
              <Select
                value={formData.disciplineId}
                onValueChange={(value) => setFormData({ ...formData, disciplineId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все дисциплины" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все дисциплины</SelectItem>
                  {disciplines.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.nameRu || d.name} ({d.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Оставьте пустым если категория применима ко всем дисциплинам</p>
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
                <Link href="/superadmin/references/weight-categories">Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
