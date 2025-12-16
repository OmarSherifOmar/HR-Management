import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeaveEntitlement, LeaveEntitlementDocument } from '../models/leave-entitlement.schema';
import { LeavePolicy, LeavePolicyDocument } from '../models/leave-policy.schema';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';
import { LeaveAdjustment, LeaveAdjustmentDocument } from '../models/leave-adjustment.schema';
import { AccrualMethod } from '../enums/accrual-method.enum';
import { RoundingRule } from '../enums/rounding-rule.enum';
import { AdjustmentType } from '../enums/adjustment-type.enum';
import { EmployeeService } from '../../employee-profile/employee-profile.service';

/**
 * Leave Accrual Service
 * 
 * REQ-040: Automatic Leave Accrual
 * As an HR Manager, I want the system to automatically add leave days to each 
 * employee's balance according to company policy so that entitlements stay 
 * accurate without manual calculation.
 * 
 * REQ-041: Automatic Carry-Forward Processing
 * As an HR Manager, I want to year-end/period carry-forward to run automatically 
 * so that unused days move correctly within caps and expiry rules.
 */

export interface AccrualResult {
  employeeId: string;
  leaveTypeId: string;
  previousBalance: number;
  accruedAmount: number;
  newBalance: number;
  accrualMethod: AccrualMethod;
  lastAccrualDate: Date;
}

export interface CarryForwardResult {
  employeeId: string;
  leaveTypeId: string;
  previousRemaining: number;
  carryForwardAmount: number;
  expiredAmount: number;
  newCarryForward: number;
  expiryDate?: Date;
}

export interface BulkAccrualSummary {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  results: AccrualResult[];
  errors: Array<{ employeeId: string; error: string }>;
}

export interface BulkCarryForwardSummary {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  results: CarryForwardResult[];
  errors: Array<{ employeeId: string; error: string }>;
}

@Injectable()
export class LeaveAccrualService {
  constructor(
    @InjectModel(LeaveEntitlement.name) private entitlementModel: Model<LeaveEntitlementDocument>,
    @InjectModel(LeavePolicy.name) private policyModel: Model<LeavePolicyDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(LeaveAdjustment.name) private adjustmentModel: Model<LeaveAdjustmentDocument>,
    private employeeService: EmployeeService,
  ) {}

  // ==================== REQ-040: AUTOMATIC LEAVE ACCRUAL ====================

  /**
   * Calculate accrual amount for an employee based on policy and employment type
   */
  private calculateAccrualAmount(
    policy: LeavePolicyDocument,
    serviceDays: number,
    accrualMethod: AccrualMethod,
  ): number {
    let rawAmount = 0;

    switch (accrualMethod) {
      case AccrualMethod.MONTHLY:
        rawAmount = policy.monthlyRate;
        break;
      case AccrualMethod.YEARLY:
        // Pro-rate based on service days in the year
        rawAmount = (policy.yearlyRate / 365) * serviceDays;
        break;
      case AccrualMethod.PER_TERM:
        // Quarterly accrual
        rawAmount = policy.yearlyRate / 4;
        break;
      default:
        rawAmount = policy.monthlyRate;
    }

    // Apply rounding rule
    return this.applyRounding(rawAmount, policy.roundingRule);
  }

  /**
   * Apply rounding rules to accrued amount
   */
  private applyRounding(amount: number, rule: RoundingRule): number {
    switch (rule) {
      case RoundingRule.ROUND_UP:
        return Math.ceil(amount * 2) / 2; // Round up to nearest 0.5
      case RoundingRule.ROUND_DOWN:
        return Math.floor(amount * 2) / 2; // Round down to nearest 0.5
      case RoundingRule.ROUND:
        return Math.round(amount * 2) / 2; // Round to nearest 0.5
      case RoundingRule.NONE:
      default:
        return Math.round(amount * 100) / 100; // Keep 2 decimal places
    }
  }

