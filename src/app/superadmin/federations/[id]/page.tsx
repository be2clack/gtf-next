import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import prisma from '@/lib/prisma'
import {
  ArrowLeft,
  Building,
  Users,
  Trophy,
  Settings,
  ExternalLink,
  Edit,
  UserPlus,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getFederation(id: number) {
  return prisma.federation.findUnique({
    where: { id },
    include: {
      country: true,
      admins: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          sportsmen: true,
          clubs: true,
          competitions: true,
          trainers: true,
          judges: true,
        },
      },
    },
  })
}

export default async function FederationDetailPage({ params }: PageProps) {
  const { id } = await params
  const federation = await getFederation(parseInt(id))

  if (!federation) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/superadmin/federations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{federation.code.toUpperCase()}</h1>
            <Badge variant={federation.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {federation.status === 'ACTIVE' ? 'Активна' : 'Неактивна'}
            </Badge>
          </div>
          <p className="text-muted-foreground">{federation.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${federation.code}`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              На сайт
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/superadmin/federations/${federation.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Редактировать
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Спортсмены
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{federation._count.sportsmen}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Клубы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{federation._count.clubs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Тренеры
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{federation._count.trainers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Судьи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{federation._count.judges}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Соревнования
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{federation._count.competitions}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Информация</TabsTrigger>
          <TabsTrigger value="admins">Администраторы</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Код</label>
                <p className="text-lg font-mono">{federation.code.toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Название</label>
                <p className="text-lg">{federation.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Страна</label>
                <p className="text-lg">{federation.country?.nameRu || federation.country?.nameEn || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Домен</label>
                <p className="text-lg">{federation.domain || `${federation.code}.gtf.global`}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Валюта</label>
                <p className="text-lg">{federation.currency || 'USD'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Часовой пояс</label>
                <p className="text-lg">{federation.timezone || 'UTC'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Администраторы федерации</CardTitle>
                <CardDescription>
                  Пользователи с правами администратора
                </CardDescription>
              </div>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Добавить админа
              </Button>
            </CardHeader>
            <CardContent>
              {federation.admins.length > 0 ? (
                <div className="divide-y">
                  {federation.admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{admin.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {admin.user.phone || admin.user.email}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Нет назначенных администраторов
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Настройки федерации</CardTitle>
              <CardDescription>
                Дополнительные настройки и конфигурация
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Платежный шлюз</p>
                  <p className="text-sm text-muted-foreground">
                    Настройки приема платежей
                  </p>
                </div>
                <Button variant="outline">Настроить</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Telegram уведомления</p>
                  <p className="text-sm text-muted-foreground">
                    Интеграция с Telegram ботом
                  </p>
                </div>
                <Button variant="outline">Настроить</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
