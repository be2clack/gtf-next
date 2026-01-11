import { NextRequest, NextResponse } from 'next/server'
import { setWebhook } from '@/services/telegram/telegram.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      )
    }

    const result = await setWebhook(url)

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.description || 'Failed to set webhook' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook set successfully',
    })
  } catch (error) {
    console.error('Set Telegram webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to set webhook' },
      { status: 500 }
    )
  }
}
