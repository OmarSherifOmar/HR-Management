import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeavePolicy, LeavePolicyDocument } from '../models/leave-policy.schema';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';

/**
 * User Story 6: HR Admin Set Eligibility Rules
 * 
 * This service manages eligibility rules for leave types including:
 * - Minimum tenure requirements
 * - Employee type restrictions
 * - Position-based eligibility
 */
@Injectable()
export class LeaveEligibilityService {
  constructor(
    @InjectModel(LeavePolicy.name) private leavePolicyModel: Model<LeavePolicyDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
  ) {}

  /**
   * Set eligibility rules for a leave policy
   */
  async setEligibilityRules(
    policyId: string,
    eligibilityRules: {
      minTenureMonths?: number;
      contractTypesAllowed?: string[];
      positionsAllowed?: string[];
    },
  ): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    // Initialize eligibility object if it doesn't exist
    if (!policy.eligibility) {
      policy.eligibility = {};
    }

    // Update eligibility fields
    if (eligibilityRules.minTenureMonths !== undefined) {
      policy.eligibility.minTenureMonths = eligibilityRules.minTenureMonths;
    }
    if (eligibilityRules.contractTypesAllowed !== undefined) {
      policy.eligibility.contractTypesAllowed = eligibilityRules.contractTypesAllowed;
    }
    if (eligibilityRules.positionsAllowed !== undefined) {
      policy.eligibility.positionsAllowed = eligibilityRules.positionsAllowed;
    }

