import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import prisma from '@/lib/prisma'
import { Plus, Edit, Trash2, Map } from 'lucide-react'
import Link from 'next/link'

async function getRegions() {
  return prisma.region.findMany({
    orderBy: [{ country: { nameRu: 'asc' } }, { nameRu: 'asc' }],
    include: {
      country: {
        select: { code: true, nameRu: true, nameEn: true },
      },
      _count: {
        select: {
          cities: true,
        },
      },
    },
  })
}

export default async function RegionsPage() {
  const regions = await getRegions()

  const getName = (nameRu: string | null | undefined, nameEn: string | null | undefined): string => {
    return nameRu || nameEn || 'Без названия'
  }

  // Group regions by country
  const regionsByCountry = regions.reduce((acc, region) => {
    const countryName = getName(region.country?.nameRu, region.country?.nameEn) || 'Без страны'
    if (!acc[countryName]) {
      acc[countryName] = []
    }
    acc[countryName].push(region)
    return acc
  }, {} as Record<string, typeof regions>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Регионы</h1>
          <p className="text-muted-foreground">
            Управление справочником регионов/областей
          </p>
        </div>
        <Button asChild>
          <Link href="/superadmin/locations/regions/new">
            <Plus className="mr-2 h-4 w-4" />
            Добавить регион
          </Link>
        </Button>
      </div>

      {Object.entries(regionsByCountry).map(([countryName, countryRegions]) => (
        <Card key={countryName}>
          <CardHeader>
            <CardTitle>{countryName}</CardTitle>
            <CardDescription>
              {countryRegions.length} регионов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {countryRegions.map((region) => (
                <div
                  key={region.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Map className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">{getName(region.nameRu, region.nameEn)}</p>
                      <p className="text-sm text-muted-foreground">
                        {region.code || '-'} | {region._count.cities} городов
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/superadmin/locations/regions/${region.id}/edit`}>
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
          </CardContent>
        </Card>
      ))}

      {regions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Map className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Нет регионов</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
