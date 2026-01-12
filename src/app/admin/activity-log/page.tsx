'use client'

import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface ActivityLog {
  id: number
  logName: string | null
  description: string
  subjectType: string | null
  subjectId: number | null
  causerType: string | null
  causerId: number | null
  causer: { id: number; name: string } | null
  createdAt: string
}

export default function ActivityLogPage() {
  const [data, setData] = React.useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/v1/activity-log')
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

  const getActionColor = (logName: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (!logName) return 'default'
    if (logName.includes('create') || logName === 'auth') return 'default'
    if (logName.includes('update')) return 'secondary'
    if (logName.includes('delete')) return 'destructive'
    return 'outline'
  }

  const columns: ColumnDef<ActivityLog>[] = [
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Дата/Время" />,
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string
        return new Date(date).toLocaleString('ru-RU')
      },
    },
    {
      accessorKey: 'causer',
      header: 'Пользователь',
      cell: ({ row }) => {
        const causer = row.original.causer
        return causer?.name || 'Система'
      },
    },
    {
      accessorKey: 'logName',
      header: 'Действие',
      cell: ({ row }) => {
        const logName = row.getValue('logName') as string | null
        return (
          <Badge variant={getActionColor(logName)}>
            {logName || 'unknown'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'subjectType',
      header: 'Модель',
      cell: ({ row }) => {
        const subjectType = row.original.subjectType
        const subjectId = row.original.subjectId
        if (!subjectType) return '-'
        const modelName = subjectType.split('\\').pop() || subjectType
        return (
          <div>
            <div className="font-medium">{modelName}</div>
            {subjectId && (
              <div className="text-xs text-muted-foreground">ID: {subjectId}</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'description',
      header: 'Описание',
      cell: ({ row }) => (
        <div className="max-w-md truncate">{row.getValue('description')}</div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Логи активности</h1>
          <p className="text-muted-foreground">
            История действий пользователей в системе
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKey="description"
        searchPlaceholder="Поиск по описанию..."
        isLoading={isLoading}
        emptyMessage="Логи не найдены"
      />
    </div>
  )
}
