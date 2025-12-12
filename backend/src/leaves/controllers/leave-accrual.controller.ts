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
import { LeaveAccrualService } from '../services/leave-accrual.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

interface AuthenticatedRequest {
  user?: {
    sub?: string;
    employeeNumber?: string;
    role?: string;
    roles?: string[];
  };
}

/**
 * Leave Accrual Controller
 * 
 * REQ-040: Automatic Leave Accrual
 * REQ-041: Automatic Carry-Forward Processing
 * 
 * Endpoints for managing automatic leave accrual and carry-forward processing.
 */
@Controller('leaves/accrual')
export class LeaveAccrualController {
  constructor(private readonly accrualService: LeaveAccrualService) {}

  // ==================== REQ-040: AUTOMATIC LEAVE ACCRUAL ====================

  /**
   * POST /leaves/accrual/process/:leaveTypeId
   * 
   * REQ-040: Run automatic accrual for all employees for a specific leave type
   * 
   * @param leaveTypeId - Leave type to process accrual for
   * @param body - Optional employee IDs to process
   * @returns Summary of accrual processing
   */
  @Post('process/:leaveTypeId')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async runAccrual(
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() body: { employeeIds?: string[]; serviceDaysMap?: Record<string, number> },
  ) {
    const serviceDaysMap = body.serviceDaysMap
      ? new Map(Object.entries(body.serviceDaysMap).map(([k, v]) => [k, Number(v)]))
      : undefined;

    const result = await this.accrualService.runBulkAccrual(leaveTypeId, {
      employeeIds: body.employeeIds,
      serviceDaysMap,
    });

    return {
      success: result.failedCount === 0,
      message: `Processed accrual for ${result.totalProcessed} employees: ${result.successCount} successful, ${result.failedCount} failed`,
      data: result,
    };
  }

  /**
   * POST /leaves/accrual/process-single
   * 
   * Process accrual for a single employee
   * 
   * @param body - Employee ID, leave type ID, and optional service days
   * @returns Accrual result
   */
  @Post('process-single')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async processAccrualForEmployee(
    @Body() body: { employeeId: string; leaveTypeId: string; serviceDays?: number },
  ) {
    const result = await this.accrualService.processAccrualForEmployee(
      body.employeeId,
      body.leaveTypeId,
      body.serviceDays,
    );

    return {
      success: true,
      message: `Accrued ${result.accruedAmount} days for employee`,
      data: result,
    };
  }

  /**
   * POST /leaves/accrual/monthly-job
   * 
   * REQ-040: Run monthly accrual job for all leave types configured for monthly accrual
   * This should be called by a scheduler/cron job
   * 
   * @returns Summary of all accruals processed
   */
  @Post('monthly-job')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async runMonthlyAccrualJob() {
    const result = await this.accrualService.runMonthlyAccrualJob();

    return {
      success: true,
      message: `Monthly accrual completed for ${result.leaveTypes.length} leave types`,
      data: result,
    };
  }

  // ==================== REQ-041: AUTOMATIC CARRY-FORWARD PROCESSING ====================

  /**
   * POST /leaves/accrual/carry-forward/:leaveTypeId
   * 
   * REQ-041: Run carry-forward processing for a specific leave type
   * 
   * @param leaveTypeId - Leave type to process carry-forward for
   * @param body - Year information and optional employee IDs
   * @returns Summary of carry-forward processing
   */
  @Post('carry-forward/:leaveTypeId')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async runCarryForward(
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() body: { fromYear: number; toYear: number; employeeIds?: string[] },
  ) {
    const result = await this.accrualService.runBulkCarryForward(
      leaveTypeId,
      body.fromYear,
      body.toYear,
      body.employeeIds,
    );

    return {
      success: result.failedCount === 0,
      message: `Processed carry-forward for ${result.totalProcessed} employees: ${result.successCount} successful, ${result.failedCount} failed`,
      data: result,
    };
  }

  /**
   * POST /leaves/accrual/carry-forward-single
   * 
   * Process carry-forward for a single employee
   * 
   * @param body - Employee ID, leave type ID, and year information
   * @returns Carry-forward result
   */
  @Post('carry-forward-single')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async processCarryForwardForEmployee(
    @Body() body: { employeeId: string; leaveTypeId: string; fromYear: number; toYear: number },
  ) {
    const result = await this.accrualService.processCarryForwardForEmployee(
      body.employeeId,
      body.leaveTypeId,
      body.fromYear,
      body.toYear,
    );

    return {
      success: true,
      message: `Carry-forward processed: ${result.carryForwardAmount} days carried, ${result.expiredAmount} days expired`,
      data: result,
    };
  }

  /**
   * POST /leaves/accrual/year-end-job
   * 
   * REQ-041: Run year-end carry-forward job for all leave types
   * This should be called by a scheduler/cron job at year end
   * 
   * @param body - Year information
   * @returns Summary of all carry-forwards processed
   */
  @Post('year-end-job')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async runYearEndCarryForwardJob(
    @Body() body: { fromYear: number; toYear: number },
  ) {
    const result = await this.accrualService.runYearEndCarryForwardJob(
      body.fromYear,
      body.toYear,
    );

    return {
      success: true,
      message: `Year-end carry-forward completed for ${result.leaveTypes.length} leave types`,
      data: result,
    };
  }

  /**
   * POST /leaves/accrual/process-expired
   * 
   * Process expired carry-forward balances
   * 
   * @returns Summary of expired balances processed
   */
  @Post('process-expired')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async processExpiredCarryForward() {
    const result = await this.accrualService.processExpiredCarryForward();

    return {
      success: true,
      message: `Processed ${result.processed} potential expirations`,
      data: result,
    };
  }

  // ==================== STATUS & PREVIEW ENDPOINTS ====================

  /**
   * GET /leaves/accrual/status/:employeeId
   * 
   * Get accrual status for an employee
   * 
   * @param employeeId - Employee ID
   * @param leaveTypeId - Optional leave type filter
   * @returns Accrual status for the employee
   */
  @Get('status/:employeeId')
  @UseGuards(AuthGuard)
  async getAccrualStatus(
    @Param('employeeId') employeeId: string,
    @Query('leaveTypeId') leaveTypeId: string,
  ) {
    const result = await this.accrualService.getAccrualStatus(employeeId, leaveTypeId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /leaves/accrual/preview-carry-forward/:employeeId/:leaveTypeId
   * 
   * Preview carry-forward calculation without applying
   * 
   * @param employeeId - Employee ID
   * @param leaveTypeId - Leave type ID
   * @returns Preview of carry-forward calculation
   */
  @Get('preview-carry-forward/:employeeId/:leaveTypeId')
  @UseGuards(AuthGuard)
  async previewCarryForward(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
  ) {
    const result = await this.accrualService.previewCarryForward(employeeId, leaveTypeId);

    return {
      success: true,
      data: result,
    };
  }
}
