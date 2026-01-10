import { prisma } from '@/lib/prisma';
import { Sportsman, Club, Trainer, Competition, Region, City } from '@prisma/client';

type SportsmanWithRelations = Sportsman & {
  club: Club | null;
  trainer: Trainer | null;
  region: Region | null;
};

type ClubWithRelations = Club & {
  region: Region | null;
  city: City | null;
  _count: { sportsmen: number };
};

type TrainerWithRelations = Trainer & {
  club: Club | null;
  region: Region | null;
};

type CompetitionWithRelations = Competition & {
  region: Region | null;
  _count: { registrations: number };
};

interface ExportOptions {
  federationId?: number;
}

class ExportService {
  /**
   * Generate CSV content with UTF-8 BOM for Excel compatibility
   */
  private generateCSV(headers: string[], data: unknown[][]): string {
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel
    
    const escapeField = (field: unknown): string => {
      const str = String(field ?? '');
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const headerLine = headers.map(escapeField).join(',');
    const dataLines = data.map(row => row.map(escapeField).join(','));
    
    return BOM + [headerLine, ...dataLines].join('\n');
  }

  /**
   * Get filename with current date
   */
  private getFilename(base: string): string {
    const date = new Date().toISOString().split('T')[0];
    return `${base}_${date}.csv`;
  }

  /**
   * Create Response with CSV headers
   */
  private createCSVResponse(content: string, filename: string): Response {
    return new Response(content, {
      headers: {
        'Content-Type': 'text/csv; charset=UTF-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date | null): number | string {
    if (!dateOfBirth) return '';
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date | null, includeTime = false): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    if (includeTime) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    }
    return `${day}.${month}.${year}`;
  }

  /**
   * Export sportsmen to CSV
   */
  async exportSportsmen(options: ExportOptions = {}): Promise<Response> {
    const where = options.federationId ? { federationId: options.federationId } : {};
    
    const sportsmen = await prisma.sportsman.findMany({
      where,
      include: {
        club: true,
        trainer: true,
        region: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as SportsmanWithRelations[];

    const headers = [
      'ID',
      'ФИО',
      'Пол',
      'Дата рождения',
      'Возраст',
      'ИИН',
      'Клуб',
      'Тренер',
      'Регион',
      'Гып',
      'Дан',
      'Вес (кг)',
      'Рост (см)',
      'Instagram',
      'Дата регистрации',
    ];

    const data = sportsmen.map(s => [
      s.id,
      s.fio || '',
      s.sex === 1 ? 'Мужской' : 'Женский',
      this.formatDate(s.dateOfBirth),
      this.calculateAge(s.dateOfBirth),
      s.iin || '',
      s.club?.title || '',
      s.trainer?.fio || '',
      s.region?.title || '',
      s.gyp ?? '',
      s.dan ?? '',
      s.weight ?? '',
      s.height ?? '',
      s.instagram || '',
      this.formatDate(s.createdAt, true),
    ]);

    const content = this.generateCSV(headers, data);
    return this.createCSVResponse(content, this.getFilename('sportsmen'));
  }

  /**
   * Export clubs to CSV
   */
  async exportClubs(options: ExportOptions = {}): Promise<Response> {
    const where = options.federationId ? { federationId: options.federationId } : {};
    
    const clubs = await prisma.club.findMany({
      where,
      include: {
        region: true,
        city: true,
        _count: { select: { sportsmen: true } },
      },
      orderBy: { createdAt: 'desc' },
    }) as ClubWithRelations[];

    const headers = [
      'ID',
      'Название',
      'Город',
      'Регион',
      'Адрес',
      'Рейтинг',
      'Количество спортсменов',
      'Instagram',
      'Дата создания',
    ];

    const data = clubs.map(c => [
      c.id,
      c.title || '',
      c.city?.nameRu || c.city?.nameEn || '',
      c.region?.title || '',
      c.address || '',
      c.rating ?? 0,
      c._count.sportsmen,
      c.instagram || '',
      this.formatDate(c.createdAt, true),
    ]);

    const content = this.generateCSV(headers, data);
    return this.createCSVResponse(content, this.getFilename('clubs'));
  }

  /**
   * Export trainers to CSV
   */
  async exportTrainers(options: ExportOptions = {}): Promise<Response> {
    const where = options.federationId ? { federationId: options.federationId } : {};
    
    const trainers = await prisma.trainer.findMany({
      where,
      include: {
        club: true,
        region: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as TrainerWithRelations[];

    const headers = [
      'ID',
      'ФИО',
      'Клуб',
      'Регион',
      'Ранг',
      'Телефон',
      'Instagram',
      'Дата создания',
    ];

    const data = trainers.map(t => [
      t.id,
      t.fio || '',
      t.club?.title || '',
      t.region?.title || '',
      t.rank || '',
      t.phone || '',
      t.instagram || '',
      this.formatDate(t.createdAt, true),
    ]);

    const content = this.generateCSV(headers, data);
    return this.createCSVResponse(content, this.getFilename('trainers'));
  }

  /**
   * Export competitions to CSV
   */
  async exportCompetitions(options: ExportOptions = {}): Promise<Response> {
    const where = options.federationId ? { federationId: options.federationId } : {};
    
    const competitions = await prisma.competition.findMany({
      where,
      include: {
        region: true,
        _count: { select: { registrations: true } },
      },
      orderBy: { startDate: 'desc' },
    }) as CompetitionWithRelations[];

    const headers = [
      'ID',
      'Название',
      'Дата начала',
      'Дата окончания',
      'Место проведения',
      'Регион',
      'Количество участников',
      'Статус',
    ];

    const now = new Date();
    const data = competitions.map(c => {
      let status = 'Завершено';
      if (c.startDate && c.startDate > now) {
        status = 'Предстоящее';
      } else if (c.startDate && c.endDate && c.startDate <= now && c.endDate >= now) {
        status = 'Идет';
      }

      return [
        c.id,
        c.title || '',
        this.formatDate(c.startDate),
        this.formatDate(c.endDate),
        c.venue || '',
        c.region?.title || '',
        c._count.registrations,
        status,
      ];
    });

    const content = this.generateCSV(headers, data);
    return this.createCSVResponse(content, this.getFilename('competitions'));
  }

  /**
   * Export statistics to CSV
   */
  async exportStatistics(options: ExportOptions = {}): Promise<Response> {
    const where = options.federationId ? { federationId: options.federationId } : {};
    
    const [
      totalSportsmen,
      maleSportsmen,
      femaleSportsmen,
      totalClubs,
      totalTrainers,
      totalCompetitions,
      upcomingCompetitions,
    ] = await Promise.all([
      prisma.sportsman.count({ where }),
      prisma.sportsman.count({ where: { ...where, sex: 1 } }),
      prisma.sportsman.count({ where: { ...where, sex: 2 } }),
      prisma.club.count({ where }),
      prisma.trainer.count({ where }),
      prisma.competition.count({ where }),
      prisma.competition.count({ 
        where: { 
          ...where, 
          startDate: { gte: new Date() } 
        } 
      }),
    ]);

    const headers = ['Показатель', 'Значение'];
    const data = [
      ['Всего спортсменов', totalSportsmen],
      ['Спортсменов (мужчины)', maleSportsmen],
      ['Спортсменов (женщины)', femaleSportsmen],
      ['Всего клубов', totalClubs],
      ['Всего тренеров', totalTrainers],
      ['Всего соревнований', totalCompetitions],
      ['Предстоящих соревнований', upcomingCompetitions],
    ];

    const content = this.generateCSV(headers, data);
    return this.createCSVResponse(content, this.getFilename('statistics'));
  }

  /**
   * Export competition registrations to CSV
   */
  async exportCompetitionRegistrations(competitionId: number): Promise<Response> {
    const registrations = await prisma.competitionRegistration.findMany({
      where: { competitionId },
      include: {
        sportsman: {
          include: {
            club: true,
            trainer: true,
          },
        },
        competitionCategory: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'ID',
      'Спортсмен',
      'Клуб',
      'Тренер',
      'Категория',
      'Вес (заявленный)',
      'Вес (подтверждённый)',
      'Статус',
      'Дата регистрации',
    ];

    const data = registrations.map(r => [
      r.id,
      r.sportsman?.fio || '',
      r.sportsman?.club?.title || '',
      r.sportsman?.trainer?.fio || '',
      r.competitionCategory?.name || '',
      r.currentWeight ?? '',
      r.confirmedWeight ?? '',
      r.status || '',
      this.formatDate(r.createdAt, true),
    ]);

    const content = this.generateCSV(headers, data);
    return this.createCSVResponse(content, this.getFilename(`competition_${competitionId}_registrations`));
  }

}

export const exportService = new ExportService();