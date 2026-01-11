import prisma from '@/lib/prisma'
import { getSmsSettingsByPhone, type SmsSettings } from '@/services/settings/settings.service'

interface SmsSendResult {
  success: boolean
  error?: string
}

// SMS провайдеры
type SmsProvider = 'nikita' | 'none'

interface SmsProviderConfig {
  provider: SmsProvider
  apiKey: string | null
  apiUrl: string
  sender: string
}

/**
 * Получить конфигурацию SMS провайдера из БД по номеру телефона
 */
async function getSmsProviderConfig(phone: string): Promise<SmsProviderConfig> {
  // Получаем настройки из БД
  const result = await getSmsSettingsByPhone(phone)

  if (result && result.settings.enabled && result.settings.apiKey) {
    return {
      provider: (result.settings.provider as SmsProvider) || 'nikita',
      apiKey: result.settings.apiKey,
      apiUrl: result.settings.apiUrl || 'https://smspro.nikita.kg/api/message',
      sender: result.settings.sender || 'GTF',
    }
  }

  // Fallback на env переменные для обратной совместимости
  const normalized = phone.replace(/\D/g, '')

  if (normalized.startsWith('996')) {
    const envApiKey = process.env.SMS_NIKITA_API_KEY
    if (envApiKey) {
      return {
        provider: 'nikita',
        apiKey: envApiKey,
        apiUrl: process.env.SMS_NIKITA_API_URL || 'https://smspro.nikita.kg/api/message',
        sender: process.env.SMS_NIKITA_SENDER || 'GTF',
      }
    }
  }

  return {
    provider: 'none',
    apiKey: null,
    apiUrl: '',
    sender: '',
  }
}

/**
 * Send PIN via SMS
 * Настройки берутся из БД для каждой федерации
 */
export async function sendPinViaSms(
  phone: string,
  pin: string,
  locale: string = 'ru'
): Promise<SmsSendResult> {
  const providerConfig = await getSmsProviderConfig(phone)

  // Провайдер не настроен для данной страны
  if (providerConfig.provider === 'none') {
    console.log(`SMS not configured for phone: ${phone}`)
    return {
      success: false,
      error: 'SMS не настроен для вашей страны. Используйте Telegram.'
    }
  }

  // API ключ не настроен
  if (!providerConfig.apiKey) {
    console.error(`SMS API key not configured for provider: ${providerConfig.provider}`)
    return { success: false, error: 'SMS service not configured' }
  }

  const messages: Record<string, string> = {
    ru: `GTF: Ваш код: ${pin}`,
    en: `GTF: Your code: ${pin}`,
    kg: `GTF: Кодуңуз: ${pin}`,
    kz: `GTF: Кодыңыз: ${pin}`,
    uz: `GTF: Kodingiz: ${pin}`,
  }

  const message = messages[locale] || messages.ru

  // Отправка через нужного провайдера
  if (providerConfig.provider === 'nikita') {
    return sendViaNikita(phone, message, providerConfig)
  }

  return { success: false, error: 'Unknown SMS provider' }
}

/**
 * Отправка SMS через Nikita (Кыргызстан)
 */
async function sendViaNikita(
  phone: string,
  message: string,
  config: SmsProviderConfig
): Promise<SmsSendResult> {
  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        sender: config.sender,
        recipient: normalizePhoneNumber(phone),
        message,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('SMS Nikita API error:', error)
      return { success: false, error: 'Failed to send SMS' }
    }

    // Log notification
    await logSmsNotification(phone, 'sms_pin', 'Login PIN', message)

    return { success: true }
  } catch (error) {
    console.error('SMS Nikita send error:', error)
    return { success: false, error: 'Failed to connect to SMS service' }
  }
}

/**
 * Normalize phone number to international format
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, '')

  // Handle Kyrgyzstan numbers
  if (normalized.startsWith('0')) {
    normalized = '996' + normalized.substring(1)
  }

  // Handle Kazakhstan numbers
  if (normalized.startsWith('7') && normalized.length === 11) {
    // Already in correct format
  }

  // Handle Russia numbers
  if (normalized.startsWith('8') && normalized.length === 11) {
    normalized = '7' + normalized.substring(1)
  }

  // Add + prefix
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized
  }

  return normalized
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = phone.replace(/\D/g, '')

  // Minimum 10 digits, maximum 15
  if (normalized.length < 10 || normalized.length > 15) {
    return false
  }

  // Check for valid country codes
  const validPrefixes = ['996', '7', '998', '971', '1'] // KG, KZ/RU, UZ, UAE, US

  return validPrefixes.some(prefix => normalized.startsWith(prefix))
}

/**
 * Log SMS notification
 */
async function logSmsNotification(
  phone: string,
  type: string,
  title: string,
  message: string
): Promise<void> {
  try {
    const user = await prisma.user.findFirst({
      where: { phone },
      select: { id: true },
    })

    if (user) {
      await prisma.notificationLog.create({
        data: {
          userId: user.id,
          notificationType: type,
          title,
          message,
        },
      })
    }
  } catch (error) {
    console.error('Failed to log SMS notification:', error)
  }
}

/**
 * Create phone verification
 */
export async function createPhoneVerification(phone: string): Promise<{
  code: string
  expiresAt: Date
}> {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  // Delete existing
  await prisma.phoneVerification.deleteMany({
    where: { phone },
  })

  // Create new
  await prisma.phoneVerification.create({
    data: {
      phone,
      code,
      expiresAt,
    },
  })

  return { code, expiresAt }
}

/**
 * Verify phone number
 */
export async function verifyPhoneNumber(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const verification = await prisma.phoneVerification.findFirst({
    where: {
      phone,
      verifiedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!verification) {
    return { success: false, error: 'Verification not found' }
  }

  if (new Date() > verification.expiresAt) {
    return { success: false, error: 'Verification code expired' }
  }

  if (verification.attemptCount >= 5) {
    return { success: false, error: 'Too many attempts' }
  }

  if (verification.code !== code) {
    await prisma.phoneVerification.update({
      where: { id: verification.id },
      data: { attemptCount: verification.attemptCount + 1 },
    })
    return { success: false, error: 'Invalid code' }
  }

  await prisma.phoneVerification.update({
    where: { id: verification.id },
    data: { verifiedAt: new Date() },
  })

  return { success: true }
}
