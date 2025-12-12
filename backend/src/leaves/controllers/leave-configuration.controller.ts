import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LeaveConfigurationService } from '../services/leave-configuration.service';
import { CreateLeavePolicyDto } from '../dto/leave-policy/create-leave-policy.dto';
import { UpdateLeavePolicyDto } from '../dto/leave-policy/update-leave-policy.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';


@Controller('leaves/configuration')
@UseGuards(AuthGuard) // User Story 2: Authentication required
export class LeaveConfigurationController {
  constructor(private readonly leaveConfigurationService: LeaveConfigurationService) {}

  /**
   * Initiate leave configuration process
   * GET /leaves/configuration/init
   * Internal system control - No input required
   */
  @Get('init')
  @Roles(Role.HR_ADMIN)
  async initiateLeaveConfiguration() {
    return this.leaveConfigurationService.initiateLeaveConfiguration();
  }

  /**
   *  Create new leave policy with configuration settings
   * POST /leaves/configuration/policies
   */
  @Post('policies')
  @Roles(Role.HR_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createLeavePolicy(
    @Body() createLeavePolicyDto: CreateLeavePolicyDto,
    @Request() req: any,
  ) {
    const adminId = req.user?.sub || req.user?.id;
    return this.leaveConfigurationService.createLeavePolicy(createLeavePolicyDto, adminId);
  }

  /**
   * User Story 3: Update existing leave policy configuration
   * PUT /leaves/configuration/policies/:id
   */
  @Put('policies/:id')
  @Roles(Role.HR_ADMIN)
  async updateLeavePolicy(
    @Param('id') policyId: string,
    @Body() updateLeavePolicyDto: UpdateLeavePolicyDto,
    @Request() req: any,
  ) {
    const adminId = req.user?.sub || req.user?.id;
    return this.leaveConfigurationService.updateLeavePolicy(
      policyId,
      updateLeavePolicyDto,
      adminId,
    );
  }

  /**
   * Get all leave policies
   * GET /leaves/configuration/policies
   */
  @Get('policies')
  @Roles(Role.HR_ADMIN)
  async getAllLeavePolicies() {
    return this.leaveConfigurationService.getAllLeavePolicies();
  }

  /**
   * Get leave policy by ID
   * GET /leaves/configuration/policies/:id
   */
  @Get('policies/:id')
  @Roles(Role.HR_ADMIN)
  async getLeavePolicyById(@Param('id') policyId: string) {
    return this.leaveConfigurationService.getLeavePolicyById(policyId);
  }

  /**
   * Get leave policy by leave type ID
   * GET /leaves/configuration/policies/leave-type/:leaveTypeId
   */
  @Get('policies/leave-type/:leaveTypeId')
  @Roles(Role.HR_ADMIN)
  async getLeavePolicyByLeaveType(@Param('leaveTypeId') leaveTypeId: string) {
    return this.leaveConfigurationService.getLeavePolicyByLeaveType(leaveTypeId);
  }

  /**
   * Delete leave policy
   * DELETE /leaves/configuration/policies/:id
   */
  @Delete('policies/:id')
  @Roles(Role.HR_ADMIN)
  async deleteLeavePolicy(@Param('id') policyId: string) {
    return this.leaveConfigurationService.deleteLeavePolicy(policyId);
  }

  /**
   *  Get accrual rate based on employment type
   * Uses Employee Profile (Employment Type for accrual rate determination)
   * GET /leaves/configuration/accrual-rate/:employeeId/:leaveTypeId
   */
  @Get('accrual-rate/:employeeId/:leaveTypeId')
  @Roles(Role.HR_ADMIN)
  async getAccrualRateByEmploymentType(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
  ) {
    return this.leaveConfigurationService.getAccrualRateByEmploymentType(
      employeeId,
      leaveTypeId,
    );
  }

  /**
   * Configure waiting period for leave eligibility
   * PUT /leaves/configuration/policies/:id/waiting-period
   */
  @Put('policies/:id/waiting-period')
  @Roles(Role.HR_ADMIN)
  async configureWaitingPeriod(
    @Param('id') policyId: string,
    @Body() dto: { minTenureMonths: number },
  ) {
    return this.leaveConfigurationService.configureWaitingPeriod(
      policyId,
      dto.minTenureMonths,
    );
  }

  /**
   * Configure carry-over settings
   * PUT /leaves/configuration/policies/:id/carry-over
   */
  @Put('policies/:id/carry-over')
  @Roles(Role.HR_ADMIN)
  async configureCarryOver(
    @Param('id') policyId: string,
    @Body() dto: {
      carryForwardAllowed: boolean;
      maxCarryForward: number;
      expiryAfterMonths?: number;
    },
  ) {
    return this.leaveConfigurationService.configureCarryOver(
      policyId,
      dto.carryForwardAllowed,
      dto.maxCarryForward,
      dto.expiryAfterMonths,
    );
  }

  /**
   *  Configure accrual settings
   * PUT /leaves/configuration/policies/:id/accrual
   */
  @Put('policies/:id/accrual')
  @Roles(Role.HR_ADMIN)
  async configureAccrual(
    @Param('id') policyId: string,
    @Body() dto: {
      accrualMethod: string;
      monthlyRate: number;
      yearlyRate: number;
    },
  ) {
    return this.leaveConfigurationService.configureAccrual(
      policyId,
      dto.accrualMethod,
      dto.monthlyRate,
      dto.yearlyRate,
    );
  }
}
