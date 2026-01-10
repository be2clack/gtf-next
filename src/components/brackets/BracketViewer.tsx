'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Trophy, User, ChevronLeft, ChevronRight } from 'lucide-react'

interface Participant {
  id: number
  seedNumber: number
  sportsman: {
    id: number
    fullName: string
    photo: string | null
    clubName: string | null
    countryName: string | null
    beltLevel: string | null
  }
  currentWeight: number | null
  confirmedWeight: number | null
}

interface Match {
  id: number
  matchNumber: number
  roundNumber: number
  round: string | null
  roundName: string
  area: string | null
  scheduledTime: string | null
  startedAt: string | null
  endedAt: string | null
  status: string
  participant1: {
    id: number
    sportsman: {
      id: number
      fullName: string
      photo: string | null
    } | null
  } | null
  participant2: {
    id: number
    sportsman: {
      id: number
      fullName: string
      photo: string | null
    } | null
  } | null
  winnerId: number | null
  score1: number | null
  score2: number | null
}

interface BracketData {
  category: {
    id: number
    name: string
    gender: string
    competitionTitle: string
    disciplineName: string | null
    ageCategoryName: string | null
    weightCategoryName: string | null
  }
  bracket: {
    id: number
    type: string
    size: number
    status: string
    generatedAt: string | null
  } | null
  participants: Participant[]
  matches: Match[]
  meta: {
    totalParticipants: number
    totalMatches: number
    completedMatches: number
  }
}

interface BracketViewerProps {
  categoryId: number
  className?: string
}

export function BracketViewer({ categoryId, className }: BracketViewerProps) {
  const [data, setData] = useState<BracketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRound, setSelectedRound] = useState<number | null>(null)

  useEffect(() => {
    fetchBracket()
  }, [categoryId])

  async function fetchBracket() {
    try {
      setLoading(true)
      const res = await fetch(`/api/v1/brackets/${categoryId}`)
      const result = await res.json()

      if (result.success) {
        setData(result.data)
        // Auto-select first round with matches
        if (result.data.matches.length > 0) {
          const rounds = [...new Set(result.data.matches.map((m: Match) => m.roundNumber))] as number[]
          setSelectedRound(Math.min(...rounds))
        }
      } else {
        setError(result.error || 'Failed to load bracket')
      }
    } catch {
      setError('Failed to load bracket')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center text-muted-foreground">
          Загрузка сетки...
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center text-muted-foreground">
          {error || 'Сетка не найдена'}
        </CardContent>
      </Card>
    )
  }

  const { category, bracket, matches, meta } = data

  if (!bracket || matches.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {category.name || `${category.disciplineName} - ${category.ageCategoryName}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Сетка еще не сгенерирована</p>
          <p className="text-sm mt-2">{meta.totalParticipants} участников</p>
        </CardContent>
      </Card>
    )
  }

  const rounds = [...new Set(matches.map(m => m.roundNumber))].sort((a, b) => a - b)
  const currentRoundMatches = matches.filter(m => m.roundNumber === selectedRound)

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {category.name || `${category.disciplineName} - ${category.ageCategoryName}`}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {category.weightCategoryName && `${category.weightCategoryName} • `}
              {category.gender === 'MALE' ? 'Мужчины' : category.gender === 'FEMALE' ? 'Женщины' : 'Смешанный'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {meta.completedMatches}/{meta.totalMatches} матчей
            </Badge>
            <Badge variant={bracket.status === 'completed' ? 'default' : 'secondary'}>
              {bracket.status === 'completed' ? 'Завершено' : bracket.status === 'in_progress' ? 'Идет' : 'Ожидание'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Round Navigation */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="icon"
            disabled={!selectedRound || selectedRound === Math.min(...rounds)}
            onClick={() => setSelectedRound(prev => prev ? prev - 1 : null)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-1">
            {rounds.map(round => {
              const roundMatch = matches.find(m => m.roundNumber === round)
              return (
                <Button
                  key={round}
                  variant={selectedRound === round ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRound(round)}
                >
                  {roundMatch?.roundName || `Раунд ${round}`}
                </Button>
              )
            })}
          </div>
          <Button
            variant="ghost"
            size="icon"
            disabled={!selectedRound || selectedRound === Math.max(...rounds)}
            onClick={() => setSelectedRound(prev => prev ? prev + 1 : null)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Matches Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {currentRoundMatches.map(match => (
            <Card key={match.id} className="overflow-hidden">
              <div className="p-3 bg-muted/50 flex items-center justify-between">
                <span className="text-sm font-medium">Матч #{match.matchNumber}</span>
                <Badge className={cn('text-xs', getMatchStatusColor(match.status))}>
                  {match.status === 'COMPLETED' ? 'Завершен' :
                    match.status === 'IN_PROGRESS' ? 'Идет' :
                    match.status === 'SCHEDULED' ? 'Запланирован' : 'Ожидание'}
                </Badge>
              </div>
              <div className="p-4 space-y-3">
                {/* Participant 1 (Red Corner) */}
                <div className={cn(
                  'flex items-center gap-3 p-2 rounded-lg border-2',
                  match.winnerId === match.participant1?.id
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-red-200 dark:border-red-900'
                )}>
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    {match.participant1?.sportsman?.photo ? (
                      <img src={match.participant1.sportsman.photo} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {match.participant1?.sportsman?.fullName || 'TBD'}
                    </p>
                  </div>
                  {match.status === 'COMPLETED' && (
                    <span className="font-bold text-lg">
                      {match.score1 ?? 0}
                    </span>
                  )}
                </div>

                <div className="text-center text-sm text-muted-foreground">vs</div>

                {/* Participant 2 (Blue Corner) */}
                <div className={cn(
                  'flex items-center gap-3 p-2 rounded-lg border-2',
                  match.winnerId === match.participant2?.id
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-blue-200 dark:border-blue-900'
                )}>
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    {match.participant2?.sportsman?.photo ? (
                      <img src={match.participant2.sportsman.photo} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {match.participant2?.sportsman?.fullName || 'TBD'}
                    </p>
                  </div>
                  {match.status === 'COMPLETED' && (
                    <span className="font-bold text-lg">
                      {match.score2 ?? 0}
                    </span>
                  )}
                </div>

                {/* Match Info */}
                {(match.area || match.scheduledTime) && (
                  <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    {match.area && <span>Площадка: {match.area}</span>}
                    {match.area && match.scheduledTime && <span> • </span>}
                    {match.scheduledTime && (
                      <span>{new Date(match.scheduledTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {currentRoundMatches.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Нет матчей в этом раунде
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BracketViewer
