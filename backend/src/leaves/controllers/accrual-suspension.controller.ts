import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AccrualSuspensionService } from '../services/accrual-suspension.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';
import {
  ProcessAccrualWithSuspensionDto,
  BulkAccrualWithSuspensionDto,
  SuspendAccrualDto,
  ResumeAccrualDto,
  CalculateServiceDaysDto,
  PreviewAccrualAdjustmentDto,
} from '../dto/accrual-payroll/accrual-payroll.dto';

interface AuthenticatedRequest {
  user?: {
    sub?: string;
    id?: string;
    employeeNumber?: string;
    role?: string;
    roles?: string[];
  };
}

/**
 * REQ-042: Accrual Suspension/Adjustment Controller
 * 
 * As an HR Manager, I want to accrual suspension/adjustment during unpaid leave 
 * or long absence so that balances reflect true entitlement.
 * 
 * Features:
 * - Pause accrual during unpaid leave and suspensions
 * - Exclude unpaid leave periods when calculating eligibility and accrual
 * - Calculate balance based on actual service days, excluding unpaid leave or absence
 */
@Controller('leaves/accrual-suspension')
export class AccrualSuspensionController {
  constructor(private readonly accrualSuspensionService: AccrualSuspensionService) {}

  // ==================== CALCULATE SERVICE DAYS ====================

  /**
   * POST /leaves/accrual-suspension/calculate-service-days
   * 
   * Calculate actual service days for an employee in a given period
   * Excludes unpaid leave and suspension days
   */
  @Post('calculate-service-days')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  async calculateServiceDays(@Body() dto: CalculateServiceDaysDto) {
    const result = await this.accrualSuspensionService.calculateActualServiceDays(
      dto.employeeId,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
    );

    return {
      success: true,
      message: `Service days calculated: ${result.actualServiceDays} out of ${result.totalCalendarDays} calendar days`,
      data: result,
    };
  }

  // ==================== PROCESS ACCRUAL WITH SUSPENSION ====================

  /**
   * POST /leaves/accrual-suspension/process
   * 
   * Process accrual for an employee with suspension adjustment
   * Calculates accrual based on actual service days
   */
  @Post('process')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async processAccrualWithSuspension(
    @Body() dto: ProcessAccrualWithSuspensionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || '';
    const result = await this.accrualSuspensionService.processAccrualWithSuspension(
      dto.employeeId,
      dto.leaveTypeId,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
      hrUserId,
    );

    return {
      success: true,
      message: `Accrual processed: ${result.adjustedAccrual.toFixed(2)} days (original: ${result.originalAccrual}, deducted: ${result.deductedAmount.toFixed(2)})`,
      data: result,
    };
  }

  /**
   * POST /leaves/accrual-suspension/process-bulk
   * 
   * Run bulk accrual for all employees with suspension adjustments
   */
  @Post('process-bulk')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async processBulkAccrualWithSuspension(
    @Body() dto: BulkAccrualWithSuspensionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || '';
    const result = await this.accrualSuspensionService.runBulkAccrualWithSuspension(
      dto.leaveTypeId,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
      hrUserId,
      dto.employeeIds,
    );

    return {
      success: result.failedCount === 0,
      message: `Processed ${result.totalProcessed} employees: ${result.successCount} successful, ${result.failedCount} failed`,
      data: result,
    };
  }

  // ==================== MANUAL SUSPENSION CONTROL ====================

  /**
   * POST /leaves/accrual-suspension/suspend
   * 
   * Manually suspend accrual for an employee
   */
  @Post('suspend')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async suspendAccrual(
    @Body() dto: SuspendAccrualDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || '';
    const result = await this.accrualSuspensionService.suspendAccrual(
      dto.employeeId,
      dto.leaveTypeId,
      dto.reason,
      hrUserId,
      dto.startDate ? new Date(dto.startDate) : undefined,
    );

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * POST /leaves/accrual-suspension/resume
   * 
   * Resume accrual for an employee after suspension
   */
  @Post('resume')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async resumeAccrual(
    @Body() dto: ResumeAccrualDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || '';
    const result = await this.accrualSuspensionService.resumeAccrual(
      dto.employeeId,
      dto.leaveTypeId,
      dto.reason,
      hrUserId,
      dto.endDate ? new Date(dto.endDate) : undefined,
    );

    return {
      success: result.success,
      message: result.message,
    };
  }

  // ==================== PREVIEW & HISTORY ====================

  /**
   * POST /leaves/accrual-suspension/preview
   * 
   * Preview accrual adjustment without applying
   */
  @Post('preview')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  async previewAccrualAdjustment(@Body() dto: PreviewAccrualAdjustmentDto) {
    const result = await this.accrualSuspensionService.previewAccrualAdjustment(
      dto.employeeId,
      dto.leaveTypeId,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
    );

    return {
      success: true,
      message: `Preview: Original ${result.originalAccrual} → Adjusted ${result.adjustedAccrual.toFixed(2)} (deduction: ${result.deduction.toFixed(2)})`,
      data: result,
    };
  }

  /**
   * GET /leaves/accrual-suspension/history/:employeeId
   * 
   * Get accrual suspension history for an employee
   */
  @Get('history/:employeeId')
  @UseGuards(AuthGuard)
  async getAccrualSuspensionHistory(
    @Param('employeeId') employeeId: string,
    @Query('leaveTypeId') leaveTypeId?: string,
  ) {
    const history = await this.accrualSuspensionService.getAccrualSuspensionHistory(
      employeeId,
      leaveTypeId,
    );

    return {
      success: true,
      data: history,
    };
  }

  /**
   * GET /leaves/accrual-suspension/suspension-periods/:employeeId
   * 
   * Get active and historical suspension periods for an employee
   */
  @Get('suspension-periods/:employeeId')
  @UseGuards(AuthGuard)
  async getSuspensionPeriods(
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const periods = await this.accrualSuspensionService.getSuspensionPeriods(
      employeeId,
      start,
      end,
    );

    return {
      success: true,
      data: periods,
    };
  }
}
