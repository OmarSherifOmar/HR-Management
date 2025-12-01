import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeaveEntitlement, LeaveEntitlementDocument } from '../models/leave-entitlement.schema';
import { LeaveAdjustment, LeaveAdjustmentDocument } from '../models/leave-adjustment.schema';
import { LeavePolicy, LeavePolicyDocument } from '../models/leave-policy.schema';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';
import { AdjustmentType } from '../enums/adjustment-type.enum';

/**
 * User Story 7: HR Admin Assign Personalized Leave Entitlements
 * 
 * This service manages personalized entitlements including:
 * - Individual entitlement overrides
 * - Group-based entitlements
 * - Leave adjustments for special circumstances
 * - Custom allocations based on contract agreements
 */
@Injectable()
export class PersonalizedEntitlementService {
  constructor(
    @InjectModel(LeaveEntitlement.name) private leaveEntitlementModel: Model<LeaveEntitlementDocument>,
    @InjectModel(LeaveAdjustment.name) private leaveAdjustmentModel: Model<LeaveAdjustmentDocument>,
    @InjectModel(LeavePolicy.name) private leavePolicyModel: Model<LeavePolicyDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
  ) {}

  /**
   * Assign personalized yearly entitlement to an employee
   * Overrides the default policy-based entitlement
   */
  async assignPersonalizedEntitlement(
    employeeId: string,
    leaveTypeId: string,
    yearlyEntitlement: number,
    hrUserId: string,
    reason?: string,
  ): Promise<LeaveEntitlementDocument> {
    // Verify leave type exists
    const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${leaveTypeId} not found`);
    }

    // Find or create entitlement record
    let entitlement = await this.leaveEntitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!entitlement) {
      entitlement = new this.leaveEntitlementModel({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
        yearlyEntitlement,
        accruedActual: 0,
        accruedRounded: 0,
        carryForward: 0,
        taken: 0,
        pending: 0,
        remaining: yearlyEntitlement,
      });
    } else {
      const difference = yearlyEntitlement - entitlement.yearlyEntitlement;
      entitlement.yearlyEntitlement = yearlyEntitlement;
      entitlement.remaining = entitlement.remaining + difference;
    }

    await entitlement.save();

    // Create adjustment record for audit trail
    if (reason) {
      const adjustment = new this.leaveAdjustmentModel({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
        adjustmentType: AdjustmentType.ADD,
        amount: yearlyEntitlement,
        reason: `Personalized entitlement: ${reason}`,
        hrUserId: new Types.ObjectId(hrUserId),
      });
      await adjustment.save();
    }

    return entitlement;
  }

  /**
   * Get entitlements by employee ID
   */
  async getEntitlementsByEmployeeId(employeeId: string): Promise<LeaveEntitlementDocument[]> {
    return this.leaveEntitlementModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .populate('leaveTypeId')
      .exec();
  }

  /**
   * Add leave adjustment for an employee (bonus days, special allocation)
   */
  async addLeaveAdjustment(
    employeeId: string,
    leaveTypeId: string,
    adjustmentType: AdjustmentType,
    amount: number,
    reason: string,
    hrUserId: string,
  ): Promise<{
    adjustment: LeaveAdjustmentDocument;
    updatedEntitlement: LeaveEntitlementDocument;
  }> {
    // Verify leave type exists
    const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${leaveTypeId} not found`);
    }

    if (amount <= 0) {
      throw new BadRequestException('Adjustment amount must be positive');
    }

    // Find or create entitlement
    let entitlement = await this.leaveEntitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!entitlement) {
      // Create default entitlement if it doesn't exist
      entitlement = new this.leaveEntitlementModel({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
        yearlyEntitlement: 0,
        accruedActual: 0,
        accruedRounded: 0,
        carryForward: 0,
        taken: 0,
        pending: 0,
        remaining: 0,
      });
    }

    // Apply adjustment
    if (adjustmentType === AdjustmentType.ADD) {
      entitlement.remaining += amount;
      entitlement.accruedActual += amount;
      entitlement.accruedRounded += amount;
    } else if (adjustmentType === AdjustmentType.DEDUCT) {
      if (entitlement.remaining < amount) {
        throw new BadRequestException(
          `Cannot deduct ${amount} days. Only ${entitlement.remaining} days remaining`,
        );
      }
      entitlement.remaining -= amount;
      entitlement.accruedActual -= amount;
      entitlement.accruedRounded -= amount;
    } else if (adjustmentType === AdjustmentType.ENCASHMENT) {
      if (entitlement.remaining < amount) {
        throw new BadRequestException(
          `Cannot encash ${amount} days. Only ${entitlement.remaining} days remaining`,
        );
      }
      entitlement.remaining -= amount;
    }

    await entitlement.save();

    // Create adjustment record
    const adjustment = new this.leaveAdjustmentModel({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      adjustmentType,
      amount,
      reason,
      hrUserId: new Types.ObjectId(hrUserId),
    });
    await adjustment.save();

    return {
      adjustment,
      updatedEntitlement: entitlement,
    };
  }

  /**
   * Get adjustment history for an employee
   */
  async getAdjustmentHistory(
    employeeId: string,
    leaveTypeId?: string,
  ): Promise<LeaveAdjustmentDocument[]> {
    const filter: any = { employeeId: new Types.ObjectId(employeeId) };
    if (leaveTypeId) {
      filter.leaveTypeId = new Types.ObjectId(leaveTypeId);
    }

    return this.leaveAdjustmentModel
      .find(filter)
      .populate('leaveTypeId')
      .populate('hrUserId')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Bulk assign entitlements to multiple employees
   * Useful for group-based entitlement assignments
   */
  async bulkAssignEntitlements(
    employeeIds: string[],
    leaveTypeId: string,
    yearlyEntitlement: number,
    hrUserId: string,
    reason: string,
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const employeeId of employeeIds) {
      try {
        await this.assignPersonalizedEntitlement(
          employeeId,
          leaveTypeId,
          yearlyEntitlement,
          hrUserId,
          reason,
        );
        success.push(employeeId);
      } catch (error) {
        failed.push(employeeId);
      }
    }

    return { success, failed };
  }

  /**
   * Reset entitlement to policy default
   */
  async resetToDefaultEntitlement(
    employeeId: string,
    leaveTypeId: string,
    hrUserId: string,
  ): Promise<LeaveEntitlementDocument> {
    const policy = await this.leavePolicyModel.findOne({
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!policy) {
      throw new NotFoundException(`Leave policy for leave type ${leaveTypeId} not found`);
    }

    const defaultEntitlement = policy.yearlyRate;

    const entitlement = await this.leaveEntitlementModel.findOneAndUpdate(
      {
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
      },
      {
        yearlyEntitlement: defaultEntitlement,
        remaining: defaultEntitlement - (await this.getTakenLeave(employeeId, leaveTypeId)),
      },
      { new: true },
    );

    if (!entitlement) {
      throw new NotFoundException(`Entitlement not found for employee ${employeeId}`);
    }

    // Create adjustment record
    const adjustment = new this.leaveAdjustmentModel({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      adjustmentType: AdjustmentType.ADD,
      amount: defaultEntitlement,
      reason: 'Reset to policy default entitlement',
      hrUserId: new Types.ObjectId(hrUserId),
    });
    await adjustment.save();

    return entitlement;
  }

  /**
   * Helper to get taken leave
   */
  private async getTakenLeave(employeeId: string, leaveTypeId: string): Promise<number> {
    const entitlement = await this.leaveEntitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });
    return entitlement?.taken || 0;
  }

  /**
   * Get entitlement summary by employee ID
   */
  async getEntitlementSummary(employeeId: string): Promise<{
    employeeId: string;
    entitlements: Array<{
      leaveTypeName: string;
      yearlyEntitlement: number;
      accruedActual: number;
      taken: number;
      pending: number;
      remaining: number;
      carryForward: number;
    }>;
    totalAdjustments: number;
  }> {
    const entitlements = await this.leaveEntitlementModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .populate('leaveTypeId')
      .exec();

    const adjustmentCount = await this.leaveAdjustmentModel.countDocuments({
      employeeId: new Types.ObjectId(employeeId),
    });

    return {
      employeeId,
      entitlements: entitlements.map((e) => ({
        leaveTypeName: (e.leaveTypeId as any)?.name || 'Unknown',
        yearlyEntitlement: e.yearlyEntitlement,
        accruedActual: e.accruedActual,
        taken: e.taken,
        pending: e.pending,
        remaining: e.remaining,
        carryForward: e.carryForward,
      })),
      totalAdjustments: adjustmentCount,
    };
  }
}
