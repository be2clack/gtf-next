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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, UserCog, Users, Building2 } from 'lucide-react'
import { toast } from 'sonner'

// Helper to extract string from multilingual JSON field
function getLocalizedString(value: unknown, locale = 'ru'): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, string>
    return obj[locale] || obj['ru'] || obj['en'] || Object.values(obj)[0] || ''
  }
  return String(value)
}

interface Trainer {
  id: number
  fio: string | null
  firstName: string | null
  lastName: string | null
  phone: string | null
  photo: string | null
  rank: string
  club: { title: unknown } | null
  city: { nameRu: string } | null
  _count: { sportsmen: number }
}

const rankLabels: Record<string, string> = {
  COACH: 'Тренер',
  SENIOR_COACH: 'Старший тренер',
  HEAD_COACH: 'Главный тренер',
  ASSISTANT_COACH: 'Помощник тренера',
}

export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    fetchTrainers()
  }, [search])

  async function fetchTrainers() {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('limit', '100')

      const res = await fetch(`/api/v1/trainers?${params}`)
      const data = await res.json()

      if (data.success) {
        setTrainers(data.data)
      }
    } catch (error) {
      toast.error('Ошибка загрузки тренеров')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Вы уверены, что хотите удалить этого тренера?')) return

    try {
      const res = await fetch(`/api/v1/trainers/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        toast.success('Тренер удален')
        fetchTrainers()
      } else {
        toast.error(data.error || 'Ошибка удаления')
      }
    } catch (error) {
      toast.error('Ошибка удаления тренера')
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/v1/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          middleName: formData.get('middleName'),
          phone: formData.get('phone'),
          rank: formData.get('rank') || 'COACH',
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Тренер создан')
        setIsCreateOpen(false)
        fetchTrainers()
      } else {
        toast.error(data.error || 'Ошибка создания')
      }
    } catch (error) {
      toast.error('Ошибка создания тренера')
    }
  }

  const getFullName = (trainer: Trainer) => {
    return trainer.fio || `${trainer.lastName || ''} ${trainer.firstName || ''}`.trim() || 'Без имени'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Тренеры</h1>
          <p className="text-muted-foreground">Управление тренерами федерации</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить тренера
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый тренер</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Фамилия *</label>
                <Input name="lastName" required placeholder="Иванов" />
              </div>
              <div>
                <label className="text-sm font-medium">Имя *</label>
                <Input name="firstName" required placeholder="Иван" />
              </div>
              <div>
                <label className="text-sm font-medium">Отчество</label>
                <Input name="middleName" placeholder="Иванович" />
              </div>
              <div>
                <label className="text-sm font-medium">Телефон</label>
                <Input name="phone" placeholder="+996 XXX XXX XXX" />
              </div>
              <div>
                <label className="text-sm font-medium">Должность</label>
                <select name="rank" className="w-full border rounded-md p-2">
                  <option value="COACH">Тренер</option>
                  <option value="SENIOR_COACH">Старший тренер</option>
                  <option value="HEAD_COACH">Главный тренер</option>
                  <option value="ASSISTANT_COACH">Помощник тренера</option>
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
                placeholder="Поиск тренеров..."
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
          ) : trainers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Тренеры не найдены</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тренер</TableHead>
                  <TableHead>Клуб</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead>Должность</TableHead>
                  <TableHead className="text-center">Спортсмены</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainers.map((trainer) => (
                  <TableRow key={trainer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {trainer.photo ? (
                            <img src={trainer.photo} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <UserCog className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{getFullName(trainer)}</div>
                          {trainer.phone && (
                            <div className="text-sm text-muted-foreground">{trainer.phone}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {trainer.club?.title ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {getLocalizedString(trainer.club.title) || '—'}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell>{trainer.city?.nameRu || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rankLabels[trainer.rank] || trainer.rank}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {trainer._count.sportsmen}
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
                            <Link href={`/admin/trainers/${trainer.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Редактировать
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(trainer.id)}
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
