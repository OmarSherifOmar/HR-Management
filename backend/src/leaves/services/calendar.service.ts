import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Calendar, CalendarDocument, HolidayPeriod, BlockedPeriod } from '../models/calendar.schema';

/**
 * CalendarService - US9: Set Calendars and Blocked Days
 * 
 * Uses the Calendar model with embedded holidays and blockedPeriods arrays.
 */
@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(Calendar.name) private calendarModel: Model<CalendarDocument>,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // CALENDAR (YEAR) MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  async createCalendar(year: number): Promise<CalendarDocument> {
    const existing = await this.calendarModel.findOne({ year }).exec();
    if (existing) throw new BadRequestException(`Calendar for year ${year} already exists`);

    const calendar = new this.calendarModel({ year, holidays: [], blockedPeriods: [] });
    return calendar.save();
  }

  async getCalendarByYear(year: number): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);
    return calendar;
  }

  async getAllCalendars(): Promise<CalendarDocument[]> {
    return this.calendarModel.find().sort({ year: -1 }).exec();
  }

  async deleteCalendar(year: number): Promise<{ deleted: boolean }> {
    const result = await this.calendarModel.findOneAndDelete({ year }).exec();
    if (!result) throw new NotFoundException(`Calendar for year ${year} not found`);
    return { deleted: true };
  }

  // ─────────────────────────────────────────────────────────────
  // HOLIDAY MANAGEMENT (embedded in Calendar.holidays)
  // ─────────────────────────────────────────────────────────────

  async addHoliday(
    year: number,
    holiday: { from: Date; to: Date; reason: string },
  ): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    if (new Date(holiday.from) > new Date(holiday.to)) {
      throw new BadRequestException('from date must be before or equal to to date');
    }

    calendar.holidays.push(holiday);
    await calendar.save();
    return calendar;
  }

  async getHolidays(year: number): Promise<{ from: Date; to: Date; reason: string }[]> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);
    return calendar.holidays;
  }

  async updateHoliday(
    year: number,
    index: number,
    holiday: { from: Date; to: Date; reason: string },
  ): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    if (index < 0 || index >= calendar.holidays.length) {
      throw new BadRequestException('Invalid holiday index');
    }

    if (new Date(holiday.from) > new Date(holiday.to)) {
      throw new BadRequestException('from date must be before or equal to to date');
    }

    calendar.holidays[index] = holiday;
    await calendar.save();
    return calendar;
  }

  async removeHoliday(year: number, index: number): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    if (index < 0 || index >= calendar.holidays.length) {
      throw new BadRequestException('Invalid holiday index');
    }

    calendar.holidays.splice(index, 1);
    await calendar.save();
    return calendar;
  }

  async bulkAddHolidays(
    year: number,
    holidays: { from: Date; to: Date; reason: string }[],
  ): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    for (const h of holidays) {
      if (new Date(h.from) > new Date(h.to)) {
        throw new BadRequestException(`Invalid holiday: from date must be before or equal to to date for "${h.reason}"`);
      }
      calendar.holidays.push(h);
    }

    await calendar.save();
    return calendar;
  }

  // ─────────────────────────────────────────────────────────────
  // BLOCKED PERIODS (COMPANY CLOSURES)
  // ─────────────────────────────────────────────────────────────

  async addBlockedPeriod(
    year: number,
    period: { from: Date; to: Date; reason: string },
  ): Promise<CalendarDocument> {
    if (new Date(period.from) > new Date(period.to)) {
      throw new BadRequestException('from date must be before or equal to to date');
    }

    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    calendar.blockedPeriods.push(period);
    await calendar.save();
    return calendar;
  }

  async getBlockedPeriods(year: number): Promise<{ from: Date; to: Date; reason: string }[]> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);
    return calendar.blockedPeriods;
  }

  async updateBlockedPeriod(
    year: number,
    index: number,
    period: { from: Date; to: Date; reason: string },
  ): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    if (index < 0 || index >= calendar.blockedPeriods.length) {
      throw new BadRequestException('Invalid blocked period index');
    }

    if (new Date(period.from) > new Date(period.to)) {
      throw new BadRequestException('from date must be before or equal to to date');
    }

    calendar.blockedPeriods[index] = period;
    await calendar.save();
    return calendar;
  }

  async removeBlockedPeriod(year: number, index: number): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    if (index < 0 || index >= calendar.blockedPeriods.length) {
      throw new BadRequestException('Invalid blocked period index');
    }

    calendar.blockedPeriods.splice(index, 1);
    await calendar.save();
    return calendar;
  }

  // ─────────────────────────────────────────────────────────────
  // UTILITY: Check if a date is blocked (holiday or closure)
  // ─────────────────────────────────────────────────────────────

  async isDateBlocked(date: Date): Promise<{ blocked: boolean; reason?: string; type?: string }> {
    const year = date.getFullYear();
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) return { blocked: false };

    const checkDate = new Date(date);

    // Check holidays
    for (const h of calendar.holidays) {
      const from = new Date(h.from);
      const to = new Date(h.to);
      if (checkDate >= from && checkDate <= to) {
        return { blocked: true, reason: h.reason, type: 'holiday' };
      }
    }

    // Check blocked periods
    for (const bp of calendar.blockedPeriods) {
      const from = new Date(bp.from);
      const to = new Date(bp.to);
      if (checkDate >= from && checkDate <= to) {
        return { blocked: true, reason: bp.reason, type: 'blocked_period' };
      }
    }

    return { blocked: false };
  }

  async getBlockedDatesInRange(
    from: Date,
    to: Date,
  ): Promise<{ date: Date; reason: string; type: string }[]> {
    const blockedDates: { date: Date; reason: string; type: string }[] = [];
    const current = new Date(from);

    while (current <= to) {
      const result = await this.isDateBlocked(new Date(current));
      if (result.blocked) {
        blockedDates.push({
          date: new Date(current),
          reason: result.reason!,
          type: result.type!,
        });
      }
      current.setDate(current.getDate() + 1);
    }

    return blockedDates;
  }

  // ─────────────────────────────────────────────────────────────
  // GET CALENDAR SUMMARY
  // ─────────────────────────────────────────────────────────────

  async getCalendarSummary(year: number): Promise<{
    year: number;
    holidays: { from: Date; to: Date; reason: string }[];
    blockedPeriods: { from: Date; to: Date; reason: string }[];
    totalHolidayDays: number;
    totalBlockedDays: number;
  }> {
    const calendar = await this.getCalendarByYear(year);

    // Calculate total holiday days
    let totalHolidayDays = 0;
    for (const h of calendar.holidays) {
      const days = Math.ceil(
        (new Date(h.to).getTime() - new Date(h.from).getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
      totalHolidayDays += days;
    }

    // Calculate total blocked days
    let totalBlockedDays = 0;
    for (const bp of calendar.blockedPeriods) {
      const days = Math.ceil(
        (new Date(bp.to).getTime() - new Date(bp.from).getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
      totalBlockedDays += days;
    }

    return {
      year: calendar.year,
      holidays: calendar.holidays,
      blockedPeriods: calendar.blockedPeriods,
      totalHolidayDays,
      totalBlockedDays,
    };
  }
}
