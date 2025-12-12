import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';

@Controller('time-management/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private parseDate(value?: string): Date {
    if (!value) return new Date();
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      throw new Error(`Invalid date: ${value}`);
    }
    return d;
  }

  @Get('overtime')
  getOvertime(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.reportsService.getOvertimeReport(
      this.parseDate(startDate),
      this.parseDate(endDate),
      employeeId,
    );
  }

  @Get('exceptions')
  getExceptions(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.reportsService.getExceptionReport(
      this.parseDate(startDate),
      this.parseDate(endDate),
      type as any,
      status as any,
      employeeId,
    );
  }

  @Get('penalties')
  getPenalties(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.reportsService.getPenaltyReport(
      this.parseDate(startDate),
      this.parseDate(endDate),
      employeeId,
    );
  }

  @Get('attendance-summary')
  getAttendanceSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.reportsService.getAttendanceSummary(
      this.parseDate(startDate),
      this.parseDate(endDate),
      employeeId,
    );
  }

  @Get('dashboard')
  getDashboard(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getDashboardAnalytics(
      this.parseDate(startDate),
      this.parseDate(endDate),
    );
  }
}
