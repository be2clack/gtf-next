import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/prisma'
import { Plus, Edit, Trash2, Globe } from 'lucide-react'
import Link from 'next/link'

async function getCountries() {
  return prisma.country.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          regions: true,
          federations: true,
        },
      },
    },
  })
}

export default async function CountriesPage() {
  const countries = await getCountries()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Страны</h1>
          <p className="text-muted-foreground">
            Управление справочником стран
          </p>
        </div>
        <Button asChild>
          <Link href="/superadmin/locations/countries/new">
            <Plus className="mr-2 h-4 w-4" />
            Добавить страну
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список стран</CardTitle>
          <CardDescription>
            Страны используются для привязки федераций и географии спортсменов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {countries.map((country) => (
              <div
                key={country.id}
                className="flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                    {country.code.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{country.nameRu || country.nameEn || 'Без названия'}</p>
                    <p className="text-sm text-muted-foreground">
                      {country.code} | {country._count.regions} регионов |
                      {country._count.federations} федераций
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={country.isActive ? 'default' : 'secondary'}>
                    {country.isActive ? 'Активна' : 'Неактивна'}
                  </Badge>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/superadmin/locations/countries/${country.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {countries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Нет стран</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
