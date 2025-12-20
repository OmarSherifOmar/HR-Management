import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeaveEntitlement, LeaveEntitlementDocument } from '../models/leave-entitlement.schema';
import { LeaveAdjustment, LeaveAdjustmentDocument } from '../models/leave-adjustment.schema';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';
import { AdjustmentType } from '../enums/adjustment-type.enum';

/**
 * User Story 12: HR Admin Manual Balance Adjustments
 * 
 * As an HR Admin, I want to manually adjust employee leave balances 
 * (e.g., for corrections, carry-overs, or one-time grants) so that 
 * leave records are accurate.
 */

export enum AdjustmentReason {
  CORRECTION = 'correction',
  CARRY_OVER = 'carry_over',
  ONE_TIME_GRANT = 'one_time_grant',
  POLICY_CHANGE = 'policy_change',
  REINSTATEMENT = 'reinstatement',
  TRANSFER = 'transfer',
  ERROR_FIX = 'error_fix',
  ANNIVERSARY_BONUS = 'anniversary_bonus',
  MEDICAL_RESTORATION = 'medical_restoration',
  OTHER = 'other',
}

export interface BalanceAdjustmentInput {
  employeeId: string;
  leaveTypeId: string;
  adjustmentType: AdjustmentType;
  amount: number;
  reasonCategory: AdjustmentReason;
  description: string;
  effectiveDate?: Date;
  expiryDate?: Date;
}

export interface BulkAdjustmentInput {
  employeeIds: string[];
  leaveTypeId: string;
  adjustmentType: AdjustmentType;
  amount: number;
  reasonCategory: AdjustmentReason;
  description: string;
}

export interface CarryOverInput {
  employeeId: string;
  leaveTypeId: string;
  carryOverAmount: number;
  fromYear: number;
  toYear: number;
  expiryDate?: Date;
}

