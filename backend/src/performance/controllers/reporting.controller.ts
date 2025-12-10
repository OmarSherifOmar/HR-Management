import { Controller, Get, Put, Param, Body, Post, Query, UseGuards } from '@nestjs/common';
import { ReportingService } from '../services/reporting.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';

@UseGuards(AuthGuard)
@Controller('api/performance/reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Put('archive/:recordId')
  async archive(@Param('recordId') recordId: string) {
    return this.reportingService.archive(recordId);
  }

  @Post('bulk-archive/:cycleId')
  async bulkArchive(@Param('cycleId') cycleId: string) {
    return this.reportingService.bulkArchive(cycleId);
  }

  @Get('history/:employeeId')
  async getHistory(@Param('employeeId') employeeId: string) {
    return this.reportingService.getHistory(employeeId);
  }

  @Get('outcome-report/:cycleId')
  async generateOutcomeReport(@Param('cycleId') cycleId: string) {
    return this.reportingService.generateOutcomeReport(cycleId);
  }
}
