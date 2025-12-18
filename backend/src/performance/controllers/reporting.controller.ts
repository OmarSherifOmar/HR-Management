import { Controller, Get, Put, Param, Body, Post, Query, UseGuards } from '@nestjs/common';
import { ReportingService } from '../services/reporting.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Role, Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(AuthGuard)
@Controller('api/performance/reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('history/:employeeId')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async getHistory(@Param('employeeId') employeeId: string) {
    console.log('[ReportingController] GET /history/:employeeId for:', employeeId);
    return this.reportingService.getHistory(employeeId);
  }

  @Get('outcome-report/:cycleId')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async generateOutcomeReport(@Param('cycleId') cycleId: string) {
    console.log('[ReportingController] GET /outcome-report/:cycleId for:', cycleId);
    return this.reportingService.generateOutcomeReport(cycleId);
  }

  @Get('multi-cycle-trend/:employeeId')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async getMultiCycleTrend(
    @Param('employeeId') employeeId: string,
    @Query('limit') limit?: string
  ) {
    console.log('[ReportingController] GET /multi-cycle-trend/:employeeId for:', employeeId, 'limit:', limit);
    return this.reportingService.getMultiCycleTrendAnalysis(employeeId, limit ? parseInt(limit) : 10);
  }
}