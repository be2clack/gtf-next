'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Save, MessageSquare, Send, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

interface SmsSettings {
  provider: string | null
  apiKey: string | null
  apiUrl: string | null
  sender: string | null
  enabled: boolean
  hasApiKey?: boolean
}

interface SmsProvider {
  name: string
  description: string
  countries: string[]
  apiUrl: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [federationId, setFederationId] = useState<number>(1) // TODO: получить из контекста

  // SMS Settings
  const [smsSettings, setSmsSettings] = useState<SmsSettings>({
    provider: null,
    apiKey: null,
    apiUrl: null,
    sender: null,
    enabled: false,
  })
  const [smsProviders, setSmsProviders] = useState<Record<string, SmsProvider>>({})

  // Telegram Settings
  const [telegramWebhookStatus, setTelegramWebhookStatus] = useState<'unknown' | 'active' | 'inactive'>('unknown')
  const [settingWebhook, setSettingWebhook] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [federationId])

  const loadSettings = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load SMS settings
      const smsRes = await fetch(`/api/admin/settings/sms?federationId=${federationId}`)
      const smsData = await smsRes.json()

      if (smsData.success) {
        setSmsSettings(smsData.settings)
        setSmsProviders(smsData.providers)
      }

      // Load Telegram webhook status
      const tgRes = await fetch('/api/telegram/webhook/status')
      if (tgRes.ok) {
        const tgData = await tgRes.json()
        setTelegramWebhookStatus(tgData.active ? 'active' : 'inactive')
      }
    } catch (err) {
      console.error('Load settings error:', err)
      setError('Ошибка загрузки настроек')
    } finally {
      setLoading(false)
    }
  }

  const saveSmsSettings = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/admin/settings/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          federationId,
          ...smsSettings,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess('SMS настройки сохранены')
        // Reload to get masked key
        loadSettings()
      } else {
        setError(data.error || 'Ошибка сохранения')
      }
    } catch (err) {
      setError('Ошибка сохранения настроек')
    } finally {
      setSaving(false)
    }
  }

  const setTelegramWebhook = async () => {
    setSettingWebhook(true)
    setError(null)
    setSuccess(null)

    try {
      const webhookUrl = `${window.location.origin}/api/telegram/webhook`
      const res = await fetch('/api/telegram/webhook/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess('Telegram webhook установлен')
        setTelegramWebhookStatus('active')
      } else {
        setError(data.error || 'Ошибка установки webhook')
      }
    } catch (err) {
      setError('Ошибка установки webhook')
    } finally {
      setSettingWebhook(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Настройки</h1>
        <p className="text-muted-foreground">
          Управление настройками SMS и Telegram
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="sms">
        <TabsList>
          <TabsTrigger value="sms">
            <MessageSquare className="h-4 w-4 mr-2" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="telegram">
            <Send className="h-4 w-4 mr-2" />
            Telegram
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS Провайдер</CardTitle>
              <CardDescription>
                Настройки SMS для отправки PIN-кодов. Для Кыргызстана используйте smspro.nikita.kg
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS включен</Label>
                  <p className="text-sm text-muted-foreground">
                    Отправлять PIN-коды через SMS
                  </p>
                </div>
                <Switch
                  checked={smsSettings.enabled}
                  onCheckedChange={(checked) =>
                    setSmsSettings({ ...smsSettings, enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Провайдер</Label>
                <Select
                  value={smsSettings.provider || ''}
                  onValueChange={(value) =>
                    setSmsSettings({
                      ...smsSettings,
                      provider: value,
                      apiUrl: smsProviders[value]?.apiUrl || smsSettings.apiUrl,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите провайдера" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(smsProviders).map(([key, provider]) => (
                      <SelectItem key={key} value={key}>
                        {provider.name} - {provider.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>API URL</Label>
                <Input
                  value={smsSettings.apiUrl || ''}
                  onChange={(e) =>
                    setSmsSettings({ ...smsSettings, apiUrl: e.target.value })
                  }
                  placeholder="https://smspro.nikita.kg/api/message"
                />
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={smsSettings.apiKey || ''}
                  onChange={(e) =>
                    setSmsSettings({ ...smsSettings, apiKey: e.target.value })
                  }
                  placeholder={smsSettings.hasApiKey ? '••••••••' : 'Введите API ключ'}
                />
                <p className="text-xs text-muted-foreground">
                  Получите API ключ на сайте провайдера (smspro.nikita.kg)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Sender ID</Label>
                <Input
                  value={smsSettings.sender || ''}
                  onChange={(e) =>
                    setSmsSettings({ ...smsSettings, sender: e.target.value })
                  }
                  placeholder="GTF"
                />
                <p className="text-xs text-muted-foreground">
                  Имя отправителя (макс. 11 символов)
                </p>
              </div>

              <Button onClick={saveSmsSettings} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
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
                Настройки Telegram бота для отправки PIN-кодов и уведомлений
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Статус Webhook:</span>
                {telegramWebhookStatus === 'active' ? (
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Активен
                  </span>
                ) : telegramWebhookStatus === 'inactive' ? (
                  <span className="flex items-center text-yellow-600">
                    <XCircle className="h-4 w-4 mr-1" />
                    Не настроен
                  </span>
                ) : (
                  <span className="text-muted-foreground">Неизвестно</span>
                )}
              </div>

              <div className="space-y-2">
                <Label>Bot Username</Label>
                <Input
                  value={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'gtfglobalbot'}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  <a
                    href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'gtfglobalbot'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Открыть бота в Telegram
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={typeof window !== 'undefined' ? `${window.location.origin}/api/telegram/webhook` : ''}
                  disabled
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={setTelegramWebhook} disabled={settingWebhook}>
                  {settingWebhook ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Установить Webhook
                </Button>
                <Button variant="outline" onClick={loadSettings}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Обновить статус
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Привязка Telegram</CardTitle>
              <CardDescription>
                Пользователи могут привязать свой Telegram для получения PIN-кодов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Пользователь открывает бота @gtfglobalbot в Telegram</li>
                <li>Нажимает /start и выбирает язык</li>
                <li>Отправляет номер телефона через кнопку</li>
                <li>Подтверждает привязку аккаунта</li>
                <li>После привязки PIN-коды будут приходить в Telegram</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
