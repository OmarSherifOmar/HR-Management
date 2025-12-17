import { Controller, Get, Put, Param, Body, Post, Query, UseGuards } from '@nestjs/common';
import { ReportingService } from '../services/reporting.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Role, Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(AuthGuard)
@Controller('api/performance/reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Put('archive/:recordId')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async archive(@Param('recordId') recordId: string) {
    return this.reportingService.archive(recordId);
  }

  @Post('bulk-archive/:cycleId')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async bulkArchive(@Param('cycleId') cycleId: string) {
    return this.reportingService.bulkArchive(cycleId);
  }

  @Get('history/:employeeId')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async getHistory(@Param('employeeId') employeeId: string) {
    return this.reportingService.getHistory(employeeId);
  }

  @Get('outcome-report/:cycleId')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async generateOutcomeReport(@Param('cycleId') cycleId: string) {
    return this.reportingService.generateOutcomeReport(cycleId);
  }
}
