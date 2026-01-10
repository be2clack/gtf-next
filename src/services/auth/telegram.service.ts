import prisma from '@/lib/prisma'

const TELEGRAM_API_URL = 'https://api.telegram.org/bot'

interface TelegramSendResult {
  success: boolean
  error?: string
}

/**
 * Send PIN via Telegram
 */
export async function sendPinViaTelegram(
  chatId: string,
  pin: string,
  locale: string = 'ru'
): Promise<TelegramSendResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured')
    return { success: false, error: 'Telegram bot not configured' }
  }

  const messages: Record<string, string> = {
    ru: `Ваш код для входа в GTF: ${pin}\n\nКод действителен 5 минут.`,
    en: `Your GTF login code: ${pin}\n\nCode is valid for 5 minutes.`,
    kg: `GTF'ге кируу кодуңуз: ${pin}\n\nКод 5 мунут жарактуу.`,
    kz: `GTF'ке кіру кодыңыз: ${pin}\n\nКод 5 минут жарамды.`,
    uz: `GTF ga kirish kodingiz: ${pin}\n\nKod 5 daqiqa amal qiladi.`,
  }

  const message = messages[locale] || messages.ru

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error('Telegram API error:', data)
      return { success: false, error: data.description || 'Failed to send message' }
    }

    // Log notification
    await logNotification(chatId, 'telegram_pin', 'Login PIN', message)

    return { success: true }
  } catch (error) {
    console.error('Telegram send error:', error)
    return { success: false, error: 'Failed to connect to Telegram' }
  }
}

/**
 * Find Telegram chat ID by phone number
 */
export async function findTelegramChatIdByPhone(phone: string): Promise<string | null> {
  // Check user
  const user = await prisma.user.findFirst({
    where: { phone, telegramChatId: { not: null } },
    select: { telegramChatId: true },
  })

  if (user?.telegramChatId) return user.telegramChatId

  // Check sportsman
  const sportsman = await prisma.sportsman.findFirst({
    where: { phone, telegramChatId: { not: null } },
    select: { telegramChatId: true },
  })

  if (sportsman?.telegramChatId) return sportsman.telegramChatId

  // Check representative
  const representative = await prisma.representative.findFirst({
    where: { phone, telegramChatId: { not: null } },
    select: { telegramChatId: true },
  })

  if (representative?.telegramChatId) return representative.telegramChatId

  // Check telegram bot users via linked user
  const linkedUser = await prisma.user.findFirst({
    where: { phone },
    select: { id: true },
  })

  if (linkedUser) {
    const botUser = await prisma.telegramBotUser.findFirst({
      where: { userId: linkedUser.id },
      select: { telegramChatId: true },
    })
    if (botUser?.telegramChatId) return botUser.telegramChatId
  }

  return null
}

/**
 * Verify Telegram account
 */
export async function verifyTelegramAccount(
  telegramChatId: string,
  verificationCode: string
): Promise<{ success: boolean; userId?: number; error?: string }> {
  const verification = await prisma.telegramVerification.findFirst({
    where: {
      telegramChatId,
      verificationCode,
      verifiedAt: null,
    },
  })

  if (!verification) {
    return { success: false, error: 'Invalid verification code' }
  }

  if (new Date() > verification.expiresAt) {
    return { success: false, error: 'Verification code expired' }
  }

  // Mark as verified
  await prisma.telegramVerification.update({
    where: { id: verification.id },
    data: { verifiedAt: new Date() },
  })

  // Update user if linked
  if (verification.userId) {
    await prisma.user.update({
      where: { id: verification.userId },
      data: {
        telegramChatId,
        telegramVerifiedAt: new Date(),
      },
    })
  }

  return { success: true, userId: verification.userId ?? undefined }
}

/**
 * Send notification to Telegram
 */
export async function sendTelegramNotification(
  chatId: string,
  message: string
): Promise<TelegramSendResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    return { success: false, error: 'Telegram bot not configured' }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    const data = await response.json()
    return { success: data.ok, error: data.description }
  } catch (error) {
    console.error('Telegram notification error:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}

/**
 * Log notification
 */
async function logNotification(
  chatId: string,
  type: string,
  title: string,
  message: string
): Promise<void> {
  try {
    // Find user by telegram chat id
    const user = await prisma.user.findFirst({
      where: { telegramChatId: chatId },
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
    console.error('Failed to log notification:', error)
  }
}
