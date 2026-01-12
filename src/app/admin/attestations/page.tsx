import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getFederationContext } from '@/lib/federation'
import prisma from '@/lib/prisma'
import { Plus, Award, Calendar } from 'lucide-react'
import Link from 'next/link'

async function getAttestations(federationId: number) {
  return prisma.attestation.findMany({
    where: {
      sportsman: {
        federationId,
      },
    },
    orderBy: { examDate: 'desc' },
    include: {
      sportsman: {
        select: { id: true, fio: true, firstName: true, lastName: true },
      },
    },
  })
}

export default async function AttestationsPage() {
  const { federation } = await getFederationContext()

  if (!federation) {
    return <div>Федерация не найдена</div>
  }

  const attestations = await getAttestations(federation.id)

  // Group by year
  const attestationsByYear = attestations.reduce((acc, att) => {
    const year = att.examDate
      ? new Date(att.examDate).getFullYear().toString()
      : 'Без даты'
    if (!acc[year]) acc[year] = []
    acc[year].push(att)
    return acc
  }, {} as Record<string, typeof attestations>)

  // Belt level names
  const getBeltName = (level: number) => {
    const belts: Record<number, string> = {
      10: '10 гуп (белый)',
      9: '9 гуп (бело-желтый)',
      8: '8 гуп (желтый)',
      7: '7 гуп (желто-зеленый)',
      6: '6 гуп (зеленый)',
      5: '5 гуп (зелено-синий)',
      4: '4 гуп (синий)',
      3: '3 гуп (сине-красный)',
      2: '2 гуп (красный)',
      1: '1 гуп (красно-черный)',
      0: '1 дан',
      '-1': '2 дан',
      '-2': '3 дан',
      '-3': '4 дан',
      '-4': '5 дан',
      '-5': '6 дан',
    }
    return belts[level] || `${level} гуп/дан`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Аттестации</h1>
          <p className="text-muted-foreground">
            Управление аттестациями на пояса (гупы и даны)
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/attestations/new">
            <Plus className="mr-2 h-4 w-4" />
            Провести аттестацию
          </Link>
        </Button>
      </div>

      {Object.entries(attestationsByYear).map(([year, yearAttestations]) => (
        <Card key={year}>
          <CardHeader>
            <CardTitle>{year} год</CardTitle>
            <CardDescription>
              {yearAttestations.length} аттестаций
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {yearAttestations.map((attestation) => (
                <div
                  key={attestation.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {attestation.sportsman?.fio ||
                         `${attestation.sportsman?.lastName || ''} ${attestation.sportsman?.firstName || ''}`.trim() ||
                         'Без имени'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {attestation.examDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(attestation.examDate).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                        <span>{getBeltName(attestation.level)}</span>
                        {attestation.examiner && (
                          <span>Экзаменатор: {attestation.examiner}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={attestation.status ? 'default' : 'secondary'}>
                      {attestation.status ? 'Сдан' : 'Не сдан'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {attestations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Нет аттестаций</h3>
            <p className="text-muted-foreground mb-4">
              Проведите первую аттестацию
            </p>
            <Button asChild>
              <Link href="/admin/attestations/new">
                <Plus className="mr-2 h-4 w-4" />
                Провести аттестацию
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
