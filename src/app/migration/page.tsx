'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Database,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Users,
  Building2,
  Trophy,
  Newspaper,
  MapPin,
  Loader2,
  Pause,
  AlertCircle
} from 'lucide-react'

// Multilingual translations
const translations = {
  ru: {
    title: 'Миграция данных',
    subtitle: 'Миграция данных из Laravel MySQL в Next.js PostgreSQL',
    refresh: 'Обновить',
    pause: 'Пауза',
    resume: 'Продолжить',
    migrateAll: 'Мигрировать все',
    migrating: 'Миграция...',
    totalSource: 'Всего записей в источнике',
    totalMigrated: 'Всего мигрировано',
    overallProgress: 'Общий прогресс',
    tablesToMigrate: 'Таблиц для миграции',
    migrationProgress: 'Прогресс миграции',
    paused: 'Пауза',
    batch: 'Пакет',
    sourceDb: 'База источника (MySQL)',
    targetDb: 'База назначения (PostgreSQL)',
    notConnected: 'Не подключено',
    migrationTables: 'Таблицы миграции',
    sourceToTarget: 'Источник (MySQL) → Назначение (PostgreSQL) количество записей',
    complete: 'Готово',
    migrate: 'Мигрировать',
    migrationLogs: 'Журнал миграции',
    realtimeProgress: 'Прогресс миграции в реальном времени',
    noLogs: 'Журнал пуст. Начните миграцию для просмотра прогресса.',
    mysqlRequired: 'Требуется подключение к MySQL',
    mysqlRequiredDesc: 'Для запуска миграции необходимо подключиться к исходной базе данных MySQL. Убедитесь, что SSH туннель запущен на порту 3307 и настроены переменные окружения:',
    // Table names
    countries: 'Страны',
    regions: 'Регионы',
    cities: 'Города',
    federations: 'Федерации',
    clubs: 'Клубы',
    trainers: 'Тренеры',
    users: 'Пользователи',
    sportsmen: 'Спортсмены',
    competitions: 'Соревнования',
    news: 'Новости',
    disciplines: 'Дисциплины',
    age_categories: 'Возрастные категории',
    weight_categories: 'Весовые категории',
    belt_categories: 'Категории поясов',
    judges: 'Судьи',
    partners: 'Партнеры',
    sliders: 'Слайдеры',
    settings: 'Настройки',
  },
  en: {
    title: 'Data Migration',
    subtitle: 'Migrate data from Laravel MySQL to Next.js PostgreSQL',
    refresh: 'Refresh',
    pause: 'Pause',
    resume: 'Resume',
    migrateAll: 'Migrate All',
    migrating: 'Migrating...',
    totalSource: 'Total Source Records',
    totalMigrated: 'Total Migrated Records',
    overallProgress: 'Overall Progress',
    tablesToMigrate: 'Tables to Migrate',
    migrationProgress: 'Migration Progress',
    paused: 'Paused',
    batch: 'Batch',
    sourceDb: 'Source Database (MySQL)',
    targetDb: 'Target Database (PostgreSQL)',
    notConnected: 'Not connected',
    migrationTables: 'Migration Tables',
    sourceToTarget: 'Source (MySQL) → Target (PostgreSQL) record counts',
    complete: 'Complete',
    migrate: 'Migrate',
    migrationLogs: 'Migration Logs',
    realtimeProgress: 'Real-time migration progress',
    noLogs: 'No logs yet. Start migration to see progress.',
    mysqlRequired: 'MySQL Connection Required',
    mysqlRequiredDesc: 'To run the migration, you need to connect to the source MySQL database. Make sure the SSH tunnel is running on port 3307 and the environment variables are set:',
    countries: 'Countries',
    regions: 'Regions',
    cities: 'Cities',
    federations: 'Federations',
    clubs: 'Clubs',
    trainers: 'Trainers',
    users: 'Users',
    sportsmen: 'Sportsmen',
    competitions: 'Competitions',
    news: 'News',
    disciplines: 'Disciplines',
    age_categories: 'Age Categories',
    weight_categories: 'Weight Categories',
    belt_categories: 'Belt Categories',
    judges: 'Judges',
    partners: 'Partners',
    sliders: 'Sliders',
    settings: 'Settings',
  },
  ky: {
    title: 'Маалыматтарды көчүрүү',
    subtitle: 'Laravel MySQL\'ден Next.js PostgreSQL\'ге маалыматтарды көчүрүү',
    refresh: 'Жаңылоо',
    pause: 'Токтотуу',
    resume: 'Улантуу',
    migrateAll: 'Баарын көчүрүү',
    migrating: 'Көчүрүлүүдө...',
    totalSource: 'Жалпы булак жазуулары',
    totalMigrated: 'Жалпы көчүрүлгөн',
    overallProgress: 'Жалпы прогресс',
    tablesToMigrate: 'Көчүрүлүүчү таблицалар',
    migrationProgress: 'Көчүрүү прогресси',
    paused: 'Токтотулду',
    batch: 'Пакет',
    sourceDb: 'Булак базасы (MySQL)',
    targetDb: 'Максат базасы (PostgreSQL)',
    notConnected: 'Туташкан эмес',
    migrationTables: 'Көчүрүү таблицалары',
    sourceToTarget: 'Булак (MySQL) → Максат (PostgreSQL) жазуу саны',
    complete: 'Даяр',
    migrate: 'Көчүрүү',
    migrationLogs: 'Көчүрүү журналы',
    realtimeProgress: 'Реалдуу убакытта көчүрүү прогресси',
    noLogs: 'Журнал бош. Прогрессти көрүү үчүн көчүрүүнү баштаңыз.',
    mysqlRequired: 'MySQL туташуусу талап кылынат',
    mysqlRequiredDesc: 'Көчүрүүнү жүргүзүү үчүн булак MySQL базасына туташуу керек. SSH туннели 3307 портунда иштеп жатканын жана чөйрө өзгөрмөлөрү орнотулганын текшериңиз:',
    countries: 'Өлкөлөр',
    regions: 'Аймактар',
    cities: 'Шаарлар',
    federations: 'Федерациялар',
    clubs: 'Клубдар',
    trainers: 'Машыктыруучулар',
    users: 'Колдонуучулар',
    sportsmen: 'Спортчулар',
    competitions: 'Мелдештер',
    news: 'Жаңылыктар',
    disciplines: 'Дисциплиналар',
    age_categories: 'Курак категориялары',
    weight_categories: 'Салмак категориялары',
    belt_categories: 'Кур категориялары',
    judges: 'Судьялар',
    partners: 'Өнөктөштөр',
    sliders: 'Слайдерлер',
    settings: 'Жөндөөлөр',
  },
  kk: {
    title: 'Деректерді көшіру',
    subtitle: 'Laravel MySQL-ден Next.js PostgreSQL-ге деректерді көшіру',
    refresh: 'Жаңарту',
    pause: 'Кідірту',
    resume: 'Жалғастыру',
    migrateAll: 'Барлығын көшіру',
    migrating: 'Көшіріліп жатыр...',
    totalSource: 'Барлық бастапқы жазбалар',
    totalMigrated: 'Барлық көшірілген',
    overallProgress: 'Жалпы үлгерім',
    tablesToMigrate: 'Көшірілетін кестелер',
    migrationProgress: 'Көшіру үлгерімі',
    paused: 'Кідіртілді',
    batch: 'Пакет',
    sourceDb: 'Бастапқы база (MySQL)',
    targetDb: 'Мақсатты база (PostgreSQL)',
    notConnected: 'Қосылмаған',
    migrationTables: 'Көшіру кестелері',
    sourceToTarget: 'Бастапқы (MySQL) → Мақсатты (PostgreSQL) жазба саны',
    complete: 'Дайын',
    migrate: 'Көшіру',
    migrationLogs: 'Көшіру журналы',
    realtimeProgress: 'Нақты уақыттағы көшіру үлгерімі',
    noLogs: 'Журнал бос. Үлгерімді көру үшін көшіруді бастаңыз.',
    mysqlRequired: 'MySQL қосылымы қажет',
    mysqlRequiredDesc: 'Көшіруді жүргізу үшін бастапқы MySQL базасына қосылу қажет. SSH туннелі 3307 портында жұмыс істеп тұрғанын және орта айнымалылары орнатылғанын тексеріңіз:',
    countries: 'Елдер',
    regions: 'Аймақтар',
    cities: 'Қалалар',
    federations: 'Федерациялар',
    clubs: 'Клубтар',
    trainers: 'Жаттықтырушылар',
    users: 'Қолданушылар',
    sportsmen: 'Спортшылар',
    competitions: 'Жарыстар',
    news: 'Жаңалықтар',
    disciplines: 'Пәндер',
    age_categories: 'Жас санаттары',
    weight_categories: 'Салмақ санаттары',
    belt_categories: 'Белбеу санаттары',
    judges: 'Судьялар',
    partners: 'Серіктестер',
    sliders: 'Слайдерлер',
    settings: 'Параметрлер',
  }
}

