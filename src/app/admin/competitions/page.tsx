'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Trophy, Calendar, Users, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface Competition {
  id: number
  title: string
  photo: string | null
  startDate: string
  endDate: string
  status: string
  level: string
  type: string
  isPaid: boolean
  city: { nameRu: string } | null
  _count: {
    registrations: number
    categories: number
  }
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT: { label: 'Черновик', variant: 'secondary' },
  PUBLISHED: { label: 'Опубликовано', variant: 'outline' },
  REGISTRATION_OPEN: { label: 'Регистрация', variant: 'default' },
  REGISTRATION_CLOSED: { label: 'Регистрация закрыта', variant: 'secondary' },
  DRAW_COMPLETED: { label: 'Жеребьевка', variant: 'outline' },
  ONGOING: { label: 'Проходит', variant: 'default' },
  COMPLETED: { label: 'Завершено', variant: 'secondary' },
  CANCELLED: { label: 'Отменено', variant: 'destructive' },
}

const levelLabels: Record<string, string> = {
  CLUB: 'Клубный',
  REGIONAL: 'Региональный',
  NATIONAL: 'Национальный',
  INTERNATIONAL: 'Международный',
}

export default function AdminCompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    fetchCompetitions()
  }, [search])

  async function fetchCompetitions() {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('limit', '100')

      const res = await fetch(`/api/v1/competitions?${params}`)
      const data = await res.json()

      if (data.success) {
        setCompetitions(data.data)
      }
    } catch (error) {
      toast.error('Ошибка загрузки соревнований')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Вы уверены, что хотите удалить это соревнование?')) return

    try {
      const res = await fetch(`/api/v1/competitions/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        toast.success('Соревнование удалено')
        fetchCompetitions()
      } else {
        toast.error(data.error || 'Ошибка удаления')
      }
    } catch (error) {
      toast.error('Ошибка удаления соревнования')
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/v1/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate'),
          level: formData.get('level') || 'NATIONAL',
          type: formData.get('type') || 'MIXED',
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Соревнование создано')
        setIsCreateOpen(false)
        fetchCompetitions()
      } else {
        toast.error(data.error || 'Ошибка создания')
      }
    } catch (error) {
      toast.error('Ошибка создания соревнования')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Соревнования</h1>
          <p className="text-muted-foreground">Управление соревнованиями федерации</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Создать соревнование
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новое соревнование</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Название *</label>
                <Input name="title" required placeholder="Чемпионат..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Дата начала *</label>
                  <Input name="startDate" type="date" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Дата окончания *</label>
                  <Input name="endDate" type="date" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Уровень</label>
                <select name="level" className="w-full border rounded-md p-2">
                  {Object.entries(levelLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Тип</label>
                <select name="type" className="w-full border rounded-md p-2">
                  <option value="MIXED">Смешанный</option>
                  <option value="PERSONAL">Личный</option>
                  <option value="TEAM">Командный</option>
                </select>
              </div>
              <Button type="submit" className="w-full">Создать</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск соревнований..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
          ) : competitions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Соревнования не найдены</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Соревнование</TableHead>
                  <TableHead>Даты</TableHead>
                  <TableHead>Место</TableHead>
                  <TableHead>Уровень</TableHead>
                  <TableHead className="text-center">Участники</TableHead>
                  <TableHead className="text-center">Статус</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitions.map((comp) => (
                  <TableRow key={comp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          {comp.photo ? (
                            <img src={comp.photo} alt="" className="w-full h-full rounded object-cover" />
                          ) : (
                            <Trophy className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{comp.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {comp._count.categories} категорий
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(comp.startDate)}
                        {comp.startDate !== comp.endDate && (
                          <> - {formatDate(comp.endDate)}</>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {comp.city ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {comp.city.nameRu}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {levelLabels[comp.level] || comp.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {comp._count.registrations}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusLabels[comp.status]?.variant || 'outline'}>
                        {statusLabels[comp.status]?.label || comp.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/competitions/${comp.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Просмотр
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/competitions/${comp.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Редактировать
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(comp.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
