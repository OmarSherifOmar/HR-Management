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
import { LeaveYearConfigService, ResetBasis, LeaveYearConfig } from '../services/leave-year-config.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

@Controller('leaves/year-config')
@UseGuards(AuthGuard)
export class LeaveYearConfigController {
  constructor(private readonly leaveYearConfigService: LeaveYearConfigService) {}

  // ─────────────────────────────────────────────────────────────
  // GET CURRENT CONFIGURATION
  // ─────────────────────────────────────────────────────────────

  @Get()
  async getConfig() {
    return this.leaveYearConfigService.getConfig();
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE CONFIGURATION
  // ─────────────────────────────────────────────────────────────

  @Put()
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER)
  async updateConfig(@Body() body: Partial<LeaveYearConfig>) {
    return this.leaveYearConfigService.updateConfig(body);
  }

  // ─────────────────────────────────────────────────────────────
  // RESET TO DEFAULT CONFIGURATION
  // ─────────────────────────────────────────────────────────────

  @Post('reset-to-default')
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER)
  async resetToDefault() {
    return this.leaveYearConfigService.resetToDefault();
  }

  // ─────────────────────────────────────────────────────────────
  // CALCULATE LEAVE YEAR DATES
  // ─────────────────────────────────────────────────────────────

  @Get('calculate-dates')
  async calculateDates(
    @Query('referenceDate') referenceDateStr?: string,
    @Query('hireDate') hireDateStr?: string,
  ) {
    const referenceDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
    const hireDate = hireDateStr ? new Date(hireDateStr) : undefined;
    return this.leaveYearConfigService.calculateLeaveYearDates(referenceDate, hireDate);
  }

  // ─────────────────────────────────────────────────────────────
  // CALCULATE PRO-RATED ENTITLEMENT
  // ─────────────────────────────────────────────────────────────

  @Get('pro-rate')
  async calculateProRate(
    @Query('yearlyEntitlement') yearlyEntitlement: string,
    @Query('hireDate') hireDateStr: string,
  ) {
    const hireDate = new Date(hireDateStr);
    const proRated = this.leaveYearConfigService.calculateProRatedEntitlement(
      parseFloat(yearlyEntitlement),
      hireDate,
    );
    return { yearlyEntitlement: parseFloat(yearlyEntitlement), proRatedEntitlement: proRated, hireDate };
  }

  // ─────────────────────────────────────────────────────────────
  // GET EMPLOYEE LEAVE YEAR INFO
  // ─────────────────────────────────────────────────────────────

  @Get('employee/:employeeId')
  async getEmployeeLeaveYearInfo(
    @Param('employeeId') employeeId: string,
    @Query('hireDate') hireDateStr?: string,
  ) {
    const hireDate = hireDateStr ? new Date(hireDateStr) : undefined;
    return this.leaveYearConfigService.getEmployeeLeaveYearInfo(employeeId, hireDate);
  }

  // ─────────────────────────────────────────────────────────────
  // EXECUTE YEAR-END RESET FOR AN EMPLOYEE
  // ─────────────────────────────────────────────────────────────

  @Post('reset/employee/:employeeId')
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER)
  async executeYearEndReset(
    @Param('employeeId') employeeId: string,
    @Body() body?: { hireDate?: string },
  ) {
    const hireDate = body?.hireDate ? new Date(body.hireDate) : undefined;
    return this.leaveYearConfigService.executeYearEndReset(employeeId, hireDate);
  }

  // ─────────────────────────────────────────────────────────────
  // EXECUTE BULK YEAR-END RESET
  // ─────────────────────────────────────────────────────────────

  @Post('reset/bulk')
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER)
  async executeBulkYearEndReset() {
    return this.leaveYearConfigService.executeBulkYearEndReset();
  }

  // ─────────────────────────────────────────────────────────────
  // GET UPCOMING RESETS
  // ─────────────────────────────────────────────────────────────

  @Get('resets/upcoming')
  async getUpcomingResets(@Query('withinDays') withinDays?: string) {
    const days = withinDays ? parseInt(withinDays, 10) : 30;
    return this.leaveYearConfigService.getUpcomingResets(days);
  }

  // ─────────────────────────────────────────────────────────────
  // SET EMPLOYEE RESET DATE
  // ─────────────────────────────────────────────────────────────

  @Put('employee/:employeeId/leave-type/:leaveTypeId/reset-date')
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER)
  async setEmployeeResetDate(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() body: { nextResetDate: string },
  ) {
    const nextResetDate = new Date(body.nextResetDate);
    return this.leaveYearConfigService.setEmployeeResetDate(employeeId, leaveTypeId, nextResetDate);
  }
}
