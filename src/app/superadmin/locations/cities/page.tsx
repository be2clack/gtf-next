import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import prisma from '@/lib/prisma'
import { Plus, Edit, Trash2, Building2 } from 'lucide-react'
import Link from 'next/link'

async function getCities() {
  return prisma.city.findMany({
    take: 100,
    orderBy: [{ region: { country: { nameRu: 'asc' } } }, { nameRu: 'asc' }],
    include: {
      region: {
        include: {
          country: {
            select: { code: true, nameRu: true, nameEn: true },
          },
        },
      },
    },
  })
}

export default async function CitiesPage() {
  const cities = await getCities()

  const getName = (nameRu: string | null, nameEn: string | null): string => {
    return nameRu || nameEn || 'Без названия'
  }

  // Group cities by country and region
  const citiesByCountry = cities.reduce((acc, city) => {
    const countryName = getName(city.region?.country?.nameRu ?? null, city.region?.country?.nameEn ?? null) || 'Без страны'
    const regionName = getName(city.region?.nameRu ?? null, city.region?.nameEn ?? null) || 'Без региона'
    const key = `${countryName} - ${regionName}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(city)
    return acc
  }, {} as Record<string, typeof cities>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Города</h1>
          <p className="text-muted-foreground">
            Управление справочником городов
          </p>
        </div>
        <Button asChild>
          <Link href="/superadmin/locations/cities/new">
            <Plus className="mr-2 h-4 w-4" />
            Добавить город
          </Link>
        </Button>
      </div>

      {Object.entries(citiesByCountry).map(([groupName, groupCities]) => (
        <Card key={groupName}>
          <CardHeader>
            <CardTitle>{groupName}</CardTitle>
            <CardDescription>
              {groupCities.length} городов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {groupCities.map((city) => (
                <div
                  key={city.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{getName(city.nameRu, city.nameEn)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/superadmin/locations/cities/${city.id}/edit`}>
                        <Edit className="h-3 w-3" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {cities.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Нет городов</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
