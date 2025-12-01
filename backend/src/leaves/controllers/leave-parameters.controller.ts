import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LeaveParametersService } from '../services/leave-parameters.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

/**
 * User Story 8: HR Admin Configure Leave Parameters
 * Controller for managing leave parameters including max duration, notice periods, approval workflows
 * All endpoints require HR_ADMIN role
 */
@Controller('leaves/parameters')
@UseGuards(AuthGuard)
export class LeaveParametersController {
  constructor(private readonly leaveParametersService: LeaveParametersService) {}

  /**
   * Configure leave parameters for a policy
   */
  @Put('policy/:policyId')
  @Roles(Role.HR_ADMIN)
  async configureLeaveParameters(
    @Param('policyId') policyId: string,
    @Body() dto: { maxConsecutiveDays?: number; minNoticeDays?: number },
  ) {
    return this.leaveParametersService.configureLeaveParameters(policyId, {
      maxConsecutiveDays: dto.maxConsecutiveDays,
      minNoticeDays: dto.minNoticeDays,
    });
  }

  /**
   * Get leave parameters for a policy
   */
  @Get('policy/:policyId')
  @Roles(Role.HR_ADMIN)
  async getLeaveParameters(@Param('policyId') policyId: string) {
    return this.leaveParametersService.getLeaveParameters(policyId);
  }

  /**
   * Get all leave parameters summary
   */
  @Get('summary')
  @Roles(Role.HR_ADMIN)
  async getAllLeaveParametersSummary() {
    return this.leaveParametersService.getAllLeaveParametersSummary();
  }

  /**
   * Configure maximum consecutive days for a policy
   */
  @Put('policy/:policyId/max-consecutive-days')
  @Roles(Role.HR_ADMIN)
  async configureMaxConsecutiveDays(
    @Param('policyId') policyId: string,
    @Body() dto: { maxConsecutiveDays: number },
  ) {
    return this.leaveParametersService.configureMaxConsecutiveDays(
      policyId,
      dto.maxConsecutiveDays,
    );
  }

  /**
   * Configure minimum notice days for a policy
   */
  @Put('policy/:policyId/min-notice-days')
  @Roles(Role.HR_ADMIN)
  async configureMinNoticeDays(
    @Param('policyId') policyId: string,
    @Body() dto: { minNoticeDays: number },
  ) {
    return this.leaveParametersService.configureMinNoticeDays(
      policyId,
      dto.minNoticeDays,
    );
  }

  /**
   * Configure approval workflow for a policy
   */
  @Put('policy/:policyId/approval-workflow')
  @Roles(Role.HR_ADMIN)
  async configureApprovalWorkflow(
    @Param('policyId') policyId: string,
    @Body() dto: {
      requiresSupervisorApproval: boolean;
      requiresHRApproval: boolean;
      autoApproveUnderDays?: number;
      approvalLevels?: number;
    },
  ) {
    return this.leaveParametersService.configureApprovalWorkflow(policyId, {
      requiresSupervisorApproval: dto.requiresSupervisorApproval,
      requiresHRApproval: dto.requiresHRApproval,
      autoApproveUnderDays: dto.autoApproveUnderDays,
      approvalLevels: dto.approvalLevels,
    });
  }

  /**
   * Get approval workflow for a policy
   */
  @Get('policy/:policyId/approval-workflow')
  @Roles(Role.HR_ADMIN)
  async getApprovalWorkflow(@Param('policyId') policyId: string) {
    return this.leaveParametersService.getApprovalWorkflow(policyId);
  }

  /**
   * Validate a leave request against policy parameters
   */
  @Post('validate')
  @Roles(Role.HR_ADMIN)
  async validateLeaveRequest(
    @Body() dto: {
      leaveTypeId: string;
      requestedDays: number;
      requestDate: string;
      startDate: string;
    },
  ) {
    return this.leaveParametersService.validateLeaveRequest(
      dto.leaveTypeId,
      dto.requestedDays,
      new Date(dto.requestDate),
      new Date(dto.startDate),
    );
  }

  /**
   * Bulk update parameters for multiple policies
   */
  @Put('bulk-update')
  @Roles(Role.HR_ADMIN)
  async bulkUpdateParameters(
    @Body() dto: {
      updates: Array<{
        policyId: string;
        maxConsecutiveDays?: number;
        minNoticeDays?: number;
      }>;
    },
  ) {
    return this.leaveParametersService.bulkUpdateParameters(dto.updates);
  }

  /**
   * Get policies requiring advance notice
   */
  @Get('requiring-notice')
  @Roles(Role.HR_ADMIN)
  async getPoliciesRequiringNotice() {
    return this.leaveParametersService.getPoliciesRequiringNotice();
  }

  /**
   * Get policies with consecutive day limits
   */
  @Get('with-day-limits')
  @Roles(Role.HR_ADMIN)
  async getPoliciesWithDayLimits() {
    return this.leaveParametersService.getPoliciesWithDayLimits();
  }
}
