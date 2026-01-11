import type { Locale } from '@/types'

export const translations: Record<Locale, Record<string, string>> = {
  ru: {
    // Navigation
    'nav.home': 'Главная',
    'nav.competitions': 'Соревнования',
    'nav.ratings': 'Рейтинг',
    'nav.clubs': 'Клубы',
    'nav.news': 'Новости',
    'nav.about': 'О нас',
    'nav.contacts': 'Контакты',
    'nav.login': 'Войти',
    'nav.logout': 'Выйти',
    'nav.cabinet': 'Личный кабинет',
    'nav.admin': 'Админ-панель',

    // Hero
    'hero.title': 'Global Taekwondo Federation',
    'hero.subtitle': 'Спорт. Дисциплина. Достижения.',
    'hero.findClub': 'Найти клуб',

    // Stats
    'stats.athletes': 'Спортсменов',
    'stats.coaches': 'Тренеров',
    'stats.clubs': 'Клубов',
    'stats.competitions': 'Соревнований',

    // Common
    'common.search': 'Поиск',
    'common.filter': 'Фильтр',
    'common.loading': 'Загрузка...',
    'common.noData': 'Нет данных',
    'common.noResults': 'Ничего не найдено',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.create': 'Создать',
    'common.back': 'Назад',
    'common.next': 'Далее',
    'common.all': 'Все',
    'common.more': 'Подробнее',
    'common.viewAll': 'Смотреть все',

    // Sections
    'section.upcomingEvents': 'Ближайшие соревнования',
    'section.latestNews': 'Последние новости',
    'section.topAthletes': 'Лучшие спортсмены',
    'section.federation': 'Федерация',
    'section.allRights': 'Все права защищены',

    // Sport
    'sport.belt': 'Пояс',
    'sport.gyp': 'Гып',
    'sport.dan': 'Дан',
    'sport.weight': 'Вес',
    'sport.weightCategory': 'Весовая категория',
    'sport.ageCategory': 'Возрастная категория',
    'sport.age': 'Возраст',
    'sport.years': 'лет',
    'sport.kg': 'кг',
    'sport.discipline': 'Дисциплина',
    'sport.category': 'Категория',
    'sport.rating': 'Рейтинг',
    'sport.points': 'Очки',
    'sport.place': 'Место',
    'sport.gold': 'Золото',
    'sport.silver': 'Серебро',
    'sport.bronze': 'Бронза',
    'sport.club': 'Клуб',
    'sport.trainer': 'Тренер',

    // Forms
    'form.firstName': 'Имя',
    'form.lastName': 'Фамилия',
    'form.middleName': 'Отчество',
    'form.fullName': 'ФИО',
    'form.email': 'Email',
    'form.phone': 'Телефон',
    'form.dateOfBirth': 'Дата рождения',
    'form.gender': 'Пол',
    'form.male': 'Мужской',
    'form.female': 'Женский',
    'form.photo': 'Фото',
    'form.description': 'Описание',
    'form.address': 'Адрес',
    'form.city': 'Город',
    'form.region': 'Регион',
    'form.country': 'Страна',

    // Footer
    'footer.about': 'О федерации',
    'footer.aboutText': 'официальная федерация тхэквондо.',
    'footer.navigation': 'Навигация',
    'footer.contacts': 'Контакты',
    'footer.social': 'Социальные сети',

    // Competition
    'competition.register': 'Зарегистрироваться',
    'competition.participants': 'Участники',
    'competition.schedule': 'Расписание',
    'competition.results': 'Результаты',
    'competition.brackets': 'Сетка',
    'competition.date': 'Дата проведения',
    'competition.location': 'Место проведения',
    'competition.deadline': 'Регистрация до',
    'competition.status.upcoming': 'Предстоящее',
    'competition.status.ongoing': 'Идёт',
    'competition.status.completed': 'Завершено',
  },

  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.competitions': 'Competitions',
    'nav.ratings': 'Rankings',
    'nav.clubs': 'Clubs',
    'nav.news': 'News',
    'nav.about': 'About',
    'nav.contacts': 'Contacts',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.cabinet': 'My Cabinet',
    'nav.admin': 'Admin Panel',

    // Hero
    'hero.title': 'Global Taekwondo Federation',
    'hero.subtitle': 'Sport. Discipline. Achievement.',
    'hero.findClub': 'Find a Club',

    // Stats
    'stats.athletes': 'Athletes',
    'stats.coaches': 'Coaches',
    'stats.clubs': 'Clubs',
    'stats.competitions': 'Competitions',

    // Common
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.loading': 'Loading...',
    'common.noData': 'No data',
    'common.noResults': 'No results found',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.all': 'All',
    'common.more': 'More',
    'common.viewAll': 'View All',

    // Sections
    'section.upcomingEvents': 'Upcoming Events',
    'section.latestNews': 'Latest News',
    'section.topAthletes': 'Top Athletes',
    'section.federation': 'Federation',
    'section.allRights': 'All rights reserved',

    // Sport
    'sport.belt': 'Belt',
    'sport.gyp': 'Gup',
    'sport.dan': 'Dan',
    'sport.weight': 'Weight',
    'sport.weightCategory': 'Weight Category',
    'sport.ageCategory': 'Age Category',
    'sport.age': 'Age',
    'sport.years': 'years',
    'sport.kg': 'kg',
    'sport.discipline': 'Discipline',
    'sport.category': 'Category',
    'sport.rating': 'Rating',
    'sport.points': 'Points',
    'sport.place': 'Place',
    'sport.gold': 'Gold',
    'sport.silver': 'Silver',
    'sport.bronze': 'Bronze',
    'sport.club': 'Club',
    'sport.trainer': 'Coach',

    // Forms
    'form.firstName': 'First Name',
    'form.lastName': 'Last Name',
    'form.middleName': 'Middle Name',
    'form.fullName': 'Full Name',
    'form.email': 'Email',
    'form.phone': 'Phone',
    'form.dateOfBirth': 'Date of Birth',
    'form.gender': 'Gender',
    'form.male': 'Male',
    'form.female': 'Female',
    'form.photo': 'Photo',
    'form.description': 'Description',
    'form.address': 'Address',
    'form.city': 'City',
    'form.region': 'Region',
    'form.country': 'Country',

    // Footer
    'footer.about': 'About Federation',
    'footer.aboutText': 'official taekwondo federation.',
    'footer.navigation': 'Navigation',
    'footer.contacts': 'Contacts',
    'footer.social': 'Social Media',

    // Competition
    'competition.register': 'Register',
    'competition.participants': 'Participants',
    'competition.schedule': 'Schedule',
    'competition.results': 'Results',
    'competition.brackets': 'Brackets',
    'competition.date': 'Event Date',
    'competition.location': 'Location',
    'competition.deadline': 'Registration Deadline',
    'competition.status.upcoming': 'Upcoming',
    'competition.status.ongoing': 'Ongoing',
    'competition.status.completed': 'Completed',
  },

  kg: {
    // Navigation
    'nav.home': 'Башкы бет',
    'nav.competitions': 'Мелдештер',
    'nav.ratings': 'Рейтинг',
    'nav.clubs': 'Клубдар',
    'nav.news': 'Жаңылыктар',
    'nav.about': 'Биз жөнүндө',
    'nav.contacts': 'Байланыш',
    'nav.login': 'Кирүү',
    'nav.logout': 'Чыгуу',
    'nav.cabinet': 'Жеке кабинет',
    'nav.admin': 'Админ панели',

    // Hero
    'hero.title': 'Global Taekwondo Federation',
    'hero.subtitle': 'Спорт. Тартип. Жетишкендиктер.',
    'hero.findClub': 'Клуб табуу',

    // Stats
    'stats.athletes': 'Спортчулар',
    'stats.coaches': 'Машыктыруучулар',
    'stats.clubs': 'Клубдар',
    'stats.competitions': 'Мелдештер',

    // Common
    'common.search': 'Издөө',
    'common.filter': 'Чыпкалоо',
    'common.loading': 'Жүктөлүүдө...',
    'common.noData': 'Маалымат жок',
    'common.noResults': 'Эч нерсе табылган жок',
    'common.save': 'Сактоо',
    'common.cancel': 'Жокко чыгаруу',
    'common.delete': 'Өчүрүү',
    'common.edit': 'Өзгөртүү',
    'common.create': 'Түзүү',
    'common.back': 'Артка',
    'common.next': 'Кийинки',
    'common.all': 'Баары',
    'common.more': 'Толук маалымат',
    'common.viewAll': 'Баарын көрүү',

    // Sections
    'section.upcomingEvents': 'Жакынкы мелдештер',
    'section.latestNews': 'Акыркы жаңылыктар',
    'section.topAthletes': 'Мыкты спортчулар',
    'section.federation': 'Федерация',
    'section.allRights': 'Бардык укуктар корголгон',

    // Footer
    'footer.about': 'Федерация жөнүндө',
    'footer.aboutText': 'расмий таэквондо федерациясы.',
    'footer.navigation': 'Навигация',
    'footer.contacts': 'Байланыш',
    'footer.social': 'Социалдык тармактар',

    // Sport terms (keep some in Russian as they're commonly used)
    'sport.belt': 'Кур',
    'sport.weight': 'Салмак',
    'sport.age': 'Жаш',
    'sport.years': 'жаш',
    'sport.kg': 'кг',
    'sport.club': 'Клуб',
    'sport.trainer': 'Машыктыруучу',
    'sport.gold': 'Алтын',
    'sport.silver': 'Күмүш',
    'sport.bronze': 'Коло',
  },

  kz: {
    // Navigation
    'nav.home': 'Басты бет',
    'nav.competitions': 'Жарыстар',
    'nav.ratings': 'Рейтинг',
    'nav.clubs': 'Клубтар',
    'nav.news': 'Жаңалықтар',
    'nav.about': 'Біз туралы',
    'nav.contacts': 'Байланыс',
    'nav.login': 'Кіру',
    'nav.logout': 'Шығу',
    'nav.cabinet': 'Жеке кабинет',
    'nav.admin': 'Админ панелі',

    // Hero
    'hero.title': 'Global Taekwondo Federation',
    'hero.subtitle': 'Спорт. Тәртіп. Жетістіктер.',
    'hero.findClub': 'Клуб табу',

    // Stats
    'stats.athletes': 'Спортшылар',
    'stats.coaches': 'Жаттықтырушылар',
    'stats.clubs': 'Клубтар',
    'stats.competitions': 'Жарыстар',

    // Common
    'common.search': 'Іздеу',
    'common.filter': 'Сүзгі',
    'common.loading': 'Жүктелуде...',
    'common.noData': 'Деректер жоқ',
    'common.noResults': 'Ештеңе табылмады',
    'common.save': 'Сақтау',
    'common.cancel': 'Болдырмау',
    'common.delete': 'Жою',
    'common.edit': 'Өзгерту',
    'common.create': 'Жасау',
    'common.back': 'Артқа',
    'common.next': 'Келесі',
    'common.all': 'Барлығы',
    'common.more': 'Толығырақ',
    'common.viewAll': 'Барлығын көру',

    // Sections
    'section.upcomingEvents': 'Жақындағы жарыстар',
    'section.latestNews': 'Соңғы жаңалықтар',
    'section.topAthletes': 'Үздік спортшылар',
    'section.federation': 'Федерация',
    'section.allRights': 'Барлық құқықтар қорғалған',

    // Footer
    'footer.about': 'Федерация туралы',
    'footer.aboutText': 'ресми таэквондо федерациясы.',
    'footer.navigation': 'Навигация',
    'footer.contacts': 'Байланыс',
    'footer.social': 'Әлеуметтік желілер',

    // Sport
    'sport.belt': 'Белдік',
    'sport.weight': 'Салмақ',
    'sport.age': 'Жас',
    'sport.years': 'жас',
    'sport.kg': 'кг',
    'sport.club': 'Клуб',
    'sport.trainer': 'Жаттықтырушы',
    'sport.gold': 'Алтын',
    'sport.silver': 'Күміс',
    'sport.bronze': 'Қола',
  },

  uz: {
    // Navigation
    'nav.home': 'Bosh sahifa',
    'nav.competitions': 'Musobaqalar',
    'nav.ratings': 'Reyting',
    'nav.clubs': 'Klublar',
    'nav.news': 'Yangiliklar',
    'nav.about': 'Biz haqimizda',
    'nav.contacts': 'Aloqa',
    'nav.login': 'Kirish',
    'nav.logout': 'Chiqish',
    'nav.cabinet': 'Shaxsiy kabinet',
    'nav.admin': 'Admin panel',

    // Hero
    'hero.title': 'Global Taekwondo Federation',
    'hero.subtitle': 'Sport. Intizom. Yutuqlar.',
    'hero.findClub': 'Klub topish',

    // Stats
    'stats.athletes': 'Sportchilar',
    'stats.coaches': 'Murabbiylar',
    'stats.clubs': 'Klublar',
    'stats.competitions': 'Musobaqalar',

    // Common
    'common.search': 'Qidirish',
    'common.filter': 'Filtr',
    'common.loading': 'Yuklanmoqda...',
    'common.noData': 'Ma\'lumot yo\'q',
    'common.noResults': 'Hech narsa topilmadi',
    'common.save': 'Saqlash',
    'common.cancel': 'Bekor qilish',
    'common.delete': 'O\'chirish',
    'common.edit': 'Tahrirlash',
    'common.create': 'Yaratish',
    'common.back': 'Orqaga',
    'common.next': 'Keyingi',
    'common.all': 'Hammasi',
    'common.more': 'Batafsil',
    'common.viewAll': 'Hammasini ko\'rish',

    // Sections
    'section.upcomingEvents': 'Yaqinlashayotgan musobaqalar',
    'section.latestNews': 'So\'nggi yangiliklar',
    'section.topAthletes': 'Eng yaxshi sportchilar',
    'section.federation': 'Federatsiya',
    'section.allRights': 'Barcha huquqlar himoyalangan',

    // Footer
    'footer.about': 'Federatsiya haqida',
    'footer.aboutText': 'rasmiy taekvondo federatsiyasi.',
    'footer.navigation': 'Navigatsiya',
    'footer.contacts': 'Aloqa',
    'footer.social': 'Ijtimoiy tarmoqlar',
  },

  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.competitions': 'المسابقات',
    'nav.ratings': 'التصنيف',
    'nav.clubs': 'الأندية',
    'nav.news': 'الأخبار',
    'nav.about': 'عنا',
    'nav.contacts': 'اتصل بنا',
    'nav.login': 'تسجيل الدخول',
    'nav.logout': 'تسجيل الخروج',
    'nav.cabinet': 'حسابي',
    'nav.admin': 'لوحة التحكم',

    // Hero
    'hero.title': 'الاتحاد العالمي للتايكواندو',
    'hero.subtitle': 'الرياضة. الانضباط. الإنجاز.',
    'hero.findClub': 'ابحث عن نادي',

    // Stats
    'stats.athletes': 'رياضيون',
    'stats.coaches': 'مدربون',
    'stats.clubs': 'أندية',
    'stats.competitions': 'مسابقات',

    // Common
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.loading': 'جاري التحميل...',
    'common.noData': 'لا توجد بيانات',
    'common.noResults': 'لم يتم العثور على نتائج',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.create': 'إنشاء',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.all': 'الكل',
    'common.more': 'المزيد',
    'common.viewAll': 'عرض الكل',

    // Footer
    'footer.about': 'عن الاتحاد',
    'footer.aboutText': 'الاتحاد الرسمي للتايكواندو.',
    'footer.navigation': 'التنقل',
    'footer.contacts': 'اتصل بنا',
    'footer.social': 'وسائل التواصل الاجتماعي',
    'section.allRights': 'جميع الحقوق محفوظة',
  },
}

export function t(key: string, locale: Locale = 'ru'): string {
  return translations[locale]?.[key] || translations.ru[key] || key
}

export const SUPPORTED_LOCALES = [
  { code: 'ru' as Locale, name: 'Русский', flag: '🇷🇺' },
  { code: 'en' as Locale, name: 'English', flag: '🇬🇧' },
  { code: 'kg' as Locale, name: 'Кыргызча', flag: '🇰🇬' },
  { code: 'kz' as Locale, name: 'Қазақша', flag: '🇰🇿' },
  { code: 'uz' as Locale, name: 'O\'zbek', flag: '🇺🇿' },
  { code: 'ar' as Locale, name: 'العربية', flag: '🇦🇪' },
] as const