    policy.markModified('eligibility');
    return policy.save();
  }

  /**
   * Get eligibility rules for a leave policy
   */
  async getEligibilityRules(policyId: string): Promise<{
    policyId: string;
    leaveTypeId: string;
    eligibility: {
      minTenureMonths?: number;
      contractTypesAllowed?: string[];
      positionsAllowed?: string[];
    };
  }> {
    const policy = await this.leavePolicyModel
      .findById(policyId)
      .populate('leaveTypeId')
      .exec();

    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    return {
      policyId: policy._id.toString(),
      leaveTypeId: policy.leaveTypeId.toString(),
      eligibility: policy.eligibility || {},
    };
  }

  /**
   * Set minimum tenure requirement for a leave policy
   */
  async setMinTenureRequirement(
    policyId: string,
    minTenureMonths: number,
  ): Promise<LeavePolicyDocument> {
    if (minTenureMonths < 0) {
      throw new BadRequestException('Minimum tenure months cannot be negative');
    }

    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    if (!policy.eligibility) {
      policy.eligibility = {};
    }
    policy.eligibility.minTenureMonths = minTenureMonths;
    policy.markModified('eligibility');

    return policy.save();
  }

  /**
   * Set allowed contract types for a leave policy
   */
  async setAllowedContractTypes(
    policyId: string,
    contractTypes: string[],
  ): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    if (!policy.eligibility) {
      policy.eligibility = {};
    }
    policy.eligibility.contractTypesAllowed = contractTypes;
    policy.markModified('eligibility');

    return policy.save();
  }

  /**
   * Set allowed positions for a leave policy
   */
  async setAllowedPositions(
    policyId: string,
    positions: string[],
  ): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    if (!policy.eligibility) {
      policy.eligibility = {};
    }
    policy.eligibility.positionsAllowed = positions;
    policy.markModified('eligibility');

    return policy.save();
  }

  /**
   * Bulk update eligibility rules for multiple policies
   */
  async bulkUpdateEligibilityRules(
    updates: Array<{
      policyId: string;
      eligibilityRules: {
        minTenureMonths?: number;
        contractTypesAllowed?: string[];
        positionsAllowed?: string[];
      };
    }>,
  ): Promise<{ updated: number; failed: string[] }> {
    let updated = 0;
    const failed: string[] = [];

    for (const update of updates) {
      try {
        await this.setEligibilityRules(update.policyId, update.eligibilityRules);
        updated++;
      } catch (error) {
        failed.push(update.policyId);
      }
    }

    return { updated, failed };
  }

  /**
   * Remove all eligibility restrictions from a policy
   */
  async clearEligibilityRules(policyId: string): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    policy.eligibility = {};
    policy.markModified('eligibility');

    return policy.save();
  }

  /**
   * Get all policies with eligibility rules configured
   */
  async getPoliciesWithEligibilityRules(): Promise<
    Array<{
      policyId: string;
      leaveTypeName: string;
      eligibility: Record<string, any>;
    }>
  > {
    const policies = await this.leavePolicyModel
      .find({ 'eligibility.minTenureMonths': { $exists: true } })
      .populate('leaveTypeId')
      .exec();

    return policies.map((policy) => ({
      policyId: policy._id.toString(),
      leaveTypeName: (policy.leaveTypeId as any)?.name || 'Unknown',
      eligibility: policy.eligibility || {},
    }));
  }

  /**
   * Check if an employee is eligible for a specific leave type
   */
  async isEmployeeEligibleForLeaveType(
    employeeId: string,
    leaveTypeId: string,
    employee?: any,
  ): Promise<{ eligible: boolean; reason?: string }> {
    // Find the policy for this leave type
    const policy = await this.leavePolicyModel
      .findOne({ leaveTypeId: new Types.ObjectId(leaveTypeId) })
      .exec();

    // If no policy or no eligibility rules, employee is eligible by default
    if (!policy || !policy.eligibility) {
      console.log(`No policy or eligibility rules for leave type ${leaveTypeId} - eligible by default`);
      return { eligible: true };
    }

    const eligibility = policy.eligibility;

    // If no eligibility rules are set, employee is eligible
    if (
      !eligibility.minTenureMonths &&
      (!eligibility.contractTypesAllowed || eligibility.contractTypesAllowed.length === 0) &&
      (!eligibility.positionsAllowed || eligibility.positionsAllowed.length === 0)
    ) {
      console.log(`No eligibility restrictions set for leave type ${leaveTypeId} - eligible by default`);
      return { eligible: true };
    }

    // If employee data not provided, cannot verify eligibility - assume ineligible for safety
    if (!employee) {
      console.warn(`Employee data not provided for eligibility check - leave type ${leaveTypeId} marked as ineligible`);
      return { 
        eligible: false, 
        reason: 'Unable to verify eligibility - employee data unavailable' 
      };
    }

    console.log(`Checking eligibility for employee ${employeeId}, leave type ${leaveTypeId}`);
    console.log(`Eligibility rules:`, eligibility);
    console.log(`Employee data:`, {
      hireDate: employee.hireDate,
      contractType: employee.contractType || employee.employmentType,
      position: employee.position?.name || employee.position
    });

    // Check minimum tenure
    if (eligibility.minTenureMonths && eligibility.minTenureMonths > 0) {
      const hireDate = employee.hireDate ? new Date(employee.hireDate) : null;
      if (hireDate) {
        const monthsWorked = this.calculateMonthsWorked(hireDate);
        console.log(`Tenure check: ${monthsWorked} months worked vs ${eligibility.minTenureMonths} required`);
        if (monthsWorked < eligibility.minTenureMonths) {
          return {
            eligible: false,
            reason: `Requires minimum ${eligibility.minTenureMonths} months tenure (current: ${monthsWorked} months)`,
          };
        }
      }
    }

    // Check contract type
    if (eligibility.contractTypesAllowed && eligibility.contractTypesAllowed.length > 0) {
      const employeeContractType = employee.contractType || employee.employmentType;
      console.log(`Contract type check: ${employeeContractType} vs allowed:`, eligibility.contractTypesAllowed);
      if (employeeContractType && !eligibility.contractTypesAllowed.includes(employeeContractType)) {
        return {
          eligible: false,
          reason: `Contract type '${employeeContractType}' not allowed for this leave type`,
        };
      }
    }

    // Check position
    if (eligibility.positionsAllowed && eligibility.positionsAllowed.length > 0) {
      const employeePosition = employee.position?.name || employee.position;
      const employeePositionCode = employee.position?.code || '';
      
      console.log(`Position check: Employee position="${employeePosition}", code="${employeePositionCode}"`);
      console.log(`Allowed positions:`, eligibility.positionsAllowed);
      
      // Check if employee has a position
      if (!employeePosition) {
        return {
          eligible: false,
          reason: `No position assigned - this leave type requires specific positions`,
        };
      }
      
      // Check if position matches (exact match or partial match with code)
      const isAllowed = eligibility.positionsAllowed.some(allowedPos => {
        // Try exact match
        if (allowedPos === employeePosition) return true;
        
        // Try matching without parentheses (e.g., "Manager" matches "Manager (EF11)")
        const allowedPosBase = allowedPos.split('(')[0].trim();
        const employeePosBase = employeePosition.split('(')[0].trim();
        if (allowedPosBase === employeePosBase) return true;
        
        // Try matching with code in parentheses
        if (employeePositionCode && allowedPos.includes(`(${employeePositionCode})`)) return true;
        
        return false;
      });
      
      if (!isAllowed) {
        return {
          eligible: false,
          reason: `Position '${employeePosition}' not allowed for this leave type. Required: ${eligibility.positionsAllowed.join(', ')}`,
        };
      }
    }

    console.log(`Employee ${employeeId} is eligible for leave type ${leaveTypeId}`);
    return { eligible: true };
  }

  /**
   * Calculate months worked since hire date
   */
  private calculateMonthsWorked(hireDate: Date): number {
    const now = new Date();
    const months = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());
    return Math.max(0, months);
  }
}
