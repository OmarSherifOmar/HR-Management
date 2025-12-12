import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PersonalizedEntitlementService } from '../services/personalized-entitlement.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';
import { AdjustmentType } from '../enums/adjustment-type.enum';

/**
 * User Story 7: HR Admin Assign Personalized Leave Entitlements
 * Controller for managing personalized leave entitlements
 * All endpoints require HR_ADMIN role
 */
@Controller('leaves/personalized-entitlements')
@UseGuards(AuthGuard)
export class PersonalizedEntitlementController {
  constructor(
    private readonly personalizedEntitlementService: PersonalizedEntitlementService,
  ) {}

  /**
   * Assign personalized entitlement to an employee (by employee ID)
   * This endpoint stores entitlement data in leave entitlement collection
   */
  @Post('assign')
  @Roles(Role.HR_ADMIN)
  async assignPersonalizedEntitlement(
    @Body() dto: {
      employeeId: string;
      leaveTypeId: string;
      yearlyEntitlement: number;
      reason?: string;
    },
    @Request() req: any,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || req.user?._id;
    return this.personalizedEntitlementService.assignPersonalizedEntitlement(
      dto.employeeId,
      dto.leaveTypeId,
      dto.yearlyEntitlement,
      hrUserId,
      dto.reason,
    );
  }

  /**
   * Add leave adjustment for an employee (bonus days, deductions, encashment)
   */
  @Post('adjustment')
  @Roles(Role.HR_ADMIN)
  async addLeaveAdjustment(
    @Body() dto: {
      employeeId: string;
      leaveTypeId: string;
      adjustmentType: AdjustmentType;
      amount: number;
      reason: string;
    },
    @Request() req: any,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || req.user?._id;
    return this.personalizedEntitlementService.addLeaveAdjustment(
      dto.employeeId,
      dto.leaveTypeId,
      dto.adjustmentType,
      dto.amount,
      dto.reason,
      hrUserId,
    );
  }

  /**
   * Get entitlements by employee ID
   */
  @Get('employee/:employeeId')
  @Roles(Role.HR_ADMIN)
  async getEntitlementsByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.personalizedEntitlementService.getEntitlementsByEmployeeId(employeeId);
  }

  /**
   * Get adjustment history by employee ID
   */
  @Get('adjustments/:employeeId')
  @Roles(Role.HR_ADMIN)
  async getAdjustmentHistory(
    @Param('employeeId') employeeId: string,
    @Query('leaveTypeId') leaveTypeId?: string,
  ) {
    return this.personalizedEntitlementService.getAdjustmentHistory(
      employeeId,
      leaveTypeId,
    );
  }

  /**
   * Bulk assign entitlements to multiple employees (by employee IDs)
   */
  @Post('bulk-assign')
  @Roles(Role.HR_ADMIN)
  async bulkAssignEntitlements(
    @Body() dto: {
      employeeIds: string[];
      leaveTypeId: string;
      yearlyEntitlement: number;
      reason: string;
    },
    @Request() req: any,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || req.user?._id;
    return this.personalizedEntitlementService.bulkAssignEntitlements(
      dto.employeeIds,
      dto.leaveTypeId,
      dto.yearlyEntitlement,
      hrUserId,
      dto.reason,
    );
  }

  /**
   * Reset entitlement to policy default (by employee ID)
   */
  @Put('reset/:employeeId/:leaveTypeId')
  @Roles(Role.HR_ADMIN)
  async resetToDefaultEntitlement(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
    @Request() req: any,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || req.user?._id;
    return this.personalizedEntitlementService.resetToDefaultEntitlement(
      employeeId,
      leaveTypeId,
      hrUserId,
    );
  }

  /**
   * Get entitlement summary by employee ID
   */
  @Get('summary/:employeeId')
  @Roles(Role.HR_ADMIN)
  async getEntitlementSummary(@Param('employeeId') employeeId: string) {
    return this.personalizedEntitlementService.getEntitlementSummary(employeeId);
  }
}
