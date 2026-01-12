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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Newspaper, Calendar } from 'lucide-react'
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

interface News {
  id: number
  title: unknown
  photo: string | null
  date: string | null
  published: boolean
  ordering: number
}

export default function AdminNewsPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  const filteredNews = news.filter(n => {
    const title = getLocalizedString(n.title)
    return title.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Новости</h1>
          <p className="text-muted-foreground">Управление новостями федерации</p>
        </div>
        <Button asChild>
          <Link href="/admin/news/new">
            <Plus className="mr-2 h-4 w-4" />
            Добавить новость
          </Link>
        </Button>
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
                        <div className="w-16 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {item.photo ? (
                            <img src={`/uploads/news/${item.photo}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Newspaper className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="font-medium line-clamp-2">{getLocalizedString(item.title)}</div>
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
