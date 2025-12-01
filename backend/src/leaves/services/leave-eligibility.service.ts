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
}
