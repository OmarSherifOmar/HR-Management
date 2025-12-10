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
import { PayrollSyncService } from '../services/payroll-sync.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';
import {
  CalculateUnpaidDeductionDto,
  CalculateAbsenceDeductionDto,
  CalculateEncashmentDto,
  ProcessEncashmentDto,
  CalculateFinalSettlementDto,
  ProcessFinalSettlementDto,
  GetMonthlyPayrollSummaryDto,
  GenerateSyncEventDto,
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
 * REQ-042: Real-time Payroll Synchronization Controller
 * 
 * As an HR Manager, I want to automatically sync with the payroll system in real-time 
 * so that salary deductions or adjustments are calculated without delays.
 * 
 * Features:
 * - Calculate unpaid leave deductions
 * - Process leave encashment
 * - Handle final settlement on termination/resignation
 * - Generate payroll sync events
 */
@Controller('leaves/payroll-sync')
export class PayrollSyncController {
  constructor(private readonly payrollSyncService: PayrollSyncService) {}

  // ==================== UNPAID LEAVE DEDUCTIONS ====================

  /**
   * POST /leaves/payroll-sync/calculate-unpaid-deduction
   * 
   * Calculate unpaid leave deduction for an employee
   * Formula: (Base Salary / Work Days in Month) × Unpaid Leave Days
   */
  @Post('calculate-unpaid-deduction')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @HttpCode(HttpStatus.OK)
  async calculateUnpaidLeaveDeduction(@Body() dto: CalculateUnpaidDeductionDto) {
    const result = await this.payrollSyncService.calculateUnpaidLeaveDeduction(
      dto.employeeId,
      dto.baseSalary,
      dto.month,
      dto.year,
      dto.workDaysInMonth,
    );

    return {
      success: true,
      message: `Unpaid leave deduction: ${result.deductionAmount} (${result.unpaidLeaveDays} days × ${result.dailyRate}/day)`,
      data: result,
    };
  }

  /**
   * POST /leaves/payroll-sync/calculate-absence-deduction
   * 
   * Calculate deduction for unapproved absences
   * For absences not covered by approved leave requests
   */
  @Post('calculate-absence-deduction')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @HttpCode(HttpStatus.OK)
  async calculateAbsenceDeduction(@Body() dto: CalculateAbsenceDeductionDto) {
    const result = await this.payrollSyncService.calculateUnapprovedAbsenceDeduction(
      dto.employeeId,
      dto.baseSalary,
      dto.absenceDays,
      dto.workDaysInMonth,
    );

    return {
      success: true,
      message: `Absence deduction: ${result.deductionAmount} (${result.absenceDays} days × ${result.dailyRate}/day)`,
      data: result,
    };
  }

  // ==================== LEAVE ENCASHMENT ====================

  /**
   * POST /leaves/payroll-sync/calculate-encashment
   * 
   * Calculate leave encashment amount (preview without processing)
   */
  @Post('calculate-encashment')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @HttpCode(HttpStatus.OK)
  async calculateEncashment(@Body() dto: CalculateEncashmentDto) {
    const result = await this.payrollSyncService.calculateEncashment(
      dto.employeeId,
      dto.leaveTypeId,
      dto.daysToEncash,
      dto.dailyRate,
    );

    return {
      success: true,
      message: `Encashment calculation: ${result.encashmentAmount} (${result.leaveDays} days × ${result.dailyRate}/day)`,
      data: result,
    };
  }

  /**
   * POST /leaves/payroll-sync/process-encashment
   * 
   * Process leave encashment - deducts from balance and creates payroll event
   */
  @Post('process-encashment')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async processEncashment(
    @Body() dto: ProcessEncashmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || '';
    const result = await this.payrollSyncService.processEncashment(
      dto.employeeId,
      dto.leaveTypeId,
      dto.daysToEncash,
      dto.dailyRate,
      hrUserId,
    );

    return {
      success: true,
      message: `Encashment processed: ${result.calculation.encashmentAmount}. New balance: ${result.updatedBalance}`,
      data: result,
    };
  }

  // ==================== FINAL SETTLEMENT ====================

  /**
   * POST /leaves/payroll-sync/calculate-final-settlement
   * 
   * Calculate final settlement for terminated/resigned employee (preview)
   */
  @Post('calculate-final-settlement')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @HttpCode(HttpStatus.OK)
  async calculateFinalSettlement(@Body() dto: CalculateFinalSettlementDto) {
    const result = await this.payrollSyncService.calculateFinalSettlement(
      dto.employeeId,
      new Date(dto.terminationDate),
      dto.dailyRate,
      dto.encashableLeaveTypes,
    );

    return {
      success: true,
      message: `Final settlement: ${result.totalEncashment} encashment, ${result.totalForfeited} days forfeited`,
      data: result,
    };
  }

  /**
   * POST /leaves/payroll-sync/process-final-settlement
   * 
   * Process final settlement - clears balances and creates payroll event
   */
  @Post('process-final-settlement')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async processFinalSettlement(
    @Body() dto: ProcessFinalSettlementDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || '';
    const result = await this.payrollSyncService.processFinalSettlement(
      dto.employeeId,
      new Date(dto.terminationDate),
      dto.dailyRate,
      hrUserId,
      dto.encashableLeaveTypes,
    );

    return {
      success: true,
      message: `Final settlement processed: ${result.settlement.totalEncashment} encashment, ${result.settlement.totalForfeited} days forfeited`,
      data: result,
    };
  }

  // ==================== PAYROLL SYNC EVENTS ====================

  /**
   * POST /leaves/payroll-sync/generate-approval-event
   * 
   * Generate payroll sync event when leave is approved
   */
  @Post('generate-approval-event')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async generateLeaveApprovalEvent(@Body() dto: GenerateSyncEventDto) {
    const event = await this.payrollSyncService.generateLeaveApprovalSyncEvent(
      dto.leaveRequestId,
    );

    return {
      success: true,
      message: `Payroll sync event generated for leave approval`,
      data: event,
    };
  }

  /**
   * POST /leaves/payroll-sync/generate-cancellation-event
   * 
   * Generate payroll sync event when leave is cancelled
   */
  @Post('generate-cancellation-event')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async generateLeaveCancellationEvent(@Body() dto: GenerateSyncEventDto) {
    const event = await this.payrollSyncService.generateLeaveCancellationSyncEvent(
      dto.leaveRequestId,
    );

    return {
      success: true,
      message: `Payroll sync event generated for leave cancellation`,
      data: event,
    };
  }

  // ==================== MONTHLY SUMMARY ====================

  /**
   * POST /leaves/payroll-sync/monthly-summary
   * 
   * Get monthly payroll summary for all employees
   * Returns paid/unpaid leave days and deductions
   */
  @Post('monthly-summary')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @HttpCode(HttpStatus.OK)
  async getMonthlyPayrollSummary(@Body() dto: GetMonthlyPayrollSummaryDto) {
    const baseSalaryMap = new Map(Object.entries(dto.baseSalaryMap));
    const result = await this.payrollSyncService.getMonthlyPayrollSummary(
      dto.month,
      dto.year,
      baseSalaryMap,
    );

    return {
      success: true,
      message: `Monthly summary for ${result.period}: ${result.employees.length} employees, ${result.totalDeductions} total deductions`,
      data: result,
    };
  }
}
