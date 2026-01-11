import { NextRequest, NextResponse } from 'next/server'
import { getSmsSettings, saveSmsSettings, SMS_PROVIDERS } from '@/services/settings/settings.service'
import prisma from '@/lib/prisma'

// GET /api/admin/settings/sms?federationId=1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const federationId = searchParams.get('federationId')

    if (!federationId) {
      return NextResponse.json(
        { error: 'Federation ID is required' },
        { status: 400 }
      )
    }

    const settings = await getSmsSettings(parseInt(federationId))

    // Маскируем API ключ для безопасности
    const maskedSettings = {
      ...settings,
      apiKey: settings.apiKey ? '••••••••' + settings.apiKey.slice(-4) : null,
      hasApiKey: !!settings.apiKey,
    }

    return NextResponse.json({
      success: true,
      settings: maskedSettings,
      providers: SMS_PROVIDERS,
    })
  } catch (error) {
    console.error('Get SMS settings error:', error)
    return NextResponse.json(
      { error: 'Failed to get SMS settings' },
      { status: 500 }
    )
  }
}

// POST /api/admin/settings/sms
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { federationId, provider, apiKey, apiUrl, sender, enabled } = body

    if (!federationId) {
      return NextResponse.json(
        { error: 'Federation ID is required' },
        { status: 400 }
      )
    }

    // Проверяем существование федерации
    const federation = await prisma.federation.findUnique({
      where: { id: federationId },
    })

    if (!federation) {
      return NextResponse.json(
        { error: 'Federation not found' },
        { status: 404 }
      )
    }

    // Сохраняем настройки (apiKey сохраняем только если он не замаскирован)
    const settingsToSave: Parameters<typeof saveSmsSettings>[1] = {}

    if (provider !== undefined) settingsToSave.provider = provider
    if (apiKey !== undefined && !apiKey.startsWith('••••')) {
      settingsToSave.apiKey = apiKey
    }
    if (apiUrl !== undefined) settingsToSave.apiUrl = apiUrl
    if (sender !== undefined) settingsToSave.sender = sender
    if (enabled !== undefined) settingsToSave.enabled = enabled

    await saveSmsSettings(federationId, settingsToSave)

    return NextResponse.json({
      success: true,
      message: 'SMS settings saved successfully',
    })
  } catch (error) {
    console.error('Save SMS settings error:', error)
    return NextResponse.json(
      { error: 'Failed to save SMS settings' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/settings/sms - очистить API ключ
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const federationId = searchParams.get('federationId')

    if (!federationId) {
      return NextResponse.json(
        { error: 'Federation ID is required' },
        { status: 400 }
      )
    }

    await saveSmsSettings(parseInt(federationId), {
      apiKey: '',
      enabled: false,
    })

    return NextResponse.json({
      success: true,
      message: 'SMS API key cleared',
    })
  } catch (error) {
    console.error('Delete SMS settings error:', error)
    return NextResponse.json(
      { error: 'Failed to clear SMS settings' },
      { status: 500 }
    )
  }
}