type Locale = 'ru' | 'en' | 'ky' | 'kk'

interface TableInfo {
  name: string
  label: string
  sourceCount: number
  targetCount: number
  percentage: number
}

interface MigrationStatus {
  mysqlConnected: boolean
  mysqlInfo: string
  postgresConnected: boolean
  postgresInfo: string
  tables: TableInfo[]
  totalSource: number
  totalTarget: number
}

interface LogEntry {
  time: string
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
}

export default function MigrationPage() {
  const [status, setStatus] = useState<MigrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [paused, setPaused] = useState(false)
  const [currentTable, setCurrentTable] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [progress, setProgress] = useState(0)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null)
  const [locale, setLocale] = useState<Locale>('ru')
  const pausedRef = useRef(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const t = translations[locale]

  const getTableLabel = (name: string): string => {
    return t[name as keyof typeof t] || name
  }

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/migrate/status')
      const data = await res.json()
      if (data.success) {
        setStatus(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch migration status:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      time: new Date().toLocaleTimeString(),
      message,
      type
    }])
  }

  const migrateTable = async (tableName: string): Promise<boolean> => {
    if (pausedRef.current) {
      addLog(`Migration paused before ${tableName}`, 'warning')
      return false
    }

    setCurrentTable(tableName)
    setBatchProgress(null)
    addLog(`Starting migration of ${tableName}...`, 'info')

    try {
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: tableName })
      })

      const data = await res.json()

      if (data.success) {
        addLog(`✓ Completed ${tableName}: ${data.migrated || 0} records migrated`, 'success')
        await fetchStatus()
        return true
      } else {
        addLog(`✗ Error migrating ${tableName}: ${data.error}`, 'error')
        return false
      }
    } catch (error) {
      addLog(`✗ Exception migrating ${tableName}: ${error}`, 'error')
      return false
    } finally {
      setCurrentTable(null)
      setBatchProgress(null)
    }
  }

  const handlePause = () => {
    pausedRef.current = !pausedRef.current
    setPaused(!paused)
    if (pausedRef.current) {
      addLog('Migration paused by user', 'warning')
    } else {
      addLog('Migration resumed', 'info')
    }
  }

  const migrateAll = async () => {
    if (!status) return

    setMigrating(true)
    setPaused(false)
    pausedRef.current = false
    setProgress(0)
    addLog('═══════════════════════════════════════', 'info')
    addLog('Starting full migration from MySQL to PostgreSQL...', 'info')
    addLog('═══════════════════════════════════════', 'info')

    const tables = [
      'countries',
      'regions',
      'cities',
      'federations',
      'clubs',
      'trainers',
      'users',
      'sportsmen',
      'competitions',
      'news',
      'disciplines',
      'age_categories',
      'weight_categories',
      'belt_categories',
      'judges',
      'partners',
      'sliders',
      'settings'
    ]

    let completedCount = 0
    let errorCount = 0

    for (let i = 0; i < tables.length; i++) {
      // Wait if paused
      while (pausedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const success = await migrateTable(tables[i])
      if (success) {
        completedCount++
      } else if (!pausedRef.current) {
        errorCount++
      }
      setProgress(Math.round(((i + 1) / tables.length) * 100))
    }

    addLog('═══════════════════════════════════════', 'info')
    if (errorCount === 0) {
      addLog(`✓ Full migration completed! ${completedCount} tables migrated successfully.`, 'success')
    } else {
      addLog(`Migration finished with ${errorCount} errors. ${completedCount} tables migrated.`, 'warning')
    }
    addLog('═══════════════════════════════════════', 'info')
    setMigrating(false)
  }

  const getTableIcon = (name: string) => {
    switch (name) {
      case 'users':
      case 'sportsmen':
      case 'trainers':
        return <Users className="h-4 w-4" />
      case 'clubs':
      case 'federations':
        return <Building2 className="h-4 w-4" />
      case 'competitions':
        return <Trophy className="h-4 w-4" />
      case 'news':
        return <Newspaper className="h-4 w-4" />
      case 'countries':
      case 'regions':
      case 'cities':
        return <MapPin className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const totalPercentage = status ? (status.totalSource > 0
    ? Math.round((status.totalTarget / status.totalSource) * 100)
    : (status.totalTarget > 0 ? 100 : 0)) : 0

  return (
    <div className="container py-8 space-y-6">
      {/* Language Selector */}
      <div className="flex justify-end gap-2">
        {(['ru', 'en', 'ky', 'kk'] as Locale[]).map((lang) => (
          <Button
            key={lang}
            variant={locale === lang ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLocale(lang)}
          >
            {lang.toUpperCase()}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchStatus} disabled={migrating}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t.refresh}
          </Button>
          {migrating && (
            <Button variant="outline" onClick={handlePause}>
              {paused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {t.resume}
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  {t.pause}
                </>
              )}
            </Button>
          )}
          <Button onClick={migrateAll} disabled={migrating}>
            {migrating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {migrating ? t.migrating : t.migrateAll}
          </Button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{status?.totalSource?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">{t.totalSource}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{status?.totalTarget?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">{t.totalMigrated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalPercentage}%</div>
            <p className="text-xs text-muted-foreground">{t.overallProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{status?.tables?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{t.tablesToMigrate}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {migrating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  {paused ? (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">{t.paused}</Badge>
                  ) : currentTable ? (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      {getTableLabel(currentTable)}
                    </Badge>
                  ) : null}
                  {t.migrationProgress}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
              {batchProgress && (
                <p className="text-xs text-muted-foreground">
                  {t.batch}: {batchProgress.current} / {batchProgress.total}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t.sourceDb}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {status?.mysqlConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-mono text-sm">{status?.mysqlInfo || t.notConnected}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t.targetDb}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {status?.postgresConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-mono text-sm">{status?.postgresInfo || t.notConnected}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Migration Tables */}
      <Card>
        <CardHeader>
          <CardTitle>{t.migrationTables}</CardTitle>
          <CardDescription>{t.sourceToTarget}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status?.tables.map((table) => (
              <div key={table.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getTableIcon(table.name)}
                  <div>
                    <p className="font-medium">{getTableLabel(table.name)}</p>
                    <p className="text-sm text-muted-foreground">{table.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{table.sourceCount.toLocaleString()}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{table.targetCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={table.percentage} className="w-24 h-2" />
                      <span className={`text-xs ${
                        table.percentage === 100 ? 'text-green-600' :
                        table.percentage > 0 ? 'text-yellow-600' : 'text-muted-foreground'
                      }`}>
                        {table.percentage}%
                      </span>
                    </div>
                  </div>
                  {currentTable === table.name ? (
                    <Badge className="bg-yellow-100 text-yellow-800 min-w-[100px] justify-center">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" /> {t.migrating}
                    </Badge>
                  ) : table.percentage === 100 ? (
                    <Badge className="bg-green-100 text-green-800 min-w-[100px] justify-center">
                      <CheckCircle className="h-3 w-3 mr-1" /> {t.complete}
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => migrateTable(table.name)}
                      disabled={migrating || currentTable === table.name}
                      className="min-w-[100px]"
                    >
                      {t.migrate}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Migration Logs */}
      <Card>
        <CardHeader>
          <CardTitle>{t.migrationLogs}</CardTitle>
          <CardDescription>{t.realtimeProgress}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 font-mono text-sm p-4 rounded-lg h-80 overflow-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">{t.noLogs}</p>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={`${
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500">[{log.time}]</span> {log.message}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Warning if MySQL not connected */}
      {status && !status.mysqlConnected && (
        <Card className="border-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
              <div>
                <h3 className="font-medium">{t.mysqlRequired}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.mysqlRequiredDesc}
                </p>
                <pre className="mt-2 text-xs bg-muted p-2 rounded">
{`MYSQL_HOST=127.0.0.1
MYSQL_PORT=3307
MYSQL_USER=gtf_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=gtf_db`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
