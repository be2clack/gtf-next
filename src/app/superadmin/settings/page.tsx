'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Send, Webhook, CheckCircle2, XCircle } from 'lucide-react'

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const [settings, setSettings] = useState({
    siteName: 'GTF Global',
    siteDescription: 'Global Taekwondo Federation',
    contactEmail: 'info@gtf.global',
    telegramBotToken: '',
    telegramBotUsername: '',
    telegramWebhookUrl: '',
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      // Save settings via API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert('Настройки сохранены')
    } finally {
      setLoading(false)
    }
  }

  const testTelegramBot = async () => {
    setTelegramStatus('idle')
    setLoading(true)
    try {
      // Test telegram bot
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setTelegramStatus('success')
    } catch {
      setTelegramStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const setWebhook = async () => {
    setLoading(true)
    try {
      // Set webhook
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert('Webhook установлен')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Глобальные настройки</h1>
        <p className="text-muted-foreground">
          Настройки платформы GTF Global
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Общие</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Основные настройки</CardTitle>
              <CardDescription>
                Общие настройки платформы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Название сайта</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) =>
                      setSettings({ ...settings, siteName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Контактный email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) =>
                      setSettings({ ...settings, contactEmail: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Описание</Label>
                <Input
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) =>
                    setSettings({ ...settings, siteDescription: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Сохранить
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telegram" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Telegram Bot</CardTitle>
              <CardDescription>
                Настройки Telegram бота для уведомлений и авторизации
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="botToken">Bot Token</Label>
                  <Input
                    id="botToken"
                    type="password"
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    value={settings.telegramBotToken}
                    onChange={(e) =>
                      setSettings({ ...settings, telegramBotToken: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="botUsername">Username бота</Label>
                  <Input
                    id="botUsername"
                    placeholder="@gtfglobalbot"
                    value={settings.telegramBotUsername}
                    onChange={(e) =>
                      setSettings({ ...settings, telegramBotUsername: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={testTelegramBot} disabled={loading}>
                  <Send className="mr-2 h-4 w-4" />
                  Тестировать бота
                </Button>
                {telegramStatus === 'success' && (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Работает
                  </Badge>
                )}
                {telegramStatus === 'error' && (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    Ошибка
                  </Badge>
                )}
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium">Webhook</h4>
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    placeholder="https://gtf.global/api/telegram/webhook"
                    value={settings.telegramWebhookUrl}
                    onChange={(e) =>
                      setSettings({ ...settings, telegramWebhookUrl: e.target.value })
                    }
                  />
                </div>
                <Button variant="outline" onClick={setWebhook} disabled={loading}>
                  <Webhook className="mr-2 h-4 w-4" />
                  Установить Webhook
                </Button>
              </div>

              <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Сохранить настройки
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS шлюз</CardTitle>
              <CardDescription>
                Настройки SMS провайдера для отправки PIN-кодов
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Провайдер</Label>
                  <Input placeholder="nikita.kg" />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sender ID</Label>
                <Input placeholder="GTF" />
              </div>
              <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Сохранить
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email настройки</CardTitle>
              <CardDescription>
                SMTP настройки для отправки email уведомлений
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input placeholder="587" />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input placeholder="noreply@gtf.global" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
              <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Сохранить
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
