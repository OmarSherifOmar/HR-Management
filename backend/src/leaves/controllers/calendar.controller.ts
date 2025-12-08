import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CalendarService } from '../services/calendar.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';
import { HolidayType } from '../../time-management/models/enums/index';

@Controller('leaves/calendar')
@UseGuards(AuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // ─────────────────────────────────────────────────────────────
  // CALENDAR (YEAR) ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  @Post('year/:year')
  @Roles(Role.HR_ADMIN)
  async createCalendar(@Param('year') year: string) {
    return this.calendarService.createCalendar(parseInt(year, 10));
  }

  @Get('year/:year')
  async getCalendarByYear(@Param('year') year: string) {
    return this.calendarService.getCalendarByYear(parseInt(year, 10));
  }

  @Get('years')
  async getAllCalendars() {
    return this.calendarService.getAllCalendars();
  }

  @Delete('year/:year')
  @Roles(Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteCalendar(@Param('year') year: string) {
    return this.calendarService.deleteCalendar(parseInt(year, 10));
  }

  @Get('year/:year/summary')
  async getCalendarSummary(@Param('year') year: string) {
    return this.calendarService.getCalendarSummary(parseInt(year, 10));
  }

  // ─────────────────────────────────────────────────────────────
  // HOLIDAY ENDPOINTS (using Holiday model from time-management)
  // ─────────────────────────────────────────────────────────────

  @Post('year/:year/holidays')
  @Roles(Role.HR_ADMIN)
  async addHoliday(
    @Param('year') year: string,
    @Body() body: { 
      startDate: Date; 
      endDate?: Date; 
      name: string; 
      type?: HolidayType;
    },
  ) {
    return this.calendarService.addHoliday(parseInt(year, 10), body);
  }

  @Get('year/:year/holidays')
  async getHolidays(@Param('year') year: string) {
    return this.calendarService.getHolidays(parseInt(year, 10));
  }

  @Put('year/:year/holidays/:holidayId')
  @Roles(Role.HR_ADMIN)
  async updateHoliday(
    @Param('year') year: string,
    @Param('holidayId') holidayId: string,
    @Body() body: { 
      startDate?: Date; 
      endDate?: Date; 
      name?: string; 
      type?: HolidayType;
      active?: boolean;
    },
  ) {
    return this.calendarService.updateHoliday(parseInt(year, 10), holidayId, body);
  }

  @Delete('year/:year/holidays/:holidayId')
  @Roles(Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  async removeHoliday(
    @Param('year') year: string,
    @Param('holidayId') holidayId: string,
  ) {
    return this.calendarService.removeHoliday(parseInt(year, 10), holidayId);
  }

  @Post('year/:year/holidays/bulk')
  @Roles(Role.HR_ADMIN)
  async bulkAddHolidays(
    @Param('year') year: string,
    @Body() body: { 
      holidays: { 
        startDate: Date; 
        endDate?: Date; 
        name: string; 
        type?: HolidayType;
      }[] 
    },
  ) {
    return this.calendarService.bulkAddHolidays(parseInt(year, 10), body.holidays);
  }

  // ─────────────────────────────────────────────────────────────
  // BLOCKED PERIODS ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  @Post('year/:year/blocked-periods')
  @Roles(Role.HR_ADMIN)
  async addBlockedPeriod(
    @Param('year') year: string,
    @Body() body: { from: Date; to: Date; reason: string },
  ) {
    return this.calendarService.addBlockedPeriod(parseInt(year, 10), body);
  }

  @Get('year/:year/blocked-periods')
  async getBlockedPeriods(@Param('year') year: string) {
    return this.calendarService.getBlockedPeriods(parseInt(year, 10));
  }

  @Put('year/:year/blocked-periods/:index')
  @Roles(Role.HR_ADMIN)
  async updateBlockedPeriod(
    @Param('year') year: string,
    @Param('index') index: string,
    @Body() body: { from: Date; to: Date; reason: string },
  ) {
    return this.calendarService.updateBlockedPeriod(parseInt(year, 10), parseInt(index, 10), body);
  }

  @Delete('year/:year/blocked-periods/:index')
  @Roles(Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  async removeBlockedPeriod(
    @Param('year') year: string,
    @Param('index') index: string,
  ) {
    return this.calendarService.removeBlockedPeriod(parseInt(year, 10), parseInt(index, 10));
  }

  // ─────────────────────────────────────────────────────────────
  // UTILITY ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  @Get('check-date')
  async checkDate(@Query('date') dateStr: string) {
    const date = new Date(dateStr);
    return this.calendarService.isDateBlocked(date);
  }

  @Get('blocked-dates-in-range')
  async getBlockedDatesInRange(
    @Query('from') fromStr: string,
    @Query('to') toStr: string,
  ) {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    return this.calendarService.getBlockedDatesInRange(from, to);
  }
}
