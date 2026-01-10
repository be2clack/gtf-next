import prisma from '@/lib/prisma'

interface SmsSendResult {
  success: boolean
  error?: string
}

/**
 * Send PIN via SMS
 * Using Nikita SMS gateway (or similar)
 */
export async function sendPinViaSms(
  phone: string,
  pin: string,
  locale: string = 'ru'
): Promise<SmsSendResult> {
  const apiKey = process.env.SMS_API_KEY
  const senderId = process.env.SMS_SENDER_ID || 'GTF'

  if (!apiKey) {
    console.error('SMS_API_KEY not configured')
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

  try {
    // Example with Nikita SMS API
    // Replace with your actual SMS gateway
    const response = await fetch('https://smspro.nikita.kg/api/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        sender: senderId,
        recipient: normalizePhoneNumber(phone),
        message,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('SMS API error:', error)
      return { success: false, error: 'Failed to send SMS' }
    }

    // Log notification
    await logSmsNotification(phone, 'sms_pin', 'Login PIN', message)

    return { success: true }
  } catch (error) {
    console.error('SMS send error:', error)
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
