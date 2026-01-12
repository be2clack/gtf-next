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
  hasBeltCategories?: boolean
}

export default function NewBeltCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    minLevel: '',
    maxLevel: '',
    disciplineId: '',
    isActive: true,
  })

  useEffect(() => {
    fetch('/api/superadmin/references/disciplines')
      .then(res => res.json())
      .then(data => setDisciplines(Array.isArray(data) ? data.filter((d: Discipline) => d.hasBeltCategories !== false) : []))
      .catch(() => setDisciplines([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/superadmin/references/belt-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minLevel: parseInt(formData.minLevel) || 0,
          maxLevel: parseInt(formData.maxLevel) || 0,
          disciplineId: formData.disciplineId ? parseInt(formData.disciplineId) : null,
        }),
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

  // Format belt level for display
  const formatBeltLevel = (level: number): string => {
    if (level > 0) return `${level} гып`
    if (level <= 0) return `${Math.abs(level) || 1} дан`
    return String(level)
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
          <p className="text-muted-foreground">Добавление категории поясов</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Информация о категории</CardTitle>
          <CardDescription>Заполните данные для создания новой категории поясов</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Код *</Label>
                <Input
                  id="code"
                  placeholder="gup_10_8"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Название *</Label>
                <Input
                  id="name"
                  placeholder="10-8 гып"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minLevel">Мин. уровень *</Label>
                <Input
                  id="minLevel"
                  type="number"
                  placeholder="10"
                  value={formData.minLevel}
                  onChange={(e) => setFormData({ ...formData, minLevel: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Положительные: гыпы (10=белый). Отрицательные/ноль: даны (-1=1 дан)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLevel">Макс. уровень *</Label>
                <Input
                  id="maxLevel"
                  type="number"
                  placeholder="8"
                  value={formData.maxLevel}
                  onChange={(e) => setFormData({ ...formData, maxLevel: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.minLevel && formData.maxLevel ? (
                    `Диапазон: ${formatBeltLevel(parseInt(formData.minLevel))} — ${formatBeltLevel(parseInt(formData.maxLevel))}`
                  ) : 'Пример: 10-8 гып или 1-3 дан'}
                </p>
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
                <Link href="/superadmin/references/belt-categories">Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
