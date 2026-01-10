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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Scale, Trophy } from 'lucide-react'
import { toast } from 'sonner'

interface Judge {
  id: number
  firstName: string | null
  lastName: string | null
  patronymic: string | null
  phone: string | null
  email: string | null
  photo: string | null
  judgeRole: string
  judgeCategory: string
  certificateNumber: string | null
  isActive: boolean
  isInternational: boolean
  country: { nameRu: string; flagEmoji: string | null } | null
  _count: { competitionJudges: number; matchJudges: number }
}

const roleLabels: Record<string, string> = {
  JUDGE: 'Судья',
  ARBITER: 'Арбитр',
  REFEREE: 'Рефери',
  CORNER_JUDGE: 'Угловой судья',
  MIRROR_JUDGE: 'Зеркальный судья',
  LINE_JUDGE: 'Линейный судья',
  SECRETARY: 'Секретарь',
  DOCTOR: 'Врач',
  CLASSIFIER: 'Классификатор',
}

const categoryLabels: Record<string, string> = {
  INTERNATIONAL: 'Международная',
  NATIONAL: 'Национальная',
  REGIONAL: 'Региональная',
}

export default function AdminJudgesPage() {
  const [judges, setJudges] = useState<Judge[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    fetchJudges()
  }, [search])

  async function fetchJudges() {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('limit', '100')

      const res = await fetch(`/api/v1/judges?${params}`)
      const data = await res.json()

      if (data.success) {
        setJudges(data.data)
      }
    } catch (error) {
      toast.error('Ошибка загрузки судей')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Вы уверены, что хотите удалить этого судью?')) return

    try {
      const res = await fetch(`/api/v1/judges/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        toast.success('Судья удален')
        fetchJudges()
      } else {
        toast.error(data.error || 'Ошибка удаления')
      }
    } catch (error) {
      toast.error('Ошибка удаления судьи')
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/v1/judges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          patronymic: formData.get('patronymic'),
          phone: formData.get('phone'),
          email: formData.get('email'),
          judgeRole: formData.get('judgeRole') || 'JUDGE',
          judgeCategory: formData.get('judgeCategory') || 'NATIONAL',
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Судья создан')
        setIsCreateOpen(false)
        fetchJudges()
      } else {
        toast.error(data.error || 'Ошибка создания')
      }
    } catch (error) {
      toast.error('Ошибка создания судьи')
    }
  }

  const getFullName = (judge: Judge) => {
    return `${judge.lastName || ''} ${judge.firstName || ''} ${judge.patronymic || ''}`.trim() || 'Без имени'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Судьи</h1>
          <p className="text-muted-foreground">Управление судьями федерации</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить судью
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый судья</DialogTitle>
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
                <Input name="patronymic" placeholder="Иванович" />
              </div>
              <div>
                <label className="text-sm font-medium">Телефон</label>
                <Input name="phone" placeholder="+996 XXX XXX XXX" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input name="email" type="email" placeholder="email@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium">Роль</label>
                <select name="judgeRole" className="w-full border rounded-md p-2">
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Категория</label>
                <select name="judgeCategory" className="w-full border rounded-md p-2">
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
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
                placeholder="Поиск судей..."
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
          ) : judges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Судьи не найдены</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Судья</TableHead>
                  <TableHead>Страна</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead className="text-center">Соревнований</TableHead>
                  <TableHead className="text-center">Статус</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {judges.map((judge) => (
                  <TableRow key={judge.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {judge.photo ? (
                            <img src={judge.photo} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Scale className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{getFullName(judge)}</div>
                          {judge.certificateNumber && (
                            <div className="text-sm text-muted-foreground">#{judge.certificateNumber}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {judge.country ? (
                        <span>{judge.country.flagEmoji} {judge.country.nameRu}</span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {roleLabels[judge.judgeRole] || judge.judgeRole}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={judge.isInternational ? 'default' : 'secondary'}>
                        {categoryLabels[judge.judgeCategory] || judge.judgeCategory}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        <Trophy className="h-3 w-3 mr-1" />
                        {judge._count.competitionJudges}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={judge.isActive ? 'default' : 'secondary'}>
                        {judge.isActive ? 'Активен' : 'Неактивен'}
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
                            <Link href={`/admin/judges/${judge.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Редактировать
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(judge.id)}
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
