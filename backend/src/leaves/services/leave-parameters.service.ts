import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeavePolicy, LeavePolicyDocument } from '../models/leave-policy.schema';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';

/**
 * User Story 8: HR Admin Configure Leave Parameters
 * Input: Organizational Structure (for approval hierarchy)
 * 
 * This service manages leave parameters including:
 * - Maximum consecutive days
 * - Notice period requirements
 * - Approval workflow configuration
 * - Leave-specific business rules
 */
@Injectable()
export class LeaveParametersService {
  constructor(
    @InjectModel(LeavePolicy.name) private leavePolicyModel: Model<LeavePolicyDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
  ) {}

  /**
   * Configure maximum consecutive days for a leave policy
   */
  async configureMaxConsecutiveDays(
    policyId: string,
    maxConsecutiveDays: number,
  ): Promise<LeavePolicyDocument> {
    if (maxConsecutiveDays <= 0) {
      throw new BadRequestException('Maximum consecutive days must be positive');
    }

    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    policy.maxConsecutiveDays = maxConsecutiveDays;
    return policy.save();
  }

  /**
   * Configure minimum notice days required for a leave request
   */
  async configureMinNoticeDays(
    policyId: string,
    minNoticeDays: number,
  ): Promise<LeavePolicyDocument> {
    if (minNoticeDays < 0) {
      throw new BadRequestException('Minimum notice days cannot be negative');
    }

    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    policy.minNoticeDays = minNoticeDays;
    return policy.save();
  }

  /**
   * Configure both max consecutive days and notice period
   */
  async configureLeaveParameters(
    policyId: string,
    params: {
      maxConsecutiveDays?: number;
      minNoticeDays?: number;
    },
  ): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    if (params.maxConsecutiveDays !== undefined) {
      if (params.maxConsecutiveDays <= 0) {
        throw new BadRequestException('Maximum consecutive days must be positive');
      }
      policy.maxConsecutiveDays = params.maxConsecutiveDays;
    }

    if (params.minNoticeDays !== undefined) {
      if (params.minNoticeDays < 0) {
        throw new BadRequestException('Minimum notice days cannot be negative');
      }
      policy.minNoticeDays = params.minNoticeDays;
    }

