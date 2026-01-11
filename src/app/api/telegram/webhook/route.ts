import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendMessage, editMessage, answerCallback } from '@/services/telegram/telegram.service'
import { t, tFormat } from '@/services/telegram/translations'

interface TelegramUpdate {
  message?: {
    chat: { id: number }
    from: { id: number; username?: string; first_name?: string; last_name?: string }
    text?: string
    contact?: { phone_number: string }
  }
  callback_query?: {
    id: string
    message: { chat: { id: number }; message_id: number }
    from: { id: number; username?: string; first_name?: string; last_name?: string }
    data: string
  }
}

interface CallbackData {
  action: string
  lang?: string
  phone?: string
  username?: string
}

// Получить язык из data поля TelegramBotUser
function getLanguageFromData(data: unknown): string {
  if (data && typeof data === 'object' && 'language' in data) {
    return (data as { language: string }).language || 'ru'
  }
  return 'ru'
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json()
    console.log('Telegram webhook received:', JSON.stringify(update).slice(0, 500))

    // Обработка callback (нажатие кнопки)
    if (update.callback_query) {
      await handleCallback(update.callback_query)
      return NextResponse.json({ ok: true })
    }

    if (!update.message) {
      return NextResponse.json({ ok: true })
    }

    const message = update.message
    const chatId = String(message.chat.id)
    const telegramUserId = String(message.from.id)
    const text = message.text || ''
    const username = message.from.username || null

    // Обработка команды /start
    if (text.startsWith('/start')) {
      await handleStart(chatId, telegramUserId, message.from.first_name, message.from.last_name, username)
      return NextResponse.json({ ok: true })
    }

    // Обработка контакта (ТОЛЬКО через кнопку Telegram)
    if (message.contact) {
      const phone = message.contact.phone_number
      await handlePhoneNumber(chatId, telegramUserId, phone, username)
      return NextResponse.json({ ok: true })
    }

    // Получаем язык пользователя
    const botUser = await prisma.telegramBotUser.findFirst({
      where: { telegramUserId },
    })
    const lang = getLanguageFromData(botUser?.data)

    // Блокируем текстовую отправку номера
    await sendMessage(chatId, t('text_blocked', lang), undefined, 'Markdown')

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true })
  }
}

/**
 * Обработка команды /start
 */
async function handleStart(
  chatId: string,
  telegramUserId: string,
  firstName?: string,
  lastName?: string,
  username?: string | null
): Promise<void> {
  // Проверяем, есть ли пользователь в базе
  const botUser = await prisma.telegramBotUser.findFirst({
    where: { telegramUserId },
  })

  // Если пользователь новый - предлагаем выбрать язык
  if (!botUser) {
    const message = t('select_language', 'ru')

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🇷🇺 Русский', callback_data: JSON.stringify({ action: 'set_lang', lang: 'ru' }) },
          { text: '🇰🇬 Кыргызча', callback_data: JSON.stringify({ action: 'set_lang', lang: 'kg' }) },
        ],
        [{ text: '🇬🇧 English', callback_data: JSON.stringify({ action: 'set_lang', lang: 'en' }) }],
      ],
    }

    await sendMessage(chatId, message, keyboard, 'Markdown')
    return
  }

  // Если пользователь уже есть - показываем приветствие на его языке
  const lang = getLanguageFromData(botUser.data)

  let message = t('welcome_title', lang) + '\n\n'
  message += t('welcome_description', lang) + '\n\n'
  message += t('secure_verification', lang) + '\n\n'
  message += t('text_not_allowed', lang)

  const keyboard = {
    keyboard: [[{ text: t('send_phone_button', lang), request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  }

  await sendMessage(chatId, message, keyboard, 'Markdown')
}

/**
 * Обработка номера телефона
 */
async function handlePhoneNumber(
  chatId: string,
  telegramUserId: string,
  phone: string,
  username: string | null
): Promise<void> {
  // Получаем язык пользователя
  const botUser = await prisma.telegramBotUser.findFirst({
    where: { telegramUserId },
  })
  const lang = getLanguageFromData(botUser?.data)

  // Очистка номера
  let cleanPhone = phone.replace(/[^0-9+]/g, '')

  // Форматирование (добавляем + если нет)
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = '+' + cleanPhone
  }

  // Проверяем, существует ли пользователь с таким номером
  const user = await prisma.user.findFirst({ where: { phone: cleanPhone } })
  const sportsman = await prisma.sportsman.findFirst({ where: { phone: cleanPhone } })
  const representative = await prisma.representative.findFirst({ where: { phone: cleanPhone } })

  if (!user && !sportsman && !representative) {
    const message = tFormat('user_not_found', lang, cleanPhone)
    await sendMessage(chatId, message)
    return
  }

  // Определяем ФИО
  let fullName = ''

  if (sportsman) {
    fullName = sportsman.fio || `${sportsman.lastName || ''} ${sportsman.firstName || ''}`.trim()
  } else if (representative) {
    fullName = `${representative.lastName} ${representative.firstName}`.trim()
  } else if (user) {
    fullName = user.name || ''
  }

  // Отправляем подтверждение с кнопкой
  let message = t('user_found', lang) + '\n\n'
  message += `👤 *${fullName}*\n`
  message += `📱 ${cleanPhone}\n\n`
  message += t('is_this_you', lang)

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: t('yes_button', lang),
          callback_data: JSON.stringify({
            action: 'confirm',
            phone: cleanPhone,
            username,
          }),
        },
      ],
      [
        {
          text: t('no_button', lang),
          callback_data: JSON.stringify({ action: 'cancel' }),
        },
      ],
    ],
  }

  await sendMessage(chatId, message, keyboard, 'Markdown')
}

