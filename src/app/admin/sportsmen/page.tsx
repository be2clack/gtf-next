'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

interface Sportsman {
  id: number
  fio: string | null
  lastName: string | null
  firstName: string | null
  sex: number
  dateOfBirth: string | null
  club: { id: number; title: unknown } | null
  trainer: { id: number; firstName: string | null; lastName: string | null } | null
  gyp: number | null
  dan: number | null
  weight: number | null
  beltLevel: number | null
}

export default function SportsmenPage() {
  const router = useRouter()
  const [data, setData] = React.useState<Sportsman[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/v1/sportsmen')
      if (res.ok) {
        const json = await res.json()
        setData(json.data || [])
      }
    } catch (error) {
      toast.error('Ошибка загрузки данных')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/v1/sportsmen/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Спортсмен удален')
        fetchData()
      } else {
        toast.error('Ошибка удаления')
      }
    } catch {
      toast.error('Ошибка удаления')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const columns: ColumnDef<Sportsman>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('id')}</span>,
    },
    {
      accessorKey: 'fio',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ФИО" />,
      cell: ({ row }) => {
        const s = row.original
        const name = s.fio || `${s.lastName || ''} ${s.firstName || ''}`.trim() || '-'
        return <div className="font-medium">{name}</div>
      },
    },
    {
      accessorKey: 'sex',
      header: 'Пол',
      cell: ({ row }) => (
        <Badge variant={row.getValue('sex') === 1 ? 'default' : 'secondary'}>
          {row.getValue('sex') === 1 ? 'М' : 'Ж'}
        </Badge>
      ),
    },
    {
      accessorKey: 'dateOfBirth',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Дата рождения" />,
      cell: ({ row }) => {
        const date = row.getValue('dateOfBirth') as string | null
        if (!date) return '-'
        return new Date(date).toLocaleDateString('ru-RU')
      },
    },
    {
      accessorKey: 'club',
      header: 'Клуб',
      cell: ({ row }) => {
        const club = row.original.club
        if (!club) return '-'
        return getLocalizedString(club.title) || '-'
      },
    },
    {
      accessorKey: 'trainer',
      header: 'Тренер',
      cell: ({ row }) => {
        const trainer = row.original.trainer
        if (!trainer) return '-'
        return `${trainer.lastName || ''} ${trainer.firstName || ''}`.trim() || '-'
      },
    },
    {
      id: 'belt',
      header: 'Пояс',
      cell: ({ row }) => {
        const dan = row.original.dan
        const gyp = row.original.gyp
        if (dan && dan > 0) return <Badge variant="default">{dan} дан</Badge>
        if (gyp && gyp > 0) return <Badge variant="outline">{gyp} гып</Badge>
        return '-'
      },
    },
    {
      accessorKey: 'weight',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Вес" />,
      cell: ({ row }) => {
        const weight = row.getValue('weight') as number | null
        return weight ? `${weight} кг` : '-'
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const sportsman = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/sportsmen/${sportsman.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Просмотр
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/sportsmen/${sportsman.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteId(sportsman.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Спортсмены</h1>
          <p className="text-muted-foreground">
            Управление базой спортсменов федерации
          </p>
        </div>
        <Button onClick={() => router.push('/admin/sportsmen/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить
        </Button>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={data}
        searchKey="fio"
        searchPlaceholder="Поиск по ФИО..."
        isLoading={isLoading}
        emptyMessage="Спортсмены не найдены"
        onRowClick={(row) => router.push(`/sportsmen/${row.id}`)}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить спортсмена?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Спортсмен будет удален из базы данных.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}