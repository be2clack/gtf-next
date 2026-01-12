import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getFederationContext } from '@/lib/federation'
import prisma from '@/lib/prisma'
import { Plus, Edit, Trash2, GripVertical, ExternalLink, Building2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

async function getPartners(federationId: number) {
  return prisma.partner.findMany({
    where: { federationId },
    orderBy: { sortOrder: 'asc' },
  })
}

export default async function PartnersPage() {
  const { federation } = await getFederationContext()

  if (!federation) {
    return <div>Федерация не найдена</div>
  }

  const partners = await getPartners(federation.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Партнёры</h1>
          <p className="text-muted-foreground">
            Управление партнёрами и спонсорами федерации
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/partners/new">
            <Plus className="mr-2 h-4 w-4" />
            Добавить партнёра
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список партнёров</CardTitle>
          <CardDescription>
            Партнёры отображаются на главной странице федерации
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="flex items-center gap-4 py-4"
              >
                <div className="cursor-move text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="h-16 w-24 rounded border bg-muted flex items-center justify-center overflow-hidden">
                  {partner.logo ? (
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      width={96}
                      height={64}
                      className="object-contain"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{partner.name}</p>
                    <Badge variant={partner.isActive ? 'default' : 'secondary'}>
                      {partner.isActive ? 'Активен' : 'Скрыт'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {partner.description || 'Без описания'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {partner.url && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={partner.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/partners/${partner.id}/edit`}>
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

          {partners.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Нет партнёров</h3>
              <p className="text-muted-foreground mb-4">
                Добавьте партнёров вашей федерации
              </p>
              <Button asChild>
                <Link href="/admin/partners/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить партнёра
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
