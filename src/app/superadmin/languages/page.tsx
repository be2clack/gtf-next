import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Languages, Download, Upload } from 'lucide-react'
import Link from 'next/link'

// Hardcoded languages for now - can be moved to database later
const languages = [
  { code: 'ru', name: 'Русский', native: 'Русский', isDefault: true, isActive: true },
  { code: 'en', name: 'English', native: 'English', isDefault: false, isActive: true },
  { code: 'kg', name: 'Kyrgyz', native: 'Кыргызча', isDefault: false, isActive: true },
  { code: 'ar', name: 'Arabic', native: 'العربية', isDefault: false, isActive: false },
]

export default function LanguagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Языки</h1>
          <p className="text-muted-foreground">
            Управление языками и локализацией
          </p>
        </div>
        <Button asChild>
          <Link href="/superadmin/languages/new">
            <Plus className="mr-2 h-4 w-4" />
            Добавить язык
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Поддерживаемые языки</CardTitle>
          <CardDescription>
            Языки, доступные для пользователей платформы
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {languages.map((language) => (
              <div
                key={language.code}
                className="flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary uppercase">
                    {language.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{language.name}</p>
                      {language.isDefault && (
                        <Badge>По умолчанию</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language.native} ({language.code})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={language.isActive ? 'default' : 'secondary'}>
                    {language.isActive ? 'Активен' : 'Неактивен'}
                  </Badge>
                  <Button variant="ghost" size="icon" title="Экспорт переводов">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Импорт переводов">
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/superadmin/languages/${language.code}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  {!language.isDefault && (
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Переводы</CardTitle>
          <CardDescription>
            Управление строками перевода
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Всего строк для перевода: <strong>1,234</strong>
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {languages.filter(l => l.isActive).map((language) => (
                <Card key={language.code}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{language.name}</span>
                      <Badge variant="outline">98%</Badge>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: '98%' }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
