import Link from 'next/link'
import Image from 'next/image'
import { getFederationContext } from '@/lib/federation'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, Users, Building2, Calendar, Medal, GraduationCap, Newspaper, ArrowRight } from 'lucide-react'
import { getTranslation } from '@/lib/utils/multilingual'
import type { Locale } from '@/types'

// Translations
const translations = {
  ru: {
    athletes: 'Спортсменов',
    coaches: 'Тренеров',
    clubs: 'Клубов',
    competitions: 'Соревнований',
    upcomingCompetitions: 'Предстоящие соревнования',
    allCompetitions: 'Все соревнования',
    latestNews: 'Последние новости',
    allNews: 'Все новости',
    viewDetails: 'Подробнее',
    login: 'Войти',
    findClub: 'Найти клуб',
    registerAthlete: 'Хотите зарегистрировать спортсмена?',
    registerDescription: 'Войдите в систему для регистрации на соревнования, просмотра результатов и управления профилем спортсмена.',
    readMore: 'Читать далее',
    slogan: 'Спорт. Дисциплина. Достижения.',
  },
  en: {
    athletes: 'Athletes',
    coaches: 'Coaches',
    clubs: 'Clubs',
    competitions: 'Competitions',
    upcomingCompetitions: 'Upcoming Competitions',
    allCompetitions: 'All Competitions',
    latestNews: 'Latest News',
    allNews: 'All News',
    viewDetails: 'View Details',
    login: 'Login',
    findClub: 'Find a Club',
    registerAthlete: 'Want to register an athlete?',
    registerDescription: 'Log in to register for competitions, view results, and manage your athlete profile.',
    readMore: 'Read more',
    slogan: 'Sport. Discipline. Achievements.',
  },
  ky: {
    athletes: 'Спортчулар',
    coaches: 'Машыктыруучулар',
    clubs: 'Клубдар',
    competitions: 'Мелдештер',
    upcomingCompetitions: 'Келүүчү мелдештер',
    allCompetitions: 'Бардык мелдештер',
    latestNews: 'Акыркы жаңылыктар',
    allNews: 'Бардык жаңылыктар',
    viewDetails: 'Толук маалымат',
    login: 'Кирүү',
    findClub: 'Клуб табуу',
    registerAthlete: 'Спортчуну каттагыңыз келеби?',
    registerDescription: 'Мелдештерге катталуу, натыйжаларды көрүү жана спортчунун профилин башкаруу үчүн системага кириңиз.',
    readMore: 'Кененирээк',
    slogan: 'Спорт. Тартип. Жетишкендиктер.',
  },
  kk: {
    athletes: 'Спортшылар',
    coaches: 'Жаттықтырушылар',
    clubs: 'Клубтар',
    competitions: 'Жарыстар',
    upcomingCompetitions: 'Алдағы жарыстар',
    allCompetitions: 'Барлық жарыстар',
    latestNews: 'Соңғы жаңалықтар',
    allNews: 'Барлық жаңалықтар',
    viewDetails: 'Толығырақ',
    login: 'Кіру',
    findClub: 'Клуб табу',
    registerAthlete: 'Спортшыны тіркегіңіз келе ме?',
    registerDescription: 'Жарыстарға тіркелу, нәтижелерді қарау және спортшы профилін басқару үшін жүйеге кіріңіз.',
    readMore: 'Толығырақ оқу',
    slogan: 'Спорт. Тәртіп. Жетістіктер.',
  },
}

