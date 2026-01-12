import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/prisma'
import { Plus, Building, Users, Trophy, Settings, ExternalLink } from 'lucide-react'
import Link from 'next/link'

async function getFederations() {
  return prisma.federation.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          sportsmen: true,
          clubs: true,
          competitions: true,
          admins: true,
        },
      },
      country: {
        select: { nameRu: true, nameEn: true },
      },
    },
  })
}

export default async function FederationsPage() {
  const federations = await getFederations()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Федерации</h1>
          <p className="text-muted-foreground">
            Управление национальными федерациями тхэквондо
          </p>
        </div>
        <Button asChild>
          <Link href="/superadmin/federations/new">
            <Plus className="mr-2 h-4 w-4" />
            Добавить федерацию
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {federations.map((federation) => (
          <Card key={federation.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl font-bold text-primary">
                      {federation.code.toUpperCase()}
                    </span>
                    <Badge
                      variant={federation.status === 'ACTIVE' ? 'default' : 'secondary'}
                    >
                      {federation.status === 'ACTIVE' ? 'Активна' : 'Неактивна'}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {federation.name}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{federation._count.sportsmen} спортсменов</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{federation._count.clubs} клубов</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span>{federation._count.competitions} соревнований</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>{federation._count.admins} админов</span>
                </div>
              </div>

              {federation.country && (
                <p className="text-sm text-muted-foreground mb-4">
                  Страна: {federation.country.nameRu || federation.country.nameEn}
                </p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/superadmin/federations/${federation.id}`}>
                    Управление
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/${federation.code}`} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {federations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Нет федераций</h3>
            <p className="text-muted-foreground mb-4">
              Создайте первую федерацию для начала работы
            </p>
            <Button asChild>
              <Link href="/superadmin/federations/new">
                <Plus className="mr-2 h-4 w-4" />
                Создать федерацию
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
