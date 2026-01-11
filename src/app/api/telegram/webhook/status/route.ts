import { NextResponse } from 'next/server'
import { getWebhookInfo } from '@/services/telegram/telegram.service'

export async function GET() {
  try {
    const result = await getWebhookInfo()

    if (!result.ok) {
      return NextResponse.json({
        active: false,
        error: result.description,
      })
    }

    const webhookInfo = result.result as {
      url?: string
      has_custom_certificate?: boolean
      pending_update_count?: number
      last_error_date?: number
      last_error_message?: string
    }

    return NextResponse.json({
      active: !!webhookInfo?.url,
      url: webhookInfo?.url || null,
      pendingUpdates: webhookInfo?.pending_update_count || 0,
      lastError: webhookInfo?.last_error_message || null,
    })
  } catch (error) {
    console.error('Telegram webhook status error:', error)
    return NextResponse.json({
      active: false,
      error: 'Failed to get webhook status',
    })
  }
}
