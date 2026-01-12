'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Building2, Users, UserCog } from 'lucide-react'
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

interface Club {
  id: number
  title: unknown
  logo: string | null
  rating: number
  instagram: string | null
  country: { nameRu: string } | null
  region: { nameRu: string } | null
  city: { nameRu: string } | null
  _count: {
    sportsmen: number
    trainers: number
  }
}

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    fetchClubs()
  }, [search])

  async function fetchClubs() {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('limit', '100')

      const res = await fetch(`/api/v1/clubs?${params}`)
      const data = await res.json()

      if (data.success) {
        setClubs(data.data)
      }
    } catch (error) {
      toast.error('Ошибка загрузки клубов')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Вы уверены, что хотите удалить этот клуб?')) return

    try {
      const res = await fetch(`/api/v1/clubs/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        toast.success('Клуб удален')
        fetchClubs()
      } else {
        toast.error(data.error || 'Ошибка удаления')
      }
    } catch (error) {
      toast.error('Ошибка удаления клуба')
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/v1/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          instagram: formData.get('instagram'),
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Клуб создан')
        setIsCreateOpen(false)
        fetchClubs()
      } else {
        toast.error(data.error || 'Ошибка создания')
      }
    } catch (error) {
      toast.error('Ошибка создания клуба')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Клубы</h1>
          <p className="text-muted-foreground">Управление клубами федерации</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить клуб
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый клуб</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Название</label>
                <Input name="title" required placeholder="Введите название клуба" />
              </div>
              <div>
                <label className="text-sm font-medium">Instagram</label>
                <Input name="instagram" placeholder="@username" />
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
                placeholder="Поиск клубов..."
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
          ) : clubs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Клубы не найдены</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клуб</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead className="text-center">Спортсмены</TableHead>
                  <TableHead className="text-center">Тренеры</TableHead>
                  <TableHead className="text-center">Рейтинг</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubs.map((club) => (
                  <TableRow key={club.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {club.logo ? (
                            <img src={club.logo} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{getLocalizedString(club.title)}</div>
                          {club.instagram && (
                            <div className="text-sm text-muted-foreground">@{club.instagram}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {club.city?.nameRu || club.region?.nameRu || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {club._count.sportsmen}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        <UserCog className="h-3 w-3 mr-1" />
                        {club._count.trainers}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge>{club.rating}</Badge>
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
                            <Link href={`/clubs/${club.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Просмотр
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/clubs/${club.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Редактировать
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(club.id)}
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
