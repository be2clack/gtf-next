'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const languages = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'kg', name: 'Кыргызча' },
]

export default function NewNewsPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('ru')

  // Form state - Multilingual
  const [title, setTitle] = React.useState<Record<string, string>>({ ru: '', en: '', kg: '' })
  const [description, setDescription] = React.useState<Record<string, string>>({ ru: '', en: '', kg: '' })
  const [content, setContent] = React.useState<Record<string, string>>({ ru: '', en: '', kg: '' })

  // Form state
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0])
  const [published, setPublished] = React.useState(true)
  const [ordering, setOrdering] = React.useState('0')

  // Photo
  const [photo, setPhoto] = React.useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null)

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 5MB')
        return
      }
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!title.ru?.trim()) {
      toast.error('Укажите заголовок новости')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()

      // Multilingual fields as JSON
      formData.append('title', JSON.stringify(title))
      formData.append('description', JSON.stringify(description))
      formData.append('content', JSON.stringify(content))

      // Other fields
      formData.append('date', date)
      formData.append('published', published ? 'true' : 'false')
      formData.append('ordering', ordering)

      // Photo
      if (photo) formData.append('photo', photo)

      const res = await fetch('/api/v1/news', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create news')
      }

      toast.success('Новость успешно создана')
      router.push('/admin/news')
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка при создании новости')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Новая новость</h1>
          <p className="text-muted-foreground">
            Создайте новость для публикации на сайте
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic info with tabs for languages */}
            <Card>
              <CardHeader>
                <CardTitle>Содержание</CardTitle>
                <CardDescription>Заголовок и текст новости</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    {languages.map((lang) => (
                      <TabsTrigger key={lang.code} value={lang.code}>
                        {lang.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {languages.map((lang) => (
                    <TabsContent key={lang.code} value={lang.code} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`title-${lang.code}`}>
                          Заголовок {lang.code === 'ru' && '*'}
                        </Label>
                        <Input
                          id={`title-${lang.code}`}
                          value={title[lang.code] || ''}
                          onChange={(e) => setTitle({ ...title, [lang.code]: e.target.value })}
                          placeholder={`Заголовок на ${lang.name.toLowerCase()}`}
                          required={lang.code === 'ru'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`description-${lang.code}`}>Краткое описание</Label>
                        <Textarea
                          id={`description-${lang.code}`}
                          value={description[lang.code] || ''}
                          onChange={(e) => setDescription({ ...description, [lang.code]: e.target.value })}
                          placeholder={`Краткое описание для анонса на ${lang.name.toLowerCase()}`}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`content-${lang.code}`}>Полный текст</Label>
                        <Textarea
                          id={`content-${lang.code}`}
                          value={content[lang.code] || ''}
                          onChange={(e) => setContent({ ...content, [lang.code]: e.target.value })}
                          placeholder={`Полный текст новости на ${lang.name.toLowerCase()}`}
                          rows={10}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Photo */}
            <Card>
              <CardHeader>
                <CardTitle>Изображение</CardTitle>
                <CardDescription>Обложка новости</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removePhoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Нажмите для загрузки</span>
                      <span className="text-xs text-muted-foreground mt-1">JPG, PNG до 5MB</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Настройки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Дата публикации</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ordering">Порядок сортировки</Label>
                  <Input
                    id="ordering"
                    type="number"
                    value={ordering}
                    onChange={(e) => setOrdering(e.target.value)}
                    min="0"
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Меньшее значение = выше в списке
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label>Опубликовать</Label>
                    <p className="text-xs text-muted-foreground">
                      Показывать на сайте
                    </p>
                  </div>
                  <Switch
                    checked={published}
                    onCheckedChange={setPublished}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Создание...' : 'Создать новость'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="w-full"
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