  /**
   * Process accrual for a single employee's leave type
   */
  async processAccrualForEmployee(
    employeeId: string,
    leaveTypeId: string,
    serviceDays?: number,
  ): Promise<AccrualResult> {
    // Check if automatic entitlement creation is disabled
    const automaticEntitlementEnabled = process.env.AUTOMATIC_ENTITLEMENT_ENABLED !== 'false';
    
    // Get or create entitlement
    let entitlement = await this.entitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!entitlement) {
      if (!automaticEntitlementEnabled) {
        throw new BadRequestException(
          'Automatic entitlement creation is disabled. Entitlement must be created manually through Personalized Entitlements.'
        );
      }
      
      entitlement = new this.entitlementModel({
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

    // Get policy for this leave type
    const policy = await this.policyModel.findOne({
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!policy) {
      throw new NotFoundException(`No policy found for leave type ${leaveTypeId}`);
    }

    // Calculate service days if not provided (default to 30 for monthly)
    const effectiveServiceDays = serviceDays ?? 30;

    // Calculate accrual
    const previousBalance = entitlement.remaining;
    const accruedAmount = this.calculateAccrualAmount(
      policy,
      effectiveServiceDays,
      policy.accrualMethod,
    );

    // Update entitlement
    entitlement.accruedActual += accruedAmount;
    entitlement.accruedRounded = this.applyRounding(entitlement.accruedActual, policy.roundingRule);
    entitlement.remaining += accruedAmount;
    entitlement.lastAccrualDate = new Date();

    await entitlement.save();

    // Create adjustment record for audit
    await this.adjustmentModel.create({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      adjustmentType: AdjustmentType.ADD,
      amount: accruedAmount,
      reason: `[AUTO_ACCRUAL] ${policy.accrualMethod} accrual. Service days: ${effectiveServiceDays}`,
    });

    return {
      employeeId,
      leaveTypeId,
      previousBalance,
      accruedAmount,
      newBalance: entitlement.remaining,
      accrualMethod: policy.accrualMethod,
      lastAccrualDate: entitlement.lastAccrualDate,
    };
  }

  /**
   * REQ-040: Run automatic accrual for all employees for a specific leave type
   */
  async runBulkAccrual(
    leaveTypeId: string,
    options?: {
      employeeIds?: string[];
      serviceDaysMap?: Map<string, number>;
    },
  ): Promise<BulkAccrualSummary> {
    const results: AccrualResult[] = [];
    const errors: Array<{ employeeId: string; error: string }> = [];

    // Get all active employees or filter by provided IDs
    const employeeModel = this.employeeService['employeeModel'];
    const query: any = { isActive: true };
    if (options?.employeeIds?.length) {
      query._id = { $in: options.employeeIds.map((id) => new Types.ObjectId(id)) };
    }

    const employees = await employeeModel.find(query).select('_id').exec();

    for (const employee of employees) {
      try {
        const serviceDays = options?.serviceDaysMap?.get(employee._id.toString()) ?? 30;
        const result = await this.processAccrualForEmployee(
          employee._id.toString(),
          leaveTypeId,
          serviceDays,
        );
        results.push(result);
      } catch (error) {
        errors.push({
          employeeId: employee._id.toString(),
          error: error.message,
        });
      }
    }

    return {
      totalProcessed: employees.length,
      successCount: results.length,
      failedCount: errors.length,
      results,
      errors,
    };
  }

  /**
   * Run monthly accrual for all leave types configured for monthly accrual
   */
  async runMonthlyAccrualJob(): Promise<{
    leaveTypes: string[];
    summaries: BulkAccrualSummary[];
  }> {
    // Find all policies with monthly accrual
    const policies = await this.policyModel
      .find({ accrualMethod: AccrualMethod.MONTHLY })
      .populate('leaveTypeId', 'name code')
      .exec();

    const summaries: BulkAccrualSummary[] = [];
    const leaveTypes: string[] = [];

    for (const policy of policies) {
      leaveTypes.push(policy.leaveTypeId.toString());
      const summary = await this.runBulkAccrual(policy.leaveTypeId.toString());
      summaries.push(summary);
    }

    return { leaveTypes, summaries };
  }

  // ==================== REQ-041: AUTOMATIC CARRY-FORWARD PROCESSING ====================

  /**
   * Process carry-forward for a single employee's leave type
   */
  async processCarryForwardForEmployee(
    employeeId: string,
    leaveTypeId: string,
    fromYear: number,
    toYear: number,
  ): Promise<CarryForwardResult> {
    const entitlement = await this.entitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!entitlement) {
      throw new NotFoundException(`No entitlement found for employee ${employeeId}`);
    }

    const policy = await this.policyModel.findOne({
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!policy) {
      throw new NotFoundException(`No policy found for leave type ${leaveTypeId}`);
    }

    const previousRemaining = entitlement.remaining;

    // Check if carry-forward is allowed
    if (!policy.carryForwardAllowed) {
      // All remaining balance expires
      const expiredAmount = entitlement.remaining;
      entitlement.remaining = 0;
      entitlement.carryForward = 0;
      entitlement.accruedActual = 0;
      entitlement.accruedRounded = 0;
      entitlement.taken = 0;
      entitlement.pending = 0;
      await entitlement.save();

      // Record expired amount
      if (expiredAmount > 0) {
        await this.adjustmentModel.create({
          employeeId: new Types.ObjectId(employeeId),
          leaveTypeId: new Types.ObjectId(leaveTypeId),
          adjustmentType: AdjustmentType.DEDUCT,
          amount: expiredAmount,
          reason: `[YEAR_END_EXPIRY] Balance expired at year end ${fromYear}. Carry-forward not allowed.`,
        });
      }

      return {
        employeeId,
        leaveTypeId,
        previousRemaining,
        carryForwardAmount: 0,
        expiredAmount,
        newCarryForward: 0,
      };
    }

    // Calculate carry-forward amount (capped by maxCarryForward)
    const maxCarryForward = policy.maxCarryForward || 45; // Default 45 days as per requirement
    const carryForwardAmount = Math.min(entitlement.remaining, maxCarryForward);
    const expiredAmount = Math.max(0, entitlement.remaining - maxCarryForward);

    // Calculate expiry date (1-2 years from carry-forward as per requirement)
    const expiryMonths = policy.expiryAfterMonths || 12; // Default 12 months
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);

    // Reset entitlement for new year with carry-forward
    entitlement.carryForward = carryForwardAmount;
    entitlement.remaining = carryForwardAmount;
    entitlement.accruedActual = 0;
    entitlement.accruedRounded = 0;
    entitlement.taken = 0;
    entitlement.pending = 0;
    entitlement.nextResetDate = new Date(toYear + 1, 0, 1); // Next year's Jan 1

    await entitlement.save();

    // Record carry-forward
    if (carryForwardAmount > 0) {
      await this.adjustmentModel.create({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
        adjustmentType: AdjustmentType.ADD,
        amount: carryForwardAmount,
        reason: `[CARRY_FORWARD] ${carryForwardAmount} days carried from ${fromYear} to ${toYear}. Expires: ${expiryDate.toISOString().split('T')[0]}`,
      });
    }

    // Record expired amount if any
    if (expiredAmount > 0) {
      await this.adjustmentModel.create({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
        adjustmentType: AdjustmentType.DEDUCT,
        amount: expiredAmount,
        reason: `[CARRY_FORWARD_CAP] ${expiredAmount} days exceeded max carry-forward cap of ${maxCarryForward}. Amount forfeited.`,
      });
    }

    return {
      employeeId,
      leaveTypeId,
      previousRemaining,
      carryForwardAmount,
      expiredAmount,
      newCarryForward: carryForwardAmount,
      expiryDate,
    };
  }

  /**
   * REQ-041: Run automatic carry-forward for all employees for a specific leave type
   */
  async runBulkCarryForward(
    leaveTypeId: string,
    fromYear: number,
    toYear: number,
    employeeIds?: string[],
  ): Promise<BulkCarryForwardSummary> {
    const results: CarryForwardResult[] = [];
    const errors: Array<{ employeeId: string; error: string }> = [];

    // Get all active employees or filter by provided IDs
    const employeeModel = this.employeeService['employeeModel'];
    const query: any = { isActive: true };
    if (employeeIds?.length) {
      query._id = { $in: employeeIds.map((id) => new Types.ObjectId(id)) };
    }

    const employees = await employeeModel.find(query).select('_id').exec();

    for (const employee of employees) {
      try {
        const result = await this.processCarryForwardForEmployee(
          employee._id.toString(),
          leaveTypeId,
          fromYear,
          toYear,
        );
        results.push(result);
      } catch (error) {
        errors.push({
          employeeId: employee._id.toString(),
          error: error.message,
        });
      }
    }

    return {
      totalProcessed: employees.length,
      successCount: results.length,
      failedCount: errors.length,
      results,
      errors,
    };
  }

  /**
   * Run year-end carry-forward for all leave types that allow carry-forward
   */
  async runYearEndCarryForwardJob(
    fromYear: number,
    toYear: number,
  ): Promise<{
    leaveTypes: string[];
    summaries: BulkCarryForwardSummary[];
  }> {
    // Find all policies that allow carry-forward
    const policies = await this.policyModel
      .find({ carryForwardAllowed: true })
      .populate('leaveTypeId', 'name code')
      .exec();

    const summaries: BulkCarryForwardSummary[] = [];
    const leaveTypes: string[] = [];

    for (const policy of policies) {
      leaveTypes.push(policy.leaveTypeId.toString());
      const summary = await this.runBulkCarryForward(
        policy.leaveTypeId.toString(),
        fromYear,
        toYear,
      );
      summaries.push(summary);
    }

    return { leaveTypes, summaries };
  }

  /**
   * Process expired carry-forward balances
   * Should be run periodically to check and deduct expired carry-forward amounts
   */
  async processExpiredCarryForward(): Promise<{
    processed: number;
    expired: Array<{ employeeId: string; leaveTypeId: string; expiredAmount: number }>;
  }> {
    const today = new Date();
    const expired: Array<{ employeeId: string; leaveTypeId: string; expiredAmount: number }> = [];

    // Find entitlements with carry-forward that might have expired
    // This requires tracking expiry dates - for now, we check adjustments
    const recentCarryForwards = await this.adjustmentModel
      .find({
        reason: { $regex: /^\[CARRY_FORWARD\]/ },
        createdAt: { $lte: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()) },
      })
      .exec();

    // Note: A more robust implementation would store expiry dates in the entitlement
    // and check against those. For now, this is a simplified version.

    return {
      processed: recentCarryForwards.length,
      expired,
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get accrual status for an employee
   */
  async getAccrualStatus(
    employeeId: string,
    leaveTypeId?: string,
  ): Promise<{
    employeeId: string;
    entitlements: Array<{
      leaveTypeId: string;
      leaveTypeName: string;
      yearlyEntitlement: number;
      accruedActual: number;
      carryForward: number;
      remaining: number;
      lastAccrualDate?: Date;
      nextResetDate?: Date;
    }>;
  }> {
    const query: any = { employeeId: new Types.ObjectId(employeeId) };
    if (leaveTypeId) {
      query.leaveTypeId = new Types.ObjectId(leaveTypeId);
    }

    const entitlements = await this.entitlementModel
      .find(query)
      .populate('leaveTypeId', 'name code')
      .exec();

    return {
      employeeId,
      entitlements: entitlements.map((e) => ({
        leaveTypeId: e.leaveTypeId.toString(),
        leaveTypeName: (e.leaveTypeId as any)?.name || 'Unknown',
        yearlyEntitlement: e.yearlyEntitlement,
        accruedActual: e.accruedActual,
        carryForward: e.carryForward,
        remaining: e.remaining,
        lastAccrualDate: e.lastAccrualDate,
        nextResetDate: e.nextResetDate,
      })),
    };
  }

  /**
   * Preview carry-forward calculation without applying
   */
  async previewCarryForward(
    employeeId: string,
    leaveTypeId: string,
  ): Promise<{
    currentRemaining: number;
    maxCarryForward: number;
    projectedCarryForward: number;
    projectedExpiry: number;
    carryForwardAllowed: boolean;
    expiryMonths?: number;
  }> {
    const entitlement = await this.entitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    const policy = await this.policyModel.findOne({
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!entitlement || !policy) {
      throw new NotFoundException('Entitlement or policy not found');
    }

    const maxCarryForward = policy.maxCarryForward || 45;
    const projectedCarryForward = policy.carryForwardAllowed
      ? Math.min(entitlement.remaining, maxCarryForward)
      : 0;
    const projectedExpiry = policy.carryForwardAllowed
      ? Math.max(0, entitlement.remaining - maxCarryForward)
      : entitlement.remaining;

    return {
      currentRemaining: entitlement.remaining,
      maxCarryForward,
      projectedCarryForward,
      projectedExpiry,
      carryForwardAllowed: policy.carryForwardAllowed,
      expiryMonths: policy.expiryAfterMonths,
    };
  }
}