    return policy.save();
  }

  /**
   * Get leave parameters for a policy
   */
  async getLeaveParameters(policyId: string): Promise<{
    policyId: string;
    leaveTypeId: string;
    leaveTypeName: string;
    maxConsecutiveDays?: number;
    minNoticeDays: number;
    accrualMethod: string;
    carryForwardAllowed: boolean;
    maxCarryForward: number;
    expiryAfterMonths?: number;
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
      leaveTypeName: (policy.leaveTypeId as any)?.name || 'Unknown',
      maxConsecutiveDays: policy.maxConsecutiveDays,
      minNoticeDays: policy.minNoticeDays,
      accrualMethod: policy.accrualMethod,
      carryForwardAllowed: policy.carryForwardAllowed,
      maxCarryForward: policy.maxCarryForward,
      expiryAfterMonths: policy.expiryAfterMonths,
    };
  }

  /**
   * Get all leave parameters summary
   */
  async getAllLeaveParametersSummary(): Promise<
    Array<{
      policyId: string;
      leaveTypeName: string;
      maxConsecutiveDays?: number;
      minNoticeDays: number;
      carryForwardAllowed: boolean;
    }>
  > {
    const policies = await this.leavePolicyModel
      .find()
      .populate('leaveTypeId')
      .exec();

    return policies.map((policy) => ({
      policyId: policy._id.toString(),
      leaveTypeName: (policy.leaveTypeId as any)?.name || 'Unknown',
      maxConsecutiveDays: policy.maxConsecutiveDays,
      minNoticeDays: policy.minNoticeDays,
      carryForwardAllowed: policy.carryForwardAllowed,
    }));
  }

  /**
   * Validate leave request against policy parameters
   * Can be used before submitting a leave request
   */
  async validateLeaveRequest(
    leaveTypeId: string,
    requestedDays: number,
    requestDate: Date,
    startDate: Date,
  ): Promise<{
    isValid: boolean;
    violations: string[];
    warnings: string[];
  }> {
    const policy = await this.leavePolicyModel
      .findOne({ leaveTypeId: new Types.ObjectId(leaveTypeId) })
      .exec();

    if (!policy) {
      return {
        isValid: false,
        violations: ['No policy configured for this leave type'],
        warnings: [],
      };
    }

    const violations: string[] = [];
    const warnings: string[] = [];

    // Check maximum consecutive days
    if (policy.maxConsecutiveDays && requestedDays > policy.maxConsecutiveDays) {
      violations.push(
        `Requested days (${requestedDays}) exceeds maximum consecutive days allowed (${policy.maxConsecutiveDays})`,
      );
    }

    // Check minimum notice period
    const daysDifference = Math.floor(
      (startDate.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDifference < policy.minNoticeDays) {
      violations.push(
        `Notice period (${daysDifference} days) is less than required minimum (${policy.minNoticeDays} days)`,
      );
    }

    // Add warnings for edge cases
    if (policy.maxConsecutiveDays && requestedDays >= policy.maxConsecutiveDays * 0.8) {
      warnings.push('Requested days is close to the maximum limit');
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings,
    };
  }

  /**
   * Configure approval workflow settings
   * This stores approval levels and requirements in policy eligibility
   */
  async configureApprovalWorkflow(
    policyId: string,
    approvalConfig: {
      requiresSupervisorApproval: boolean;
      requiresHRApproval: boolean;
      autoApproveUnderDays?: number;
      approvalLevels?: number;
    },
  ): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    if (!policy.eligibility) {
      policy.eligibility = {};
    }

    // Store approval workflow config in eligibility object
    policy.eligibility.approvalWorkflow = {
      requiresSupervisorApproval: approvalConfig.requiresSupervisorApproval,
      requiresHRApproval: approvalConfig.requiresHRApproval,
      autoApproveUnderDays: approvalConfig.autoApproveUnderDays,
      approvalLevels: approvalConfig.approvalLevels || 1,
    };

    policy.markModified('eligibility');
    return policy.save();
  }

  /**
   * Get approval workflow configuration for a policy
   */
  async getApprovalWorkflow(policyId: string): Promise<{
    policyId: string;
    leaveTypeName: string;
    approvalWorkflow: {
      requiresSupervisorApproval: boolean;
      requiresHRApproval: boolean;
      autoApproveUnderDays?: number;
      approvalLevels: number;
    };
  }> {
    const policy = await this.leavePolicyModel
      .findById(policyId)
      .populate('leaveTypeId')
      .exec();

    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    const defaultWorkflow = {
      requiresSupervisorApproval: true,
      requiresHRApproval: false,
      autoApproveUnderDays: undefined,
      approvalLevels: 1,
    };

    return {
      policyId: policy._id.toString(),
      leaveTypeName: (policy.leaveTypeId as any)?.name || 'Unknown',
      approvalWorkflow: policy.eligibility?.approvalWorkflow || defaultWorkflow,
    };
  }

  /**
   * Bulk update parameters for multiple policies
   */
  async bulkUpdateParameters(
    updates: Array<{
      policyId: string;
      maxConsecutiveDays?: number;
      minNoticeDays?: number;
    }>,
  ): Promise<{ updated: number; failed: string[] }> {
    let updated = 0;
    const failed: string[] = [];

    for (const update of updates) {
      try {
        await this.configureLeaveParameters(update.policyId, {
          maxConsecutiveDays: update.maxConsecutiveDays,
          minNoticeDays: update.minNoticeDays,
        });
        updated++;
      } catch (error) {
        failed.push(update.policyId);
      }
    }

    return { updated, failed };
  }

  /**
   * Get policies requiring advance notice
   */
  async getPoliciesRequiringNotice(): Promise<
    Array<{
      policyId: string;
      leaveTypeName: string;
      minNoticeDays: number;
    }>
  > {
    const policies = await this.leavePolicyModel
      .find({ minNoticeDays: { $gt: 0 } })
      .populate('leaveTypeId')
      .exec();

    return policies.map((policy) => ({
      policyId: policy._id.toString(),
      leaveTypeName: (policy.leaveTypeId as any)?.name || 'Unknown',
      minNoticeDays: policy.minNoticeDays,
    }));
  }

  /**
   * Get policies with consecutive day limits
   */
  async getPoliciesWithDayLimits(): Promise<
    Array<{
      policyId: string;
      leaveTypeName: string;
      maxConsecutiveDays: number;
    }>
  > {
    const policies = await this.leavePolicyModel
      .find({ maxConsecutiveDays: { $exists: true, $gt: 0 } })
      .populate('leaveTypeId')
      .exec();

    return policies.map((policy) => ({
      policyId: policy._id.toString(),
      leaveTypeName: (policy.leaveTypeId as any)?.name || 'Unknown',
      maxConsecutiveDays: policy.maxConsecutiveDays!,
    }));
  }
}
