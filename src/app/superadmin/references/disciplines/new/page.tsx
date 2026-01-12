'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

const disciplineTypes = [
  { value: 'HYONG', label: 'Туль (Hyong)' },
  { value: 'MASSOGI', label: 'Массоги (Sparring)' },
  { value: 'POINT_STOP', label: 'Поинт-стоп (Point Stop)' },
  { value: 'TEAM_HYONG', label: 'Командный туль (Team Hyong)' },
  { value: 'TEAM_MASSOGI', label: 'Командный массоги (Team Sparring)' },
  { value: 'TEAM_POINT_STOP', label: 'Командный поинт-стоп (Team Point Stop)' },
  { value: 'SPECIAL_TECHNIQUE', label: 'Специальная техника' },
  { value: 'POWER_BREAKING', label: 'Силовое разбивание' },
]

export default function NewDisciplinePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    nameRu: '',
    nameEn: '',
    type: 'MASSOGI',
    hasWeightCategories: true,
    hasBeltCategories: true,
    teamSize: '',
    description: '',
    sortOrder: 0,
    isActive: true,
  })

  const isTeamDiscipline = formData.type.startsWith('TEAM_')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/superadmin/references/disciplines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          teamSize: formData.teamSize ? parseInt(formData.teamSize) : null,
        }),
      })

      if (response.ok) {
        router.push('/superadmin/references/disciplines')
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
          <Link href="/superadmin/references/disciplines">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Новая дисциплина</h1>
          <p className="text-muted-foreground">
            Добавление спортивной дисциплины
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Информация о дисциплине</CardTitle>
          <CardDescription>
            Заполните данные для создания новой дисциплины
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Код *</Label>
                <Input
                  id="code"
                  placeholder="massogi"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Уникальный код дисциплины (латиница)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Тип дисциплины *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplineTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
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
                  placeholder="Массоги"
                  value={formData.nameRu}
                  onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameEn">Название (EN)</Label>
                <Input
                  id="nameEn"
                  placeholder="Sparring"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasWeightCategories"
                  checked={formData.hasWeightCategories}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasWeightCategories: checked })}
                />
                <Label htmlFor="hasWeightCategories">Весовые категории</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="hasBeltCategories"
                  checked={formData.hasBeltCategories}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasBeltCategories: checked })}
                />
                <Label htmlFor="hasBeltCategories">Категории поясов</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Активна</Label>
              </div>
            </div>

            {isTeamDiscipline && (
              <div className="space-y-2">
                <Label htmlFor="teamSize">Размер команды</Label>
                <Input
                  id="teamSize"
                  type="number"
                  min="2"
                  max="10"
                  placeholder="5"
                  value={formData.teamSize}
                  onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                  className="max-w-[120px]"
                />
                <p className="text-xs text-muted-foreground">
                  Количество участников в команде
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                placeholder="Описание дисциплины..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Порядок сортировки</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="max-w-[120px]"
              />
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Создать дисциплину
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/superadmin/references/disciplines">Отмена</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
