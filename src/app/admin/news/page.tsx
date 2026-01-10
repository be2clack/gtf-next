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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Newspaper, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface News {
  id: number
  title: string
  photo: string | null
  date: string | null
  published: boolean
  ordering: number
}

export default function AdminNewsPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    fetchNews()
  }, [search])

  async function fetchNews() {
    try {
      const res = await fetch('/api/v1/news?limit=100')
      const data = await res.json()

      if (data.success) {
        setNews(data.data)
      }
    } catch (error) {
      toast.error('Ошибка загрузки новостей')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Вы уверены, что хотите удалить эту новость?')) return

    try {
      const res = await fetch(`/api/v1/news/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        toast.success('Новость удалена')
        fetchNews()
      } else {
        toast.error(data.error || 'Ошибка удаления')
      }
    } catch (error) {
      toast.error('Ошибка удаления новости')
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/v1/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          description: formData.get('description'),
          date: formData.get('date') || new Date().toISOString(),
          published: formData.get('published') === 'on',
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Новость создана')
        setIsCreateOpen(false)
        fetchNews()
      } else {
        toast.error(data.error || 'Ошибка создания')
      }
    } catch (error) {
      toast.error('Ошибка создания новости')
    }
  }

  async function handleTogglePublish(id: number, currentState: boolean) {
    try {
      const res = await fetch(`/api/v1/news/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !currentState }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(currentState ? 'Новость снята с публикации' : 'Новость опубликована')
        fetchNews()
      } else {
        toast.error(data.error || 'Ошибка')
      }
    } catch (error) {
      toast.error('Ошибка обновления')
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const filteredNews = news.filter(n =>
    n.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Новости</h1>
          <p className="text-muted-foreground">Управление новостями федерации</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить новость
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая новость</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Заголовок *</label>
                <Input name="title" required placeholder="Введите заголовок" />
              </div>
              <div>
                <label className="text-sm font-medium">Описание</label>
                <textarea
                  name="description"
                  className="w-full border rounded-md p-2 min-h-[100px]"
                  placeholder="Краткое описание новости"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Дата</label>
                <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="published" id="published" defaultChecked />
                <label htmlFor="published" className="text-sm">Опубликовать сразу</label>
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
                placeholder="Поиск новостей..."
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
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Новости не найдены</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Новость</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-center">Статус</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNews.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded bg-muted flex items-center justify-center">
                          {item.photo ? (
                            <img src={item.photo} alt="" className="w-full h-full rounded object-cover" />
                          ) : (
                            <Newspaper className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="font-medium line-clamp-2">{item.title}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.date)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={item.published ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => handleTogglePublish(item.id, item.published)}
                      >
                        {item.published ? 'Опубликовано' : 'Черновик'}
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
                            <Link href={`/news/${item.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Просмотр
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/news/${item.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Редактировать
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(item.id)}
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
