import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Calendar, CalendarDocument } from '../models/calendar.schema';
import { Holiday, HolidayDocument } from '../../time-management/models/holiday.schema';
import { HolidayType } from '../../time-management/models/enums/index';

/**
 * CalendarService - US9: Set Calendars and Blocked Days
 * 
 * Uses the Calendar model with holidays as ObjectId[] references to Holiday model
 * from time-management module. BlockedPeriods remain as embedded array.
 */
@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(Calendar.name) private calendarModel: Model<CalendarDocument>,
    @InjectModel(Holiday.name) private holidayModel: Model<HolidayDocument>,
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
    const calendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);
    return calendar;
  }

  async getAllCalendars(): Promise<CalendarDocument[]> {
    return this.calendarModel.find().populate('holidays').sort({ year: -1 }).exec();
  }

  async deleteCalendar(year: number): Promise<{ deleted: boolean }> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    // Optionally delete associated holidays (or keep them for other uses)
    // For now, we remove the calendar but holidays remain in the Holiday collection
    await this.calendarModel.findOneAndDelete({ year }).exec();
    return { deleted: true };
  }

  // ─────────────────────────────────────────────────────────────
  // HOLIDAY MANAGEMENT (using Holiday model from time-management)
  // ─────────────────────────────────────────────────────────────

  async addHoliday(
    year: number,
    holiday: { 
      startDate: Date; 
      endDate?: Date; 
      name: string; 
      type?: HolidayType;
    },
  ): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    const endDate = holiday.endDate || holiday.startDate;
    if (new Date(holiday.startDate) > new Date(endDate)) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    // Check for duplicate holiday by name or date range
    const existingHolidays = await this.holidayModel.find({
      _id: { $in: calendar.holidays },
    }).exec();

    // Check for duplicate name
    const duplicateName = existingHolidays.find(h => h.name === holiday.name);
    if (duplicateName) {
      throw new BadRequestException(
        `Holiday with the name "${holiday.name}" already exists in this calendar.`
      );
    }

    // Check for overlapping dates
    const overlapping = existingHolidays.find(h => {
      const hStart = new Date(h.startDate);
      const hEnd = h.endDate ? new Date(h.endDate) : hStart;
      const newStart = new Date(holiday.startDate);
      const newEnd = new Date(endDate);

      // Check if dates overlap
      return (newStart <= hEnd && newEnd >= hStart);
    });

    if (overlapping) {
      const overlapStart = overlapping.startDate.toLocaleDateString();
      const overlapEnd = overlapping.endDate 
        ? overlapping.endDate.toLocaleDateString() 
        : overlapStart;
      throw new BadRequestException(
        `Date range overlaps with existing holiday "${overlapping.name}" (${overlapStart}${overlapping.endDate ? ' - ' + overlapEnd : ''}). ` +
        `Please choose different dates or delete the conflicting holiday first.`
      );
    }

    // Create a new Holiday document
    const newHoliday = new this.holidayModel({
      type: holiday.type || HolidayType.ORGANIZATIONAL,
      startDate: holiday.startDate,
      endDate: holiday.endDate,
      name: holiday.name,
      active: true,
    });
    const savedHoliday = await newHoliday.save();

    // Add the holiday reference to the calendar
    calendar.holidays.push(savedHoliday._id as Types.ObjectId);
    await calendar.save();

    const updatedCalendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    return updatedCalendar!;
  }

  async getHolidays(year: number): Promise<HolidayDocument[]> {
    const calendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);
    return calendar.holidays as unknown as HolidayDocument[];
  }

  async updateHoliday(
    year: number,
    holidayId: string,
    holiday: { 
      startDate?: Date; 
      endDate?: Date; 
      name?: string; 
      type?: HolidayType;
      active?: boolean;
    },
  ): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    // Check if holiday belongs to this calendar
    const holidayObjectId = new Types.ObjectId(holidayId);
    if (!calendar.holidays.some(h => h.equals(holidayObjectId))) {
      throw new BadRequestException('Holiday not found in this calendar');
    }

    // Validate dates if both provided
    if (holiday.startDate && holiday.endDate) {
      if (new Date(holiday.startDate) > new Date(holiday.endDate)) {
        throw new BadRequestException('startDate must be before or equal to endDate');
      }
    }

    // Update the holiday document
    const updatedHoliday = await this.holidayModel.findByIdAndUpdate(
      holidayId,
      { $set: holiday },
      { new: true },
    ).exec();

    if (!updatedHoliday) {
      throw new NotFoundException('Holiday not found');
    }

    const updatedCalendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    return updatedCalendar!;
  }

  async removeHoliday(year: number, holidayId: string): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    const holidayObjectId = new Types.ObjectId(holidayId);
    if (!calendar.holidays.some(h => h.equals(holidayObjectId))) {
      throw new BadRequestException('Holiday not found in this calendar');
    }

    // Remove from calendar's holidays array
    calendar.holidays = calendar.holidays.filter(h => !h.equals(holidayObjectId));
    await calendar.save();

    // Optionally delete the holiday document itself
    await this.holidayModel.findByIdAndDelete(holidayId).exec();

    const updatedCalendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    return updatedCalendar!;
  }

  async bulkAddHolidays(
    year: number,
    holidays: { 
      startDate: Date; 
      endDate?: Date; 
      name: string; 
      type?: HolidayType;
    }[],
  ): Promise<{ calendar: CalendarDocument; added: number; skipped: string[] }> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    const skipped: string[] = [];
    let added = 0;

    for (const h of holidays) {
      const endDate = h.endDate || h.startDate;
      if (new Date(h.startDate) > new Date(endDate)) {
        skipped.push(`${h.name} (invalid dates)`);
        continue;
      }

      // Check for duplicate by name among existing holidays in this calendar
      const existingHolidays = await this.holidayModel.find({
        _id: { $in: calendar.holidays },
        name: h.name,
      }).exec();

      if (existingHolidays.length > 0) {
        skipped.push(h.name);
        continue;
      }

      // Create new holiday
      const newHoliday = new this.holidayModel({
        type: h.type || HolidayType.ORGANIZATIONAL,
        startDate: h.startDate,
        endDate: h.endDate,
        name: h.name,
        active: true,
      });
      const savedHoliday = await newHoliday.save();

      calendar.holidays.push(savedHoliday._id as Types.ObjectId);
      added++;
    }

    await calendar.save();
    const populatedCalendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();

    return { calendar: populatedCalendar!, added, skipped };
  }

  // ─────────────────────────────────────────────────────────────
  // BLOCKED PERIODS (COMPANY CLOSURES) - embedded array
  // ─────────────────────────────────────────────────────────────

  async addBlockedPeriod(
    year: number,
    period: { from: Date; to: Date; reason: string },
  ): Promise<CalendarDocument> {
    if (new Date(period.from) > new Date(period.to)) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    // Check for exact duplicate (same dates or same reason)
    const exactDuplicate = calendar.blockedPeriods.find(
      bp => this.isSameDateRange(bp.from, bp.to, period.from, period.to) ||
            bp.reason.toLowerCase() === period.reason.toLowerCase()
    );

    if (exactDuplicate) {
      const dupFrom = new Date(exactDuplicate.from).toLocaleDateString();
      const dupTo = new Date(exactDuplicate.to).toLocaleDateString();
      throw new BadRequestException(
        `Blocked period already exists: "${exactDuplicate.reason}" (${dupFrom} - ${dupTo}). ` +
        `Please delete it first or choose a different date range and reason.`
      );
    }

    // Check for overlapping dates
    const overlapping = calendar.blockedPeriods.find(bp => {
      const bpStart = new Date(bp.from);
      const bpEnd = new Date(bp.to);
      const newStart = new Date(period.from);
      const newEnd = new Date(period.to);

      return (newStart <= bpEnd && newEnd >= bpStart);
    });

    if (overlapping) {
      const overlapFrom = new Date(overlapping.from).toLocaleDateString();
      const overlapTo = new Date(overlapping.to).toLocaleDateString();
      throw new BadRequestException(
        `Date range overlaps with existing blocked period "${overlapping.reason}" (${overlapFrom} - ${overlapTo}). ` +
        `Please choose different dates or delete the conflicting period first.`
      );
    }

    calendar.blockedPeriods.push(period);
    await calendar.save();
    const updatedCalendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    return updatedCalendar!;
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
    const updatedCalendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    return updatedCalendar!;
  }

  async removeBlockedPeriod(year: number, index: number): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    if (index < 0 || index >= calendar.blockedPeriods.length) {
      throw new BadRequestException('Invalid blocked period index');
    }

    calendar.blockedPeriods.splice(index, 1);
    await calendar.save();
    const updatedCalendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    return updatedCalendar!;
  }

  // ─────────────────────────────────────────────────────────────
  // UTILITY: Check if a date is blocked (holiday or closure)
  // ─────────────────────────────────────────────────────────────

  async isDateBlocked(date: Date): Promise<{ blocked: boolean; reason?: string; type?: string }> {
    const year = date.getFullYear();
    const calendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    if (!calendar) return { blocked: false };

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // Check holidays (populated Holiday documents)
    const holidays = calendar.holidays as unknown as HolidayDocument[];
    for (const h of holidays) {
      if (!h.active) continue;
      
      const startDate = new Date(h.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = h.endDate ? new Date(h.endDate) : new Date(h.startDate);
      endDate.setHours(23, 59, 59, 999);

      if (checkDate >= startDate && checkDate <= endDate) {
        return { blocked: true, reason: h.name || h.type, type: 'holiday' };
      }
    }

    // Check blocked periods
    for (const bp of calendar.blockedPeriods) {
      const from = new Date(bp.from);
      from.setHours(0, 0, 0, 0);
      const to = new Date(bp.to);
      to.setHours(23, 59, 59, 999);
      
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
    holidays: HolidayDocument[];
    blockedPeriods: { from: Date; to: Date; reason: string }[];
    totalHolidayDays: number;
    totalBlockedDays: number;
  }> {
    const calendar = await this.getCalendarByYear(year);
    const holidays = calendar.holidays as unknown as HolidayDocument[];

    // Calculate total holiday days
    let totalHolidayDays = 0;
    for (const h of holidays) {
      if (!h.active) continue;
      const startDate = new Date(h.startDate);
      const endDate = h.endDate ? new Date(h.endDate) : new Date(h.startDate);
      const days = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
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
      holidays,
      blockedPeriods: calendar.blockedPeriods,
      totalHolidayDays,
      totalBlockedDays,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // HELPER METHODS: Duplicate Detection for Blocked Periods
  // ─────────────────────────────────────────────────────────────

  private isSameDateRange(
    date1From: Date,
    date1To: Date,
    date2From: Date,
    date2To: Date,
  ): boolean {
    const from1 = new Date(date1From).toISOString().split('T')[0];
    const to1 = new Date(date1To).toISOString().split('T')[0];
    const from2 = new Date(date2From).toISOString().split('T')[0];
    const to2 = new Date(date2To).toISOString().split('T')[0];
    return from1 === from2 && to1 === to2;
  }

  private isBlockedPeriodDuplicate(
    existingPeriods: { from: Date; to: Date; reason: string }[],
    newPeriod: { from: Date; to: Date; reason: string },
  ): boolean {
    return existingPeriods.some(
      (bp) =>
        this.isSameDateRange(bp.from, bp.to, newPeriod.from, newPeriod.to) ||
        bp.reason.toLowerCase() === newPeriod.reason.toLowerCase(),
    );
  }
}
