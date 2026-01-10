import { NextRequest, NextResponse } from 'next/server'
import { createLoginPin, findOrCreateUserByPhone } from '@/services/auth/pin.service'
import { sendPinViaTelegram, findTelegramChatIdByPhone } from '@/services/auth/telegram.service'
import { sendPinViaSms, isValidPhoneNumber } from '@/services/auth/sms.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, method = 'auto' } = body

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Find or create user
    const { user } = await findOrCreateUserByPhone(phone)

    // Create login PIN
    const { pin, expiresAt } = await createLoginPin(phone, user.id)

    // Get locale from header
    const locale = request.headers.get('x-locale') || 'ru'

    let sendResult: { success: boolean; error?: string } = { success: false }
    let usedMethod = method

    // Auto method: try Telegram first, then SMS
    if (method === 'auto' || method === 'telegram') {
      const telegramChatId = await findTelegramChatIdByPhone(phone)

      if (telegramChatId) {
        sendResult = await sendPinViaTelegram(telegramChatId, pin, locale)
        usedMethod = 'telegram'
      }
    }

    // If Telegram failed or not available, try SMS
    if (!sendResult.success && (method === 'auto' || method === 'sms')) {
      sendResult = await sendPinViaSms(phone, pin, locale)
      usedMethod = 'sms'
    }

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: sendResult.error || 'Failed to send PIN. Please try again.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: usedMethod === 'telegram'
        ? 'PIN sent to your Telegram'
        : 'PIN sent via SMS',
      method: usedMethod,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Send PIN error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