/**
 * Обработка callback (нажатие кнопки)
 */
async function handleCallback(callbackQuery: NonNullable<TelegramUpdate['callback_query']>): Promise<void> {
  const chatId = String(callbackQuery.message.chat.id)
  const telegramUserId = String(callbackQuery.from.id)
  const messageId = callbackQuery.message.message_id
  const data: CallbackData = JSON.parse(callbackQuery.data)
  const callbackId = callbackQuery.id
  const username = callbackQuery.from.username || null
  const firstName = callbackQuery.from.first_name || null
  const lastName = callbackQuery.from.last_name || null

  if (!data.action) {
    return
  }

  // Получаем язык пользователя
  const botUser = await prisma.telegramBotUser.findFirst({
    where: { telegramUserId },
  })
  let lang = getLanguageFromData(botUser?.data)

  // Обработка выбора языка
  if (data.action === 'set_lang' && data.lang) {
    const selectedLang = data.lang

    // Создаем или обновляем пользователя
    await prisma.telegramBotUser.upsert({
      where: { telegramUserId },
      update: {
        telegramChatId: chatId,
        data: { language: selectedLang },
      },
      create: {
        telegramUserId,
        telegramChatId: chatId,
        firstName,
        lastName,
        telegramUsername: username,
        data: { language: selectedLang },
      },
    })

    lang = selectedLang

    // Отправляем подтверждение
    let message = t('language_selected', selectedLang) + '\n\n'
    message += t('welcome_title', selectedLang) + '\n\n'
    message += t('welcome_description', selectedLang) + '\n\n'
    message += t('secure_verification', selectedLang) + '\n\n'
    message += t('text_not_allowed', selectedLang)

    const keyboard = {
      keyboard: [[{ text: t('send_phone_button', selectedLang), request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    }

    // Редактируем старое сообщение
    await editMessage(chatId, messageId, t('language_selected', selectedLang))

    // Отправляем новое сообщение с инструкцией
    await sendMessage(chatId, message, keyboard, 'Markdown')
    await answerCallback(callbackId, t('callback_success', selectedLang))

    return
  }

  // Обработка отмены
  if (data.action === 'cancel') {
    await editMessage(chatId, messageId, t('cancelled', lang))
    await answerCallback(callbackId, t('callback_cancelled', lang))
    return
  }

  // Обработка подтверждения
  if (data.action === 'confirm' && data.phone) {
    const phone = data.phone
    const callbackUsername = data.username || null

    // Ищем пользователя по номеру
    const user = await prisma.user.findFirst({ where: { phone } })
    const sportsman = await prisma.sportsman.findFirst({ where: { phone } })
    const representative = await prisma.representative.findFirst({ where: { phone } })

    if (!user && !sportsman && !representative) {
      await editMessage(chatId, messageId, t('error', lang))
      await answerCallback(callbackId, t('callback_error', lang))
      return
    }

    const now = new Date()

    // Привязываем chat_id
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramChatId: chatId,
          telegramUsername: callbackUsername,
          telegramVerifiedAt: now,
        },
      })
    }

    if (sportsman) {
      await prisma.sportsman.update({
        where: { id: sportsman.id },
        data: {
          telegramChatId: chatId,
          telegramUsername: callbackUsername,
          telegramVerifiedAt: now,
        },
      })
    }

    if (representative) {
      await prisma.representative.update({
        where: { id: representative.id },
        data: {
          telegramChatId: chatId,
          telegramUsername: callbackUsername,
          telegramVerifiedAt: now,
        },
      })
    }

    // Отправляем подтверждение
    let message = t('success_title', lang) + '\n\n'
    message += t('success_notifications', lang)

    await editMessage(chatId, messageId, message)
    await answerCallback(callbackId, t('callback_success', lang))
  }
}
