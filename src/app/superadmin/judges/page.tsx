import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/prisma'
import { Plus, Edit, Scale } from 'lucide-react'
import Link from 'next/link'

async function getJudges() {
  return prisma.judge.findMany({
    orderBy: { lastName: 'asc' },
    include: {
      federation: {
        select: { code: true, name: true },
      },
      _count: {
        select: {
          competitionJudges: true,
        },
      },
    },
  })
}

export default async function JudgesPage() {
  const judges = await getJudges()

  // Group judges by category
  const internationalJudges = judges.filter((j) => j.judgeCategory === 'INTERNATIONAL')
  const nationalJudges = judges.filter((j) => j.judgeCategory === 'NATIONAL')
  const otherJudges = judges.filter((j) => !['INTERNATIONAL', 'NATIONAL'].includes(j.judgeCategory || ''))

  const getJudgeName = (judge: { firstName: string; lastName: string; patronymic: string | null }) => {
    return `${judge.lastName} ${judge.firstName}${judge.patronymic ? ` ${judge.patronymic}` : ''}`
  }

  const categoryLabels: Record<string, string> = {
    INTERNATIONAL: 'Международный',
    NATIONAL: 'Национальный',
    REGIONAL: 'Региональный',
  }

  const JudgeList = ({ items, title }: { items: typeof judges; title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{items.length} судей</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {items.map((judge) => (
            <div
              key={judge.id}
              className="flex items-center justify-between py-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{getJudgeName(judge)}</p>
                  <p className="text-sm text-muted-foreground">
                    {judge.federation?.code.toUpperCase() || 'GTF'} |
                    {judge.experienceYears && ` ${judge.experienceYears} лет опыта`} |
                    {' '}{judge._count.competitionJudges} соревнований
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {judge.judgeCategory && (
                  <Badge variant="outline">
                    {categoryLabels[judge.judgeCategory] || judge.judgeCategory}
                  </Badge>
                )}
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/superadmin/judges/${judge.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Нет судей в этой категории
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Судьи</h1>
          <p className="text-muted-foreground">
            Глобальный реестр судей тхэквондо
          </p>
        </div>
        <Button asChild>
          <Link href="/superadmin/judges/new">
            <Plus className="mr-2 h-4 w-4" />
            Добавить судью
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        <JudgeList items={internationalJudges} title="Международные судьи" />
        <JudgeList items={nationalJudges} title="Национальные судьи" />
        {otherJudges.length > 0 && (
          <JudgeList items={otherJudges} title="Другие судьи" />
        )}
      </div>
    </div>
  )
}
