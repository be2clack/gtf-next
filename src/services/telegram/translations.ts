type TranslationKey =
  | 'select_language'
  | 'language_selected'
  | 'welcome_title'
  | 'welcome_description'
  | 'secure_verification'
  | 'text_not_allowed'
  | 'send_phone_button'
  | 'user_found'
  | 'is_this_you'
  | 'yes_button'
  | 'no_button'
  | 'user_not_found'
  | 'text_blocked'
  | 'success_title'
  | 'success_notifications'
  | 'cancelled'
  | 'error'
  | 'callback_success'
  | 'callback_cancelled'
  | 'callback_error'

type Language = 'ru' | 'kg' | 'en'

const translations: Record<TranslationKey, Record<Language, string>> = {
  // Выбор языка
  select_language: {
    ru: '🌍 Выберите язык / Тилди тандаңыз / Select language:',
    kg: '🌍 Тилди тандаңыз:',
    en: '🌍 Select language:',
  },
  language_selected: {
    ru: '✅ Язык изменен на Русский',
    kg: '✅ Тил кыргызчага өзгөртүлдү',
    en: '✅ Language changed to English',
  },

  // Приветствие
  welcome_title: {
    ru: '👋 *Добро пожаловать в GTF Global!*',
    kg: "👋 *GTF Global'га кош келиңиз!*",
    en: '👋 *Welcome to GTF Global!*',
  },
  welcome_description: {
    ru: '🔐 Для получения PIN-кодов и уведомлений, привяжите ваш аккаунт к Telegram.',
    kg: '🔐 PIN-коддорду жана билдирүүлөрдү алуу үчүн, эсебиңизди Telegram менен байланыштырыңыз.',
    en: '🔐 To receive PIN codes and notifications, link your account to Telegram.',
  },
  secure_verification: {
    ru: '🔒 *Безопасная верификация:*\nНажмите кнопку ниже, чтобы отправить свой номер телефона через Telegram.',
    kg: '🔒 *Коопсуздук текшерүү:*\nТелеграм аркылуу телефон номериңизди жөнөтүү үчүн төмөнкү баскычты басыңыз.',
    en: '🔒 *Secure verification:*\nPress the button below to send your phone number via Telegram.',
  },
  text_not_allowed: {
    ru: '⚠️ _Отправка номера текстом не разрешена для вашей безопасности._',
    kg: '⚠️ _Коопсуздугуңуз үчүн текст менен номер жөнөтүүгө уруксат жок._',
    en: '⚠️ _Sending numbers via text is not allowed for your security._',
  },
  send_phone_button: {
    ru: '📱 Отправить номер телефона',
    kg: '📱 Телефон номерин жөнөтүү',
    en: '📱 Send phone number',
  },

  // Верификация
  user_found: {
    ru: '✅ Найден пользователь:',
    kg: '✅ Колдонуучу табылды:',
    en: '✅ User found:',
  },
  is_this_you: {
    ru: 'Это вы?',
    kg: 'Бул сизби?',
    en: 'Is this you?',
  },
  yes_button: {
    ru: '✅ Да, это я',
    kg: '✅ Ооба, бул мен',
    en: "✅ Yes, it's me",
  },
  no_button: {
    ru: '❌ Нет, это не я',
    kg: '❌ Жок, бул мен эмес',
    en: "❌ No, it's not me",
  },
  user_not_found: {
    ru: '❌ Пользователь с номером %s не найден в системе.\n\nПожалуйста, убедитесь, что вы зарегистрированы в GTF.\n\nИспользуйте /start для повторной попытки.',
    kg: '❌ %s номери менен колдонуучу системада табылган жок.\n\nGTFке катталганыңызды текшериңиз.\n\nКайра аракет кылуу үчүн /start колдонуңуз.',
    en: '❌ User with number %s not found in the system.\n\nPlease make sure you are registered with GTF.\n\nUse /start to try again.',
  },
  text_blocked: {
    ru: '❌ Отправка номера текстом не разрешена.\n\nИспользуйте /start и нажмите кнопку *"📱 Отправить номер телефона"* для безопасной верификации.',
    kg: '❌ Текст менен номер жөнөтүүгө тыюу салынган.\n\n/start колдонуңуз жана *"📱 Телефон номерин жөнөтүү"* баскычын басыңыз.',
    en: '❌ Sending numbers via text is not allowed.\n\nUse /start and press the *"📱 Send phone number"* button for secure verification.',
  },

  // Успех
  success_title: {
    ru: '🎉 Отлично! Ваш аккаунт успешно привязан к Telegram!',
    kg: '🎉 Эң сонун! Эсебиңиз ийгиликтүү Telegramга байланыштырылды!',
    en: '🎉 Great! Your account has been successfully linked to Telegram!',
  },
  success_notifications: {
    ru: 'Теперь вы будете получать:\n✅ PIN-коды для входа в систему\n✅ Уведомления о соревнованиях\n✅ Информацию об аттестациях\n✅ Напоминания о взвешивании\n✅ Расписание выхода на татами\n\nДобро пожаловать в GTF Global! 🥋',
    kg: 'Эми сиз аласыз:\n✅ Системага кирүү үчүн PIN-коддор\n✅ Мелдештер жөнүндө билдирүүлөр\n✅ Аттестация жөнүндө маалымат\n✅ Таразалоо жөнүндө эскертүүлөр\n✅ Татами чыгуу графиги\n\nGTF Globalга кош келиңиз! 🥋',
    en: 'Now you will receive:\n✅ PIN codes for system access\n✅ Competition notifications\n✅ Attestation information\n✅ Weigh-in reminders\n✅ Tatami schedule\n\nWelcome to GTF Global! 🥋',
  },
  cancelled: {
    ru: '❌ Отменено.\n\nИспользуйте /start для повторной попытки.',
    kg: '❌ Жокко чыгарылды.\n\nКайра аракет кылуу үчүн /start колдонуңуз.',
    en: '❌ Cancelled.\n\nUse /start to try again.',
  },
  error: {
    ru: '❌ Ошибка: пользователь не найден.\n\nИспользуйте /start для повторной попытки.',
    kg: '❌ Ката: колдонуучу табылган жок.\n\nКайра аракет кылуу үчүн /start колдонуңуз.',
    en: '❌ Error: user not found.\n\nUse /start to try again.',
  },

  // Callback ответы
  callback_success: {
    ru: '✅ Успешно привязано!',
    kg: '✅ Ийгиликтүү байланыштырылды!',
    en: '✅ Successfully linked!',
  },
  callback_cancelled: {
    ru: 'Отменено',
    kg: 'Жокко чыгарылды',
    en: 'Cancelled',
  },
  callback_error: {
    ru: 'Ошибка',
    kg: 'Ката',
    en: 'Error',
  },
}

export function t(key: TranslationKey, lang: string = 'ru'): string {
  const validLang = (lang === 'ru' || lang === 'kg' || lang === 'en' ? lang : 'ru') as Language
  return translations[key]?.[validLang] ?? translations[key]?.ru ?? key
}

export function tFormat(key: TranslationKey, lang: string, ...args: string[]): string {
  let text = t(key, lang)
  args.forEach((arg, index) => {
    text = text.replace('%s', arg)
  })
  return text
}
