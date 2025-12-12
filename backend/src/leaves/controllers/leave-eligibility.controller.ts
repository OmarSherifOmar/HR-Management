import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LeaveEligibilityService } from '../services/leave-eligibility.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

/**
 * User Story 6: HR Admin Set Eligibility Rules
 * Controller for managing leave eligibility rules
 * All endpoints require HR_ADMIN role
 */
@Controller('leaves/eligibility')
@UseGuards(AuthGuard)
export class LeaveEligibilityController {
  constructor(private readonly leaveEligibilityService: LeaveEligibilityService) {}

  /**
   * Set eligibility rules for a leave policy
   */
  @Put('policy/:policyId')
  @Roles(Role.HR_ADMIN)
  async setEligibilityRules(
    @Param('policyId') policyId: string,
    @Body() dto: {
      minTenureMonths?: number;
      contractTypesAllowed?: string[];
      positionsAllowed?: string[];
    },
  ) {
    return this.leaveEligibilityService.setEligibilityRules(policyId, dto);
  }

  /**
   * Get eligibility rules for a leave policy
   */
  @Get('policy/:policyId')
  @Roles(Role.HR_ADMIN)
  async getEligibilityRules(@Param('policyId') policyId: string) {
    return this.leaveEligibilityService.getEligibilityRules(policyId);
  }

  /**
   * Set minimum tenure requirement for a leave policy
   */
  @Put('policy/:policyId/min-tenure')
  @Roles(Role.HR_ADMIN)
  async setMinTenureRequirement(
    @Param('policyId') policyId: string,
    @Body() dto: { minTenureMonths: number },
  ) {
    return this.leaveEligibilityService.setMinTenureRequirement(
      policyId,
      dto.minTenureMonths,
    );
  }

  /**
   * Set allowed contract types for a leave policy
   */
  @Put('policy/:policyId/contract-types')
  @Roles(Role.HR_ADMIN)
  async setAllowedContractTypes(
    @Param('policyId') policyId: string,
    @Body() dto: { contractTypes: string[] },
  ) {
    return this.leaveEligibilityService.setAllowedContractTypes(
      policyId,
      dto.contractTypes,
    );
  }

  /**
   * Set allowed positions for a leave policy
   */
  @Put('policy/:policyId/positions')
  @Roles(Role.HR_ADMIN)
  async setAllowedPositions(
    @Param('policyId') policyId: string,
    @Body() dto: { positions: string[] },
  ) {
    return this.leaveEligibilityService.setAllowedPositions(policyId, dto.positions);
  }

  /**
   * Bulk update eligibility rules for multiple policies
   */
  @Put('bulk-update')
  @Roles(Role.HR_ADMIN)
  async bulkUpdateEligibilityRules(
    @Body() dto: {
      updates: Array<{
        policyId: string;
        eligibilityRules: {
          minTenureMonths?: number;
          contractTypesAllowed?: string[];
          positionsAllowed?: string[];
        };
      }>;
    },
  ) {
    return this.leaveEligibilityService.bulkUpdateEligibilityRules(dto.updates);
  }

  /**
   * Clear all eligibility rules from a policy
   */
  @Delete('policy/:policyId/clear')
  @Roles(Role.HR_ADMIN)
  async clearEligibilityRules(@Param('policyId') policyId: string) {
    return this.leaveEligibilityService.clearEligibilityRules(policyId);
  }
}
