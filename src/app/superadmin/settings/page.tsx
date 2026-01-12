'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Send, Webhook, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'

type SettingsData = Record<string, Record<string, string | null>>

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const [settings, setSettings] = useState({
    site_name: 'GTF Global',
    site_description: 'Global Taekwondo Federation',
    contact_email: 'info@gtf.global',
    telegram_bot_token: '',
    telegram_bot_username: '',
    telegram_webhook_url: '',
    sms_provider: '',
    sms_api_key: '',
    sms_sender_id: '',
    smtp_host: '',
    smtp_port: '',
    smtp_username: '',
    smtp_password: '',
    email_from_address: '',
    email_from_name: '',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/superadmin/settings')
      if (response.ok) {
        const data: SettingsData = await response.json()
        const flat: Record<string, string> = {}
        for (const group of Object.values(data)) {
          for (const [key, value] of Object.entries(group)) {
            flat[key] = value || ''
          }
        }
        setSettings(prev => ({ ...prev, ...flat }))
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (group: string, data: Record<string, string>) => {
    setSaving(true)
    try {
      const response = await fetch('/api/superadmin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group, settings: data }),
      })

      if (response.ok) {
        alert('Настройки сохранены')
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка сохранения')
      }
    } catch {
      alert('Ошибка сети')
    } finally {
      setSaving(false)
    }
  }

  const testTelegramBot = async () => {
    if (!settings.telegram_bot_token) {
      alert('Введите токен бота')
      return
    }
    setTelegramStatus('idle')
    setSaving(true)
    try {
      const response = await fetch(`https://api.telegram.org/bot${settings.telegram_bot_token}/getMe`)
      const data = await response.json()
      if (data.ok) {
        setTelegramStatus('success')
        if (data.result?.username) {
          setSettings(prev => ({ ...prev, telegram_bot_username: '@' + data.result.username }))
        }
      } else {
        setTelegramStatus('error')
      }
    } catch {
      setTelegramStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const setWebhookUrl = async () => {
    if (!settings.telegram_bot_token || !settings.telegram_webhook_url) {
      alert('Заполните токен бота и URL webhook')
      return
    }
    setSaving(true)
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${settings.telegram_bot_token}/setWebhook?url=${encodeURIComponent(settings.telegram_webhook_url)}`
      )
      const data = await response.json()
      if (data.ok) {
        alert('Webhook успешно установлен')
      } else {
        alert('Ошибка: ' + (data.description || 'Неизвестная ошибка'))
      }
    } catch {
      alert('Ошибка подключения к Telegram API')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Глобальные настройки</h1>
          <p className="text-muted-foreground">Настройки платформы GTF Global</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSettings} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Обновить
        </Button>
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
              <CardDescription>Общие настройки платформы</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Название сайта</Label>
                  <Input
                    id="site_name"
                    value={settings.site_name}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Контактный email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_description">Описание</Label>
                <Input
                  id="site_description"
                  value={settings.site_description}
                  onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                />
              </div>
              <Button
                onClick={() => saveSettings('general', {
                  site_name: settings.site_name,
                  site_description: settings.site_description,
                  contact_email: settings.contact_email,
                })}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              <CardDescription>Настройки Telegram бота для уведомлений и авторизации</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telegram_bot_token">Bot Token</Label>
                  <Input
                    id="telegram_bot_token"
                    type="password"
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    value={settings.telegram_bot_token}
                    onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegram_bot_username">Username бота</Label>
                  <Input
                    id="telegram_bot_username"
                    placeholder="@gtfglobalbot"
                    value={settings.telegram_bot_username}
                    onChange={(e) => setSettings({ ...settings, telegram_bot_username: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={testTelegramBot} disabled={saving}>
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
                  <Label htmlFor="telegram_webhook_url">Webhook URL</Label>
                  <Input
                    id="telegram_webhook_url"
                    placeholder="https://gtf.global/api/telegram/webhook"
                    value={settings.telegram_webhook_url}
                    onChange={(e) => setSettings({ ...settings, telegram_webhook_url: e.target.value })}
                  />
                </div>
                <Button variant="outline" onClick={setWebhookUrl} disabled={saving}>
                  <Webhook className="mr-2 h-4 w-4" />
                  Установить Webhook
                </Button>
              </div>

              <Button
                onClick={() => saveSettings('telegram', {
                  telegram_bot_token: settings.telegram_bot_token,
                  telegram_bot_username: settings.telegram_bot_username,
                  telegram_webhook_url: settings.telegram_webhook_url,
                })}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              <CardDescription>Настройки SMS провайдера для отправки PIN-кодов</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sms_provider">Провайдер</Label>
                  <Input
                    id="sms_provider"
                    placeholder="nikita.kg"
                    value={settings.sms_provider}
                    onChange={(e) => setSettings({ ...settings, sms_provider: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms_api_key">API Key</Label>
                  <Input
                    id="sms_api_key"
                    type="password"
                    placeholder="••••••••"
                    value={settings.sms_api_key}
                    onChange={(e) => setSettings({ ...settings, sms_api_key: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms_sender_id">Sender ID</Label>
                <Input
                  id="sms_sender_id"
                  placeholder="GTF"
                  value={settings.sms_sender_id}
                  onChange={(e) => setSettings({ ...settings, sms_sender_id: e.target.value })}
                />
              </div>
              <Button
                onClick={() => saveSettings('sms', {
                  sms_provider: settings.sms_provider,
                  sms_api_key: settings.sms_api_key,
                  sms_sender_id: settings.sms_sender_id,
                })}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              <CardDescription>SMTP настройки для отправки email уведомлений</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    placeholder="smtp.gmail.com"
                    value={settings.smtp_host}
                    onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    placeholder="587"
                    value={settings.smtp_port}
                    onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_username">Username</Label>
                  <Input
                    id="smtp_username"
                    placeholder="noreply@gtf.global"
                    value={settings.smtp_username}
                    onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">Password</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    placeholder="••••••••"
                    value={settings.smtp_password}
                    onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email_from_address">От (адрес)</Label>
                  <Input
                    id="email_from_address"
                    type="email"
                    placeholder="noreply@gtf.global"
                    value={settings.email_from_address}
                    onChange={(e) => setSettings({ ...settings, email_from_address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_from_name">От (имя)</Label>
                  <Input
                    id="email_from_name"
                    placeholder="GTF Global"
                    value={settings.email_from_name}
                    onChange={(e) => setSettings({ ...settings, email_from_name: e.target.value })}
                  />
                </div>
              </div>
              <Button
                onClick={() => saveSettings('email', {
                  smtp_host: settings.smtp_host,
                  smtp_port: settings.smtp_port,
                  smtp_username: settings.smtp_username,
                  smtp_password: settings.smtp_password,
                  email_from_address: settings.email_from_address,
                  email_from_name: settings.email_from_name,
                })}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