export default async function HomePage() {
  const { federation, isGlobal, locale } = await getFederationContext()

  const t = translations[locale as keyof typeof translations] || translations.ru

  // Get stats and data
  const [sportsmenCount, trainersCount, clubsCount, competitionsCount, upcomingCompetitions, latestNews] = await Promise.all([
    prisma.sportsman.count({
      where: federation ? { federationId: federation.id } : {},
    }),
    prisma.trainer.count({
      where: federation ? { federationId: federation.id } : {},
    }),
    prisma.club.count({
      where: federation ? { federationId: federation.id } : {},
    }),
    prisma.competition.count({
      where: {
        ...(federation ? { federationId: federation.id } : {}),
        deletedAt: null,
      },
    }),
    prisma.competition.findMany({
      where: {
        ...(federation ? { federationId: federation.id } : {}),
        startDate: { gte: new Date() },
        status: { not: 'DRAFT' },
        deletedAt: null,
      },
      orderBy: { startDate: 'asc' },
      take: 3,
      include: {
        federation: { select: { code: true, name: true } },
      },
    }),
    prisma.news.findMany({
      where: {
        ...(federation ? { federationId: federation.id } : {}),
        published: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ])

  const title = federation
    ? getTranslation(federation.siteTitle as Record<string, string>, locale as Locale) || federation.name
    : 'Global Taekwondo Federation'

  const description = federation
    ? getTranslation(federation.description as Record<string, string>, locale as Locale)
    : t.slogan

  const heroBackground = federation?.heroBackground || 'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=1920&q=80'
  const federationLogo = federation?.logo || null
  const globalLogo = !federation ? '/logo.png' : null

  const stats = [
    { key: 'athletes', value: sportsmenCount, label: t.athletes, icon: Users },
    { key: 'coaches', value: trainersCount, label: t.coaches, icon: GraduationCap },
    { key: 'clubs', value: clubsCount, label: t.clubs, icon: Building2 },
    { key: 'competitions', value: competitionsCount, label: t.competitions, icon: Trophy },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Full Screen */}
      <section
        className="relative min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center text-white py-20">
          {/* Logos */}
          <div className="flex justify-center items-center gap-6 mb-8">
            {globalLogo && (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shadow-2xl bg-white/10 backdrop-blur">
                <Image
                  src={globalLogo}
                  alt="GTF"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {federationLogo && (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shadow-2xl">
                <Image
                  src={federationLogo}
                  alt={federation?.name || 'Federation'}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="text-lg md:text-xl opacity-90 mb-12 max-w-2xl mx-auto drop-shadow">
              {description}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.key} className="text-center">
                <stat.icon className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 opacity-90" />
                <div className="text-3xl md:text-5xl font-bold mb-1 drop-shadow-lg">
                  {stat.value.toLocaleString()}
                </div>
                <div className="text-sm md:text-base opacity-80">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-12">
            <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              <Link href="/competitions">
                <Trophy className="mr-2 h-5 w-5" />
                {t.allCompetitions}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link href="/ratings">
                <Medal className="mr-2 h-5 w-5" />
                {t.athletes}
              </Link>
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Upcoming Competitions */}
      {upcomingCompetitions.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">{t.upcomingCompetitions}</h2>
              <Button asChild variant="ghost">
                <Link href="/competitions" className="flex items-center gap-2">
                  {t.allCompetitions}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {upcomingCompetitions.map((competition, index) => (
                <Card
                  key={competition.id}
                  className={`overflow-hidden hover:shadow-lg transition-shadow ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                >
                  {competition.photo && (
                    <div className={`relative ${index === 0 ? 'h-64 md:h-80' : 'h-48'}`}>
                      <Image
                        src={competition.photo}
                        alt={getTranslation(competition.title as Record<string, string>, locale as Locale) || ''}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className="bg-blue-500">{competition.status}</Badge>
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className={`${index === 0 ? 'text-xl md:text-2xl' : 'text-lg'} line-clamp-2`}>
                      {getTranslation(competition.title as Record<string, string>, locale as Locale)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(competition.startDate).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href={`/competitions/${competition.id}`}>
                        {t.viewDetails}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest News */}
      {latestNews.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">{t.latestNews}</h2>
              <Button asChild variant="ghost">
                <Link href="/news" className="flex items-center gap-2">
                  {t.allNews}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestNews.map((news) => (
                <Card key={news.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {news.photo && (
                    <div className="relative h-48">
                      <Image
                        src={news.photo}
                        alt={getTranslation(news.title as Record<string, string>, locale as Locale) || ''}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardDescription>
                      {new Date(news.createdAt).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </CardDescription>
                    <CardTitle className="text-lg line-clamp-2">
                      {getTranslation(news.title as Record<string, string>, locale as Locale)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="link" className="p-0">
                      <Link href={`/news/${news.id}`}>
                        {t.readMore} <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t.registerAthlete}</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            {t.registerDescription}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/login">{t.login}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link href="/clubs">{t.findClub}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
