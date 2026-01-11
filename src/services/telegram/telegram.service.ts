const TELEGRAM_API_URL = 'https://api.telegram.org/bot'

interface TelegramResponse {
  ok: boolean
  description?: string
  result?: unknown
}

/**
 * Отправить сообщение в Telegram
 */
export async function sendMessage(
  chatId: string,
  text: string,
  keyboard?: object,
  parseMode: string = 'HTML'
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured')
    return false
  }

  try {
    const data: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }

    if (keyboard) {
      data.reply_markup = keyboard
    }

    const response = await fetch(`${TELEGRAM_API_URL}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result: TelegramResponse = await response.json()

    if (!result.ok) {
      console.error('Telegram sendMessage error:', result)
      return false
    }

    return true
  } catch (error) {
    console.error('Telegram sendMessage exception:', error)
    return false
  }
}

/**
 * Редактировать сообщение
 */
export async function editMessage(
  chatId: string,
  messageId: number,
  text: string,
  keyboard?: object,
  parseMode: string = 'HTML'
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured')
    return false
  }

  try {
    const data: Record<string, unknown> = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: parseMode,
    }

    if (keyboard) {
      data.reply_markup = keyboard
    }

    const response = await fetch(`${TELEGRAM_API_URL}${botToken}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result: TelegramResponse = await response.json()
    return result.ok
  } catch (error) {
    console.error('Telegram editMessage exception:', error)
    return false
  }
}

/**
 * Ответить на callback query
 */
export async function answerCallback(
  callbackQueryId: string,
  text: string = '',
  showAlert: boolean = false
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    return false
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    })

    const result: TelegramResponse = await response.json()
    return result.ok
  } catch (error) {
    console.error('Telegram answerCallback exception:', error)
    return false
  }
}

/**
 * Установить webhook
 */
export async function setWebhook(url: string): Promise<TelegramResponse> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    return { ok: false, description: 'Bot token not configured' }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        allowed_updates: ['message', 'callback_query'],
      }),
    })

    return await response.json()
  } catch (error) {
    console.error('Telegram setWebhook exception:', error)
    return { ok: false, description: String(error) }
  }
}

/**
 * Получить информацию о webhook
 */
export async function getWebhookInfo(): Promise<TelegramResponse> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    return { ok: false, description: 'Bot token not configured' }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${botToken}/getWebhookInfo`)
    return await response.json()
  } catch (error) {
    return { ok: false, description: String(error) }
  }
}

/**
 * Отправить PIN-код
 */
export async function sendPinCode(chatId: string, pin: string, locale: string = 'ru'): Promise<boolean> {
  const messages: Record<string, string> = {
    ru: `<b>Ваш код для входа в GTF:</b>\n\n<code>${pin}</code>\n\nКод действителен 5 минут.\nНажмите на код, чтобы скопировать.`,
    en: `<b>Your GTF login code:</b>\n\n<code>${pin}</code>\n\nCode is valid for 5 minutes.\nTap to copy.`,
    kg: `<b>GTF'ге кируу кодуңуз:</b>\n\n<code>${pin}</code>\n\nКод 5 мунут жарактуу.\nКөчүрүү үчүн басыңыз.`,
  }

  const message = messages[locale] || messages.ru
  return sendMessage(chatId, message)
}