@Injectable()
export class BalanceAdjustmentService {
  constructor(
    @InjectModel(LeaveEntitlement.name) private leaveEntitlementModel: Model<LeaveEntitlementDocument>,
    @InjectModel(LeaveAdjustment.name) private leaveAdjustmentModel: Model<LeaveAdjustmentDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // MANUAL BALANCE ADJUSTMENT
  // ─────────────────────────────────────────────────────────────

  async adjustBalance(
    input: BalanceAdjustmentInput,
    hrUserId: string,
  ): Promise<{
    adjustment: LeaveAdjustmentDocument;
    entitlement: LeaveEntitlementDocument;
    previousBalance: number;
    newBalance: number;
  }> {
    // Validate leave type
    const leaveType = await this.leaveTypeModel.findById(input.leaveTypeId).exec();
    if (!leaveType) {
      throw new NotFoundException(`Leave type ${input.leaveTypeId} not found`);
    }

    // Validate amount
    if (input.amount <= 0) {
      throw new BadRequestException('Adjustment amount must be positive');
    }

    // Find or create entitlement
    let entitlement = await this.leaveEntitlementModel.findOne({
      employeeId: new Types.ObjectId(input.employeeId),
      leaveTypeId: new Types.ObjectId(input.leaveTypeId),
    }).exec();

    if (!entitlement) {
      entitlement = new this.leaveEntitlementModel({
        employeeId: new Types.ObjectId(input.employeeId),
        leaveTypeId: new Types.ObjectId(input.leaveTypeId),
        yearlyEntitlement: 0,
        accruedActual: 0,
        accruedRounded: 0,
        carryForward: 0,
        taken: 0,
        pending: 0,
        remaining: 0,
      });
    }

    const previousBalance = entitlement.remaining;

    // Apply adjustment based on type
    switch (input.adjustmentType) {
      case AdjustmentType.ADD:
        entitlement.remaining += input.amount;
        entitlement.accruedActual += input.amount;
        entitlement.accruedRounded += input.amount;
        break;
      case AdjustmentType.DEDUCT:
        if (entitlement.remaining < input.amount) {
          throw new BadRequestException(
            `Cannot deduct ${input.amount} days. Only ${entitlement.remaining} days remaining.`,
          );
        }
        entitlement.remaining -= input.amount;
        entitlement.accruedActual -= input.amount;
        entitlement.accruedRounded -= input.amount;
        break;
      case AdjustmentType.ENCASHMENT:
        if (entitlement.remaining < input.amount) {
          throw new BadRequestException(
            `Cannot encash ${input.amount} days. Only ${entitlement.remaining} days remaining.`,
          );
        }
        entitlement.remaining -= input.amount;
        break;
    }

    await entitlement.save();

    // Create adjustment record for audit
    const adjustment = new this.leaveAdjustmentModel({
      employeeId: new Types.ObjectId(input.employeeId),
      leaveTypeId: new Types.ObjectId(input.leaveTypeId),
      adjustmentType: input.adjustmentType,
      amount: input.amount,
      reason: `[${input.reasonCategory.toUpperCase()}] ${input.description}`,
      hrUserId: new Types.ObjectId(hrUserId),
    });
    await adjustment.save();

    return {
      adjustment,
      entitlement,
      previousBalance,
      newBalance: entitlement.remaining,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CORRECTION ADJUSTMENT
  // ─────────────────────────────────────────────────────────────

  async correctBalance(
    employeeId: string,
    leaveTypeId: string,
    correctBalance: number,
    description: string,
    hrUserId: string,
  ): Promise<{
    entitlement: LeaveEntitlementDocument;
    previousBalance: number;
    correctedBalance: number;
    adjustmentMade: number;
  }> {
    const entitlement = await this.leaveEntitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    }).exec();

    if (!entitlement) {
      throw new NotFoundException(`Entitlement not found for employee ${employeeId}`);
    }

    const previousBalance = entitlement.remaining;
    const adjustmentMade = correctBalance - previousBalance;

    entitlement.remaining = correctBalance;
    entitlement.accruedActual = correctBalance + entitlement.taken;
    entitlement.accruedRounded = correctBalance + entitlement.taken;
    await entitlement.save();

    // Create adjustment record
    const adjustment = new this.leaveAdjustmentModel({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      adjustmentType: adjustmentMade >= 0 ? AdjustmentType.ADD : AdjustmentType.DEDUCT,
      amount: Math.abs(adjustmentMade),
      reason: `[CORRECTION] ${description}. Balance corrected from ${previousBalance} to ${correctBalance}`,
      hrUserId: new Types.ObjectId(hrUserId),
    });
    await adjustment.save();

    return {
      entitlement,
      previousBalance,
      correctedBalance: correctBalance,
      adjustmentMade,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CARRY-OVER MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  async processCarryOver(
    input: CarryOverInput,
    hrUserId: string,
  ): Promise<{
    entitlement: LeaveEntitlementDocument;
    carryOverApplied: number;
  }> {
    let entitlement = await this.leaveEntitlementModel.findOne({
      employeeId: new Types.ObjectId(input.employeeId),
      leaveTypeId: new Types.ObjectId(input.leaveTypeId),
    }).exec();

    if (!entitlement) {
      entitlement = new this.leaveEntitlementModel({
        employeeId: new Types.ObjectId(input.employeeId),
        leaveTypeId: new Types.ObjectId(input.leaveTypeId),
        yearlyEntitlement: 0,
        accruedActual: 0,
        accruedRounded: 0,
        carryForward: 0,
        taken: 0,
        pending: 0,
        remaining: 0,
      });
    }

    // Add carry-over
    entitlement.carryForward += input.carryOverAmount;
    entitlement.remaining += input.carryOverAmount;
    await entitlement.save();

    // Create adjustment record
    const adjustment = new this.leaveAdjustmentModel({
      employeeId: new Types.ObjectId(input.employeeId),
      leaveTypeId: new Types.ObjectId(input.leaveTypeId),
      adjustmentType: AdjustmentType.ADD,
      amount: input.carryOverAmount,
      reason: `[CARRY_OVER] Carry-over from year ${input.fromYear} to ${input.toYear}. ${input.expiryDate ? `Expires: ${input.expiryDate.toISOString().split('T')[0]}` : 'No expiry'}`,
      hrUserId: new Types.ObjectId(hrUserId),
    });
    await adjustment.save();

    return {
      entitlement,
      carryOverApplied: input.carryOverAmount,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // ONE-TIME GRANT
  // ─────────────────────────────────────────────────────────────

  async grantOneTimeLeave(
    employeeId: string,
    leaveTypeId: string,
    grantAmount: number,
    reason: string,
    hrUserId: string,
    expiryDate?: Date,
  ): Promise<{
    entitlement: LeaveEntitlementDocument;
    grantApplied: number;
  }> {
    return this.adjustBalance(
      {
        employeeId,
        leaveTypeId,
        adjustmentType: AdjustmentType.ADD,
        amount: grantAmount,
        reasonCategory: AdjustmentReason.ONE_TIME_GRANT,
        description: `${reason}${expiryDate ? `. Expires: ${expiryDate.toISOString().split('T')[0]}` : ''}`,
      },
      hrUserId,
    ).then((result) => ({
      entitlement: result.entitlement,
      grantApplied: grantAmount,
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // BULK ADJUSTMENT
  // ─────────────────────────────────────────────────────────────

  async bulkAdjustBalances(
    input: BulkAdjustmentInput,
    hrUserId: string,
  ): Promise<{
    successful: Array<{ employeeId: string; newBalance: number }>;
    failed: Array<{ employeeId: string; error: string }>;
    summary: {
      totalProcessed: number;
      successCount: number;
      failedCount: number;
    };
  }> {
    const successful: Array<{ employeeId: string; newBalance: number }> = [];
    const failed: Array<{ employeeId: string; error: string }> = [];

    for (const employeeId of input.employeeIds) {
      try {
        const result = await this.adjustBalance(
          {
            employeeId,
            leaveTypeId: input.leaveTypeId,
            adjustmentType: input.adjustmentType,
            amount: input.amount,
            reasonCategory: input.reasonCategory,
            description: input.description,
          },
          hrUserId,
        );
        successful.push({
          employeeId,
          newBalance: result.newBalance,
        });
      } catch (error) {
        failed.push({
          employeeId,
          error: error.message,
        });
      }
    }

    return {
      successful,
      failed,
      summary: {
        totalProcessed: input.employeeIds.length,
        successCount: successful.length,
        failedCount: failed.length,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // ADJUSTMENT HISTORY & AUDIT
  // ─────────────────────────────────────────────────────────────

  async getAdjustmentHistory(
    employeeId: string,
    filters?: {
      leaveTypeId?: string;
      adjustmentType?: AdjustmentType;
      fromDate?: Date;
      toDate?: Date;
    },
  ): Promise<LeaveAdjustmentDocument[]> {
    const query: any = { employeeId: new Types.ObjectId(employeeId) };

    if (filters?.leaveTypeId) {
      query.leaveTypeId = new Types.ObjectId(filters.leaveTypeId);
    }
    if (filters?.adjustmentType) {
      query.adjustmentType = filters.adjustmentType;
    }
    if (filters?.fromDate || filters?.toDate) {
      query.createdAt = {};
      if (filters.fromDate) query.createdAt.$gte = filters.fromDate;
      if (filters.toDate) query.createdAt.$lte = filters.toDate;
    }

    return this.leaveAdjustmentModel
      .find(query)
      .populate('leaveTypeId')
      .populate('hrUserId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAdjustmentSummary(employeeId: string): Promise<{
    employeeId: string;
    totalAdjustments: number;
    totalAdded: number;
    totalDeducted: number;
    totalEncashed: number;
    adjustmentsByType: Record<string, number>;
    recentAdjustments: LeaveAdjustmentDocument[];
  }> {
    const adjustments = await this.leaveAdjustmentModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .populate('leaveTypeId')
      .exec();

    const summary = {
      employeeId,
      totalAdjustments: adjustments.length,
      totalAdded: 0,
      totalDeducted: 0,
      totalEncashed: 0,
      adjustmentsByType: {} as Record<string, number>,
      recentAdjustments: [] as LeaveAdjustmentDocument[],
    };

    adjustments.forEach((adj) => {
      switch (adj.adjustmentType) {
        case AdjustmentType.ADD:
          summary.totalAdded += adj.amount;
          break;
        case AdjustmentType.DEDUCT:
          summary.totalDeducted += adj.amount;
          break;
        case AdjustmentType.ENCASHMENT:
          summary.totalEncashed += adj.amount;
          break;
      }

      const typeKey = adj.adjustmentType;
      summary.adjustmentsByType[typeKey] = (summary.adjustmentsByType[typeKey] || 0) + adj.amount;
    });

    // Get recent 5 adjustments
    summary.recentAdjustments = await this.leaveAdjustmentModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .populate('leaveTypeId')
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    return summary;
  }

  // ─────────────────────────────────────────────────────────────
  // REVERSE ADJUSTMENT
  // ─────────────────────────────────────────────────────────────

  async reverseAdjustment(
    adjustmentId: string,
    reason: string,
    hrUserId: string,
  ): Promise<{
    reversalAdjustment: LeaveAdjustmentDocument;
    entitlement: LeaveEntitlementDocument;
  }> {
    const originalAdjustment = await this.leaveAdjustmentModel.findById(adjustmentId).exec();
    if (!originalAdjustment) {
      throw new NotFoundException(`Adjustment ${adjustmentId} not found`);
    }

    // Reverse the adjustment
    const reverseType =
      originalAdjustment.adjustmentType === AdjustmentType.ADD
        ? AdjustmentType.DEDUCT
        : AdjustmentType.ADD;

    const result = await this.adjustBalance(
      {
        employeeId: originalAdjustment.employeeId.toString(),
        leaveTypeId: originalAdjustment.leaveTypeId.toString(),
        adjustmentType: reverseType,
        amount: originalAdjustment.amount,
        reasonCategory: AdjustmentReason.ERROR_FIX,
        description: `Reversal of adjustment ${adjustmentId}. Reason: ${reason}`,
      },
      hrUserId,
    );

    return {
      reversalAdjustment: result.adjustment,
      entitlement: result.entitlement,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // GET CURRENT BALANCE
  // ─────────────────────────────────────────────────────────────

  async getCurrentBalance(
    employeeId: string,
    leaveTypeId: string,
  ): Promise<{
    employeeId: string;
    leaveTypeId: string;
    leaveTypeName: string;
    yearlyEntitlement: number;
    accruedActual: number;
    carryForward: number;
    taken: number;
    pending: number;
    remaining: number;
  }> {
    const entitlement = await this.leaveEntitlementModel
      .findOne({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
      })
      .populate('leaveTypeId')
      .exec();

    if (!entitlement) {
      throw new NotFoundException(`No entitlement found for employee ${employeeId}`);
    }

    return {
      employeeId,
      leaveTypeId,
      leaveTypeName: (entitlement.leaveTypeId as any)?.name || 'Unknown',
      yearlyEntitlement: entitlement.yearlyEntitlement,
      accruedActual: entitlement.accruedActual,
      carryForward: entitlement.carryForward,
      taken: entitlement.taken,
      pending: entitlement.pending,
      remaining: entitlement.remaining,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // GET ALL ADJUSTMENTS (AUDIT LOG)
  // ─────────────────────────────────────────────────────────────

  async getAllAdjustments(filters?: {
    fromDate?: Date;
    toDate?: Date;
  }): Promise<LeaveAdjustmentDocument[]> {
    const query: any = {};

    if (filters?.fromDate || filters?.toDate) {
      query.createdAt = {};
      if (filters.fromDate) {
        query.createdAt.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        query.createdAt.$lte = filters.toDate;
      }
    }

    return this.leaveAdjustmentModel
      .find(query)
      .populate('employeeId', 'firstName lastName employeeNumber')
      .populate('leaveTypeId', 'name code')
      .populate('hrUserId', 'firstName lastName employeeNumber')
      .sort({ createdAt: -1 })
      .exec();
  }
}
