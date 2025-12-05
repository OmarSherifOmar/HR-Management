import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { authorizationGuard } from '../../auth/guards/authorization.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';
import {
  BalanceAdjustmentService,
  BalanceAdjustmentInput,
  BulkAdjustmentInput,
  CarryOverInput,
  AdjustmentReason,
} from '../services/balance-adjustment.service';
import { AdjustmentType } from '../enums/adjustment-type.enum';

/**
 * User Story 12: HR Admin Manual Balance Adjustments
 * 
 * Controller for managing manual leave balance adjustments including:
 * - Corrections
 * - Carry-overs
 * - One-time grants
 * - Bulk adjustments
 * - Adjustment reversals
 */
@Controller('leaves/balance-adjustments')
@UseGuards(AuthGuard, authorizationGuard)
export class BalanceAdjustmentController {
  constructor(private readonly balanceAdjustmentService: BalanceAdjustmentService) {}

  // ─────────────────────────────────────────────────────────────
  // MANUAL ADJUSTMENT
  // ─────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.HR_ADMIN)
  async adjustBalance(
    @Body()
    body: {
      employeeId: string;
      leaveTypeId: string;
      adjustmentType: AdjustmentType;
      amount: number;
      reasonCategory: AdjustmentReason;
      description: string;
      effectiveDate?: string;
      expiryDate?: string;
    },
  ) {
    const input: BalanceAdjustmentInput = {
      ...body,
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : undefined,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
    };

    // TODO: Get actual HR user ID from request
    const hrUserId = '000000000000000000000001';

    return this.balanceAdjustmentService.adjustBalance(input, hrUserId);
  }

  // ─────────────────────────────────────────────────────────────
  // CORRECTION
  // ─────────────────────────────────────────────────────────────

  @Put('correct/:employeeId/:leaveTypeId')
  @Roles(Role.HR_ADMIN)
  async correctBalance(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() body: { correctBalance: number; description: string },
  ) {
    // TODO: Get actual HR user ID from request
    const hrUserId = '000000000000000000000001';

    return this.balanceAdjustmentService.correctBalance(
      employeeId,
      leaveTypeId,
      body.correctBalance,
      body.description,
      hrUserId,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CARRY-OVER
  // ─────────────────────────────────────────────────────────────

  @Post('carry-over')
  @Roles(Role.HR_ADMIN)
  async processCarryOver(
    @Body()
    body: {
      employeeId: string;
      leaveTypeId: string;
      carryOverAmount: number;
      fromYear: number;
      toYear: number;
      expiryDate?: string;
    },
  ) {
    const input: CarryOverInput = {
      ...body,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
    };

    // TODO: Get actual HR user ID from request
    const hrUserId = '000000000000000000000001';

    return this.balanceAdjustmentService.processCarryOver(input, hrUserId);
  }

  // ─────────────────────────────────────────────────────────────
  // ONE-TIME GRANT
  // ─────────────────────────────────────────────────────────────

  @Post('grant')
  @Roles(Role.HR_ADMIN)
  async grantOneTimeLeave(
    @Body()
    body: {
      employeeId: string;
      leaveTypeId: string;
      grantAmount: number;
      reason: string;
      expiryDate?: string;
    },
  ) {
    // TODO: Get actual HR user ID from request
    const hrUserId = '000000000000000000000001';

    return this.balanceAdjustmentService.grantOneTimeLeave(
      body.employeeId,
      body.leaveTypeId,
      body.grantAmount,
      body.reason,
      hrUserId,
      body.expiryDate ? new Date(body.expiryDate) : undefined,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // BULK ADJUSTMENT
  // ─────────────────────────────────────────────────────────────

  @Post('bulk')
  @Roles(Role.HR_ADMIN)
  async bulkAdjustBalances(
    @Body()
    body: {
      employeeIds: string[];
      leaveTypeId: string;
      adjustmentType: AdjustmentType;
      amount: number;
      reasonCategory: AdjustmentReason;
      description: string;
    },
  ) {
    const input: BulkAdjustmentInput = body;

    // TODO: Get actual HR user ID from request
    const hrUserId = '000000000000000000000001';

    return this.balanceAdjustmentService.bulkAdjustBalances(input, hrUserId);
  }

  // ─────────────────────────────────────────────────────────────
  // REVERSE ADJUSTMENT
  // ─────────────────────────────────────────────────────────────

  @Post('reverse/:adjustmentId')
  @Roles(Role.HR_ADMIN)
  async reverseAdjustment(
    @Param('adjustmentId') adjustmentId: string,
    @Body() body: { reason: string },
  ) {
    // TODO: Get actual HR user ID from request
    const hrUserId = '000000000000000000000001';

    return this.balanceAdjustmentService.reverseAdjustment(
      adjustmentId,
      body.reason,
      hrUserId,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // QUERY ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  @Get('history/:employeeId')
  @Roles(Role.HR_ADMIN)
  async getAdjustmentHistory(
    @Param('employeeId') employeeId: string,
    @Query('leaveTypeId') leaveTypeId?: string,
    @Query('adjustmentType') adjustmentType?: AdjustmentType,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.balanceAdjustmentService.getAdjustmentHistory(employeeId, {
      leaveTypeId,
      adjustmentType,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });
  }

  @Get('summary/:employeeId')
  @Roles(Role.HR_ADMIN)
  async getAdjustmentSummary(@Param('employeeId') employeeId: string) {
    return this.balanceAdjustmentService.getAdjustmentSummary(employeeId);
  }

  @Get('balance/:employeeId/:leaveTypeId')
  @Roles(Role.HR_ADMIN)
  async getCurrentBalance(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
  ) {
    return this.balanceAdjustmentService.getCurrentBalance(employeeId, leaveTypeId);
  }

  // ─────────────────────────────────────────────────────────────
  // SUPPORTED VALUES
  // ─────────────────────────────────────────────────────────────

  @Get('reason-categories')
  @Roles(Role.HR_ADMIN)
  getReasonCategories() {
    return {
      reasonCategories: Object.values(AdjustmentReason),
      descriptions: {
        [AdjustmentReason.CORRECTION]: 'Fix incorrect balance due to data entry error',
        [AdjustmentReason.CARRY_OVER]: 'Carry forward unused leave from previous year',
        [AdjustmentReason.ONE_TIME_GRANT]: 'Special one-time leave grant',
        [AdjustmentReason.POLICY_CHANGE]: 'Adjustment due to policy change',
        [AdjustmentReason.REINSTATEMENT]: 'Reinstate previously deducted leave',
        [AdjustmentReason.TRANSFER]: 'Leave transfer from another entity/department',
        [AdjustmentReason.ERROR_FIX]: 'Fix system or calculation error',
        [AdjustmentReason.ANNIVERSARY_BONUS]: 'Bonus leave for work anniversary',
        [AdjustmentReason.MEDICAL_RESTORATION]: 'Restore leave after medical review',
        [AdjustmentReason.OTHER]: 'Other reason (specify in description)',
      },
    };
  }

  @Get('adjustment-types')
  @Roles(Role.HR_ADMIN)
  getAdjustmentTypes() {
    return {
      adjustmentTypes: Object.values(AdjustmentType),
      descriptions: {
        [AdjustmentType.ADD]: 'Add days to balance',
        [AdjustmentType.DEDUCT]: 'Deduct days from balance',
        [AdjustmentType.ENCASHMENT]: 'Convert leave days to cash',
      },
    };
  }
}
