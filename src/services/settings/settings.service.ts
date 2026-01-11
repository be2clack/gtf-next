import prisma from '@/lib/prisma'

// SMS провайдеры
export const SMS_PROVIDERS = {
  nikita: {
    name: 'SMS Nikita',
    description: 'SMS провайдер для Кыргызстана (+996)',
    countries: ['996'],
    apiUrl: 'https://smspro.nikita.kg/api/message',
  },
  // Добавить других провайдеров по мере необходимости
} as const

export type SmsProviderKey = keyof typeof SMS_PROVIDERS

export interface SmsSettings {
  provider: SmsProviderKey | null
  apiKey: string | null
  apiUrl: string | null
  sender: string | null
  enabled: boolean
}

/**
 * Получить настройки SMS для федерации
 */
export async function getSmsSettings(federationId: number): Promise<SmsSettings> {
  const settings = await prisma.setting.findMany({
    where: {
      federationId,
      key: {
        in: ['sms_provider', 'sms_api_key', 'sms_api_url', 'sms_sender', 'sms_enabled'],
      },
    },
  })

  const settingsMap = new Map(settings.map(s => [s.key, s.value]))

  return {
    provider: (settingsMap.get('sms_provider') as SmsProviderKey) || null,
    apiKey: settingsMap.get('sms_api_key') || null,
    apiUrl: settingsMap.get('sms_api_url') || null,
    sender: settingsMap.get('sms_sender') || null,
    enabled: settingsMap.get('sms_enabled') === 'true',
  }
}

/**
 * Сохранить настройки SMS для федерации
 */
export async function saveSmsSettings(
  federationId: number,
  settings: Partial<SmsSettings>
): Promise<void> {
  const updates: { key: string; value: string }[] = []

  if (settings.provider !== undefined) {
    updates.push({ key: 'sms_provider', value: settings.provider || '' })
  }
  if (settings.apiKey !== undefined) {
    updates.push({ key: 'sms_api_key', value: settings.apiKey || '' })
  }
  if (settings.apiUrl !== undefined) {
    updates.push({ key: 'sms_api_url', value: settings.apiUrl || '' })
  }
  if (settings.sender !== undefined) {
    updates.push({ key: 'sms_sender', value: settings.sender || '' })
  }
  if (settings.enabled !== undefined) {
    updates.push({ key: 'sms_enabled', value: settings.enabled ? 'true' : 'false' })
  }

  for (const { key, value } of updates) {
    await prisma.setting.upsert({
      where: {
        federationId_key: {
          federationId,
          key,
        },
      },
      update: { value },
      create: {
        federationId,
        key,
        value,
        group: 'sms',
        dataType: 'string',
      },
    })
  }
}

/**
 * Получить настройки SMS по коду страны телефона
 */
export async function getSmsSettingsByPhone(phone: string): Promise<{
  federationId: number
  settings: SmsSettings
} | null> {
  const normalized = phone.replace(/\D/g, '')

  // Определяем код страны
  let countryCode: string | null = null

  if (normalized.startsWith('996')) {
    countryCode = 'kg'
  } else if (normalized.startsWith('7') && normalized.length === 11) {
    countryCode = 'kz' // или ru
  } else if (normalized.startsWith('998')) {
    countryCode = 'uz'
  } else if (normalized.startsWith('971')) {
    countryCode = 'ae'
  }

  if (!countryCode) {
    return null
  }

  // Находим федерацию по коду страны
  const federation = await prisma.federation.findFirst({
    where: { code: countryCode },
  })

  if (!federation) {
    return null
  }

  const settings = await getSmsSettings(federation.id)

  return {
    federationId: federation.id,
    settings,
  }
}

/**
 * Получить Telegram настройки
 */
export async function getTelegramSettings(): Promise<{
  botToken: string | null
  botUsername: string | null
  webhookUrl: string | null
}> {
  // Telegram настройки глобальные (из env или настроек без федерации)
  const settings = await prisma.setting.findMany({
    where: {
      federationId: null,
      key: {
        in: ['telegram_bot_token', 'telegram_bot_username', 'telegram_webhook_url'],
      },
    },
  })

  const settingsMap = new Map(settings.map(s => [s.key, s.value]))

  return {
    botToken: settingsMap.get('telegram_bot_token') || process.env.TELEGRAM_BOT_TOKEN || null,
    botUsername: settingsMap.get('telegram_bot_username') || process.env.TELEGRAM_BOT_USERNAME || null,
    webhookUrl: settingsMap.get('telegram_webhook_url') || null,
  }
}

/**
 * Сохранить Telegram настройки
 */
export async function saveTelegramSettings(settings: {
  botToken?: string
  botUsername?: string
  webhookUrl?: string
}): Promise<void> {
  const updates: { key: string; value: string }[] = []

  if (settings.botToken !== undefined) {
    updates.push({ key: 'telegram_bot_token', value: settings.botToken })
  }
  if (settings.botUsername !== undefined) {
    updates.push({ key: 'telegram_bot_username', value: settings.botUsername })
  }
  if (settings.webhookUrl !== undefined) {
    updates.push({ key: 'telegram_webhook_url', value: settings.webhookUrl })
  }

  for (const { key, value } of updates) {
    await prisma.setting.upsert({
      where: {
        federationId_key: {
          federationId: 0, // null не работает в unique constraint, используем 0
          key,
        },
      },
      update: { value },
      create: {
        federationId: null,
        key,
        value,
        group: 'telegram',
        dataType: 'string',
      },
    })
  }
}
