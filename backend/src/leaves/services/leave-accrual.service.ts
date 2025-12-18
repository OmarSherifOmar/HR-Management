import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
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
 * Leave Accrual Service - State-Driven Model
 * 
 * REQ-040: Automatic Leave Accrual
 * As an HR Manager, I want the system to automatically add leave days to each 
 * employee's balance according to company policy so that entitlements stay 
 * accurate without manual calculation.
 * 
 * REQ-041: Automatic Carry-Forward Processing
 * As an HR Manager, I want to year-end/period carry-forward to run automatically 
 * so that unused days move correctly within caps and expiry rules.
 * 
 * Architecture: State-driven, idempotent accrual
 * - No cron jobs or time-based triggers
 * - Accruals calculated on-demand when entitlements are accessed
 * - ensureEntitlementUpToDate() applies missed accruals and carry-forwards
 * - Safe to call multiple times (idempotent)
 */

interface AccrualPeriod {
  startDate: Date;
  endDate: Date;
  type: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
}

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
  private readonly logger = new Logger(LeaveAccrualService.name);

  constructor(
    @InjectModel(LeaveEntitlement.name) private entitlementModel: Model<LeaveEntitlementDocument>,
    @InjectModel(LeavePolicy.name) private policyModel: Model<LeavePolicyDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(LeaveAdjustment.name) private adjustmentModel: Model<LeaveAdjustmentDocument>,
    private employeeService: EmployeeService,
  ) {}

  // ==================== STATE-DRIVEN ACCRUAL CORE ====================

  /**
   * Centralized method to ensure an entitlement is up-to-date.
   * Applies any missed accruals and carry-forwards based on state.
   * IDEMPOTENT: Safe to call multiple times.
   */
  async ensureEntitlementUpToDate(
    entitlement: LeaveEntitlementDocument,
    policy: LeavePolicyDocument,
  ): Promise<void> {
    const now = new Date();

    // Step 1: Check if year-end carry-forward is needed
    if (this.shouldApplyCarryForward(entitlement.nextResetDate, now)) {
      await this.applyYearEndCarryForward(entitlement, policy, now);
    }

    // Step 2: Apply any missed accrual periods
    const periods = this.calculateAccrualPeriods(
      entitlement.lastAccrualDate,
      now,
      policy.accrualMethod,
    );

    for (const period of periods) {
      await this.applyAccrualPeriod(entitlement, policy, period);
    }

    // Step 3: Process expired carry-forward if applicable
    if (entitlement.carryForward > 0 && (entitlement as any).carryForwardExpiry) {
      await this.processCarryForwardExpiry(entitlement, now);
    }
  }

  /**
   * Calculate accrual periods that need to be applied
   * Returns empty array if no accruals are due
   */
  private calculateAccrualPeriods(
    lastAccrualDate: Date | undefined,
    now: Date,
    accrualMethod: AccrualMethod,
  ): AccrualPeriod[] {
    const periods: AccrualPeriod[] = [];

    if (accrualMethod === AccrualMethod.MONTHLY) {
      // Start from the month after last accrual (or current month if never accrued)
      const startDate = lastAccrualDate
        ? new Date(lastAccrualDate.getFullYear(), lastAccrualDate.getMonth() + 1, 1)
        : new Date(now.getFullYear(), now.getMonth(), 1);

      // Generate periods for each month up to current month
      let periodStart = new Date(startDate);
      while (periodStart <= now) {
        const monthEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
        
        // Only include if the period has started
        if (periodStart <= now) {
          periods.push({
            startDate: new Date(periodStart),
            endDate: monthEnd <= now ? monthEnd : now,
            type: 'MONTHLY',
          });
        }

        periodStart = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1);
      }
    } else if (accrualMethod === AccrualMethod.PER_TERM) {
      // Quarterly accrual
      const startDate = lastAccrualDate || new Date(now.getFullYear(), 0, 1);
      let quarterStart = this.getQuarterStart(startDate);
      
      if (lastAccrualDate) {
        quarterStart = this.getNextQuarterStart(lastAccrualDate);
      }

      while (quarterStart <= now) {
        const quarterEnd = this.getQuarterEnd(quarterStart);
        periods.push({
          startDate: new Date(quarterStart),
          endDate: quarterEnd <= now ? quarterEnd : now,
          type: 'QUARTERLY',
        });
        quarterStart = this.getNextQuarterStart(quarterStart);
      }
    } else if (accrualMethod === AccrualMethod.YEARLY) {
      // Annual accrual on anniversary
      if (!lastAccrualDate) {
        periods.push({
          startDate: new Date(now.getFullYear(), 0, 1),
          endDate: now,
          type: 'YEARLY',
        });
      } else {
        const nextAnniversary = new Date(
          now.getFullYear(),
          lastAccrualDate.getMonth(),
          lastAccrualDate.getDate(),
        );
        if (nextAnniversary > lastAccrualDate && nextAnniversary <= now) {
          periods.push({
            startDate: nextAnniversary,
            endDate: now,
            type: 'YEARLY',
          });
        }
      }
    }

    return periods;
  }

  /**
   * Check if carry-forward should be applied based on nextResetDate
   */
  private shouldApplyCarryForward(nextResetDate: Date | undefined, now: Date): boolean {
    if (!nextResetDate) {
      // Initialize nextResetDate to next Jan 1 if not set
      return false;
    }
    return nextResetDate <= now;
  }

  /**
   * Apply a single accrual period to an entitlement
   */
  private async applyAccrualPeriod(
    entitlement: LeaveEntitlementDocument,
    policy: LeavePolicyDocument,
    period: AccrualPeriod,
  ): Promise<void> {
    // Calculate service days for the period (default to full period)
    const serviceDays = this.calculateServiceDays(period.startDate, period.endDate);

    const accruedAmount = this.calculateAccrualAmount(
      policy,
      serviceDays,
      policy.accrualMethod,
      entitlement.yearlyEntitlement,
    );

    if (accruedAmount <= 0) {
      this.logger.debug(
        `[Accrual] No accrual for period ${period.startDate.toISOString()} - ${period.endDate.toISOString()}`,
      );
      return;
    }

    // Update entitlement
    entitlement.accruedActual = (entitlement.accruedActual || 0) + accruedAmount;
    entitlement.accruedRounded = this.applyRounding(entitlement.accruedActual, policy.roundingRule);
    
    // Recalculate remaining: carryForward + accruedRounded - taken - pending
    entitlement.remaining = Math.max(
      0,
      (entitlement.carryForward || 0) +
        entitlement.accruedRounded -
        (entitlement.taken || 0) -
        (entitlement.pending || 0),
    );

    entitlement.lastAccrualDate = period.endDate;

    await entitlement.save();

    // Create audit record
    await this.adjustmentModel.create({
      employeeId: entitlement.employeeId,
      leaveTypeId: entitlement.leaveTypeId,
      adjustmentType: AdjustmentType.ADD,
      amount: accruedAmount,
      reason: `[AUTO_ACCRUAL] ${policy.accrualMethod} accrual for period ${period.startDate.toISOString().split('T')[0]} to ${period.endDate.toISOString().split('T')[0]}`,
    });

    this.logger.log(
      `[Accrual] Applied ${accruedAmount} days for employee ${entitlement.employeeId}`,
    );
  }

  /**
   * Apply year-end carry-forward and reset entitlement
   */
  private async applyYearEndCarryForward(
    entitlement: LeaveEntitlementDocument,
    policy: LeavePolicyDocument,
    now: Date,
  ): Promise<void> {
    const previousRemaining = entitlement.remaining;

    if (!policy.carryForwardAllowed) {
      // All balance expires
      const expiredAmount = entitlement.remaining;

      entitlement.remaining = 0;
      entitlement.carryForward = 0;
      entitlement.accruedActual = 0;
      entitlement.accruedRounded = 0;
      entitlement.taken = 0;
      entitlement.pending = 0;
      entitlement.nextResetDate = new Date(now.getFullYear() + 1, 0, 1);

      await entitlement.save();

      if (expiredAmount > 0) {
        await this.adjustmentModel.create({
          employeeId: entitlement.employeeId,
          leaveTypeId: entitlement.leaveTypeId,
          adjustmentType: AdjustmentType.DEDUCT,
          amount: expiredAmount,
          reason: `[YEAR_END_EXPIRY] Balance expired. Carry-forward not allowed.`,
        });
      }

      this.logger.log(
        `[CarryForward] Expired ${expiredAmount} days (no carry-forward) for employee ${entitlement.employeeId}`,
      );
      return;
    }

    // Apply carry-forward with cap
    const maxCarryForward = policy.maxCarryForward || 45;
    const carryForwardAmount = Math.min(previousRemaining, maxCarryForward);
    const expiredAmount = Math.max(0, previousRemaining - maxCarryForward);

    // Calculate expiry date
    const expiryMonths = policy.expiryAfterMonths || 12;
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);

    // Reset for new year
    entitlement.carryForward = carryForwardAmount;
    entitlement.remaining = carryForwardAmount;
    entitlement.accruedActual = 0;
    entitlement.accruedRounded = 0;
    entitlement.taken = 0;
    entitlement.pending = 0;
    entitlement.nextResetDate = new Date(now.getFullYear() + 1, 0, 1);
    (entitlement as any).carryForwardExpiry = expiryDate;

    await entitlement.save();

    // Record carry-forward
    if (carryForwardAmount > 0) {
      await this.adjustmentModel.create({
        employeeId: entitlement.employeeId,
        leaveTypeId: entitlement.leaveTypeId,
        adjustmentType: AdjustmentType.ADD,
        amount: carryForwardAmount,
        reason: `[CARRY_FORWARD] ${carryForwardAmount} days carried forward. Expires: ${expiryDate.toISOString().split('T')[0]}`,
      });
    }

    // Record expiry
    if (expiredAmount > 0) {
      await this.adjustmentModel.create({
        employeeId: entitlement.employeeId,
        leaveTypeId: entitlement.leaveTypeId,
        adjustmentType: AdjustmentType.DEDUCT,
        amount: expiredAmount,
        reason: `[CARRY_FORWARD_CAP] ${expiredAmount} days exceeded cap of ${maxCarryForward}`,
      });
    }

    this.logger.log(
      `[CarryForward] Applied ${carryForwardAmount} days, expired ${expiredAmount} for employee ${entitlement.employeeId}`,
    );
  }

  /**
   * Process carry-forward expiry if due
   */
  private async processCarryForwardExpiry(
    entitlement: LeaveEntitlementDocument,
    now: Date,
  ): Promise<void> {
    const expiryDate = (entitlement as any).carryForwardExpiry as Date;
    if (!expiryDate || expiryDate > now) {
      return;
    }

    const expiredAmount = entitlement.carryForward;
    if (expiredAmount <= 0) {
      return;
    }

    entitlement.carryForward = 0;
    entitlement.remaining = Math.max(0, entitlement.remaining - expiredAmount);
    (entitlement as any).carryForwardExpiry = undefined;

    await entitlement.save();

    await this.adjustmentModel.create({
      employeeId: entitlement.employeeId,
      leaveTypeId: entitlement.leaveTypeId,
      adjustmentType: AdjustmentType.DEDUCT,
      amount: expiredAmount,
      reason: `[CARRY_FORWARD_EXPIRY] ${expiredAmount} days expired on ${now.toISOString().split('T')[0]}`,
    });

    this.logger.log(`[Expiry] Expired ${expiredAmount} carry-forward days for employee ${entitlement.employeeId}`);
  }

  // ==================== DATE HELPER FUNCTIONS ====================

  private calculateServiceDays(startDate: Date, endDate: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
  }

  private getQuarterStart(date: Date): Date {
    const quarter = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), quarter * 3, 1);
  }

  private getQuarterEnd(quarterStart: Date): Date {
    return new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
  }

  private getNextQuarterStart(date: Date): Date {
    const currentQuarter = this.getQuarterStart(date);
    return new Date(currentQuarter.getFullYear(), currentQuarter.getMonth() + 3, 1);
  }

  // ==================== EXISTING CALCULATION METHODS (Preserved) ====================

  // ==================== EXISTING CALCULATION METHODS (Preserved) ====================

  /**
   * Calculate accrual amount for an employee based on policy and employment type
   * Now uses the entitlement's yearlyEntitlement as the source of truth
   */
  private calculateAccrualAmount(
    policy: LeavePolicyDocument,
    serviceDays: number,
    accrualMethod: AccrualMethod,
    yearlyEntitlement?: number,
  ): number {
    let rawAmount = 0;

    // Use yearlyEntitlement if provided, otherwise fall back to policy rates
    const effectiveYearlyEntitlement = yearlyEntitlement ?? 
      (policy.accrualMethod === AccrualMethod.MONTHLY ? policy.monthlyRate * 12 : policy.yearlyRate);

    switch (accrualMethod) {
      case AccrualMethod.MONTHLY:
        // Monthly rate based on total annual entitlement
        rawAmount = effectiveYearlyEntitlement / 12;
        break;
      case AccrualMethod.YEARLY:
        // Pro-rate based on service days in the year
        rawAmount = (effectiveYearlyEntitlement / 365) * serviceDays;
        break;
      case AccrualMethod.PER_TERM:
        // Per-term accrual: grant half at start, half after 6 months
        // This calculation is for periodic accrual, so return half
        rawAmount = effectiveYearlyEntitlement / 2;
        break;
      default:
        rawAmount = effectiveYearlyEntitlement / 12;
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

  // ==================== PUBLIC API METHODS (Refactored to use state-driven model) ====================

  /**
   * Get or create entitlement and ensure it's up-to-date
   * This is the primary entry point for accessing entitlements
   */
  async getEntitlementUpToDate(
    employeeId: string,
    leaveTypeId: string,
  ): Promise<LeaveEntitlementDocument> {
    const policy = await this.policyModel.findOne({
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!policy) {
      throw new NotFoundException(`No policy found for leave type ${leaveTypeId}`);
    }

    let entitlement = await this.entitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!entitlement) {
      // Check if automatic entitlement creation is enabled
      const automaticEntitlementEnabled = process.env.AUTOMATIC_ENTITLEMENT_ENABLED !== 'false';
      
      if (!automaticEntitlementEnabled) {
        throw new BadRequestException(
          'Automatic entitlement creation is disabled. Entitlement must be created manually through Personalized Entitlements.'
        );
      }

      // Create new entitlement
      const initialYearly = policy.monthlyRate ? policy.monthlyRate * 12 : policy.yearlyRate || 0;
      entitlement = new this.entitlementModel({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
        yearlyEntitlement: initialYearly,
        accruedActual: 0,
        accruedRounded: 0,
        carryForward: 0,
        taken: 0,
        pending: 0,
        remaining: 0,
        nextResetDate: new Date(new Date().getFullYear() + 1, 0, 1), // Next Jan 1
      });
      
      await entitlement.save();
      this.logger.log(`[Entitlement] Created for employee ${employeeId} with yearly=${initialYearly}`);
    }

    // Ensure entitlement is up-to-date
    await this.ensureEntitlementUpToDate(entitlement, policy);

    return entitlement;
  }

  /**
   * Process accrual for a single employee's leave type (DEPRECATED - kept for compatibility)
   * Use getEntitlementUpToDate() instead for state-driven approach
   */
  async processAccrualForEmployee(
    employeeId: string,
    leaveTypeId: string,
    serviceDays?: number,
  ): Promise<AccrualResult> {
    this.logger.warn('[Deprecated] processAccrualForEmployee called - use getEntitlementUpToDate instead');
    
    const entitlement = await this.getEntitlementUpToDate(employeeId, leaveTypeId);
    const policy = await this.policyModel.findOne({
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!policy) {
      throw new NotFoundException(`No policy found for leave type ${leaveTypeId}`);
    }

    return {
      employeeId,
      leaveTypeId,
      previousBalance: entitlement.remaining,
      accruedAmount: entitlement.accruedRounded,
      newBalance: entitlement.remaining,
      accrualMethod: policy.accrualMethod,
      lastAccrualDate: entitlement.lastAccrualDate || new Date(),
    };
  }

  /**
   * Bulk update entitlements for all employees (state-driven approach)
   * Ensures all entitlements are up-to-date for a specific leave type
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
        const entitlement = await this.getEntitlementUpToDate(
          employee._id.toString(),
          leaveTypeId,
        );

        const policy = await this.policyModel.findOne({ 
          leaveTypeId: new Types.ObjectId(leaveTypeId) 
        });

        if (!policy) {
          throw new NotFoundException(`No policy found for leave type ${leaveTypeId}`);
        }

        results.push({
          employeeId: employee._id.toString(),
          leaveTypeId,
          previousBalance: entitlement.remaining,
          accruedAmount: entitlement.accruedRounded,
          newBalance: entitlement.remaining,
          accrualMethod: policy.accrualMethod,
          lastAccrualDate: entitlement.lastAccrualDate || new Date(),
        });
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
   * Run bulk update for all leave types with monthly accrual
   * This is now a convenience method that ensures all entitlements are current
   */
  async runMonthlyAccrualJob(): Promise<{
    leaveTypes: string[];
    summaries: BulkAccrualSummary[];
  }> {
    this.logger.log('[Job] Running monthly accrual update (state-driven)');
    
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

    this.logger.log(`[Job] Monthly accrual completed for ${leaveTypes.length} leave types`);
    return { leaveTypes, summaries };
  }

  // ==================== CARRY-FORWARD METHODS (Refactored) ====================

  /**
   * Process carry-forward for a single employee (DEPRECATED - now automatic in ensureEntitlementUpToDate)
   * Kept for backward compatibility and manual triggers
   */
  async processCarryForwardForEmployee(
    employeeId: string,
    leaveTypeId: string,
    fromYear: number,
    toYear: number,
  ): Promise<CarryForwardResult> {
    this.logger.warn('[Deprecated] Manual carry-forward called - this is now automatic');
    
    const entitlement = await this.getEntitlementUpToDate(employeeId, leaveTypeId);
    const policy = await this.policyModel.findOne({
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!policy) {
      throw new NotFoundException(`No policy found for leave type ${leaveTypeId}`);
    }

    return {
      employeeId,
      leaveTypeId,
      previousRemaining: entitlement.remaining,
      carryForwardAmount: entitlement.carryForward,
      expiredAmount: 0,
      newCarryForward: entitlement.carryForward,
      expiryDate: (entitlement as any).carryForwardExpiry,
    };
  }

  /**
   * Bulk carry-forward for all employees of a leave type (DEPRECATED)
   * Now automatic via state-driven model
   */
  async runBulkCarryForward(
    leaveTypeId: string,
    fromYear: number,
    toYear: number,
    employeeIds?: string[],
  ): Promise<BulkCarryForwardSummary> {
    this.logger.warn('[Deprecated] Bulk carry-forward called - now automatic in ensureEntitlementUpToDate');
    
    const results: CarryForwardResult[] = [];
    const errors: Array<{ employeeId: string; error: string }> = [];

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
   * Year-end carry-forward job (DEPRECATED - now automatic)
   * Kept for compatibility and manual execution
   */
  async runYearEndCarryForwardJob(
    fromYear: number,
    toYear: number,
  ): Promise<{
    leaveTypes: string[];
    summaries: BulkCarryForwardSummary[];
  }> {
    this.logger.log('[Job] Running year-end carry-forward (state-driven)');
    
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

    this.logger.log(`[Job] Year-end carry-forward completed for ${leaveTypes.length} leave types`);
    return { leaveTypes, summaries };
  }

  /**
   * Process expired carry-forward balances (DEPRECATED - now automatic)
   * Expiry is now checked automatically in ensureEntitlementUpToDate
   */
  async processExpiredCarryForward(): Promise<{
    processed: number;
    expired: Array<{ employeeId: string; leaveTypeId: string; expiredAmount: number }>;
  }> {
    this.logger.log('[Job] Processing carry-forward expiry (state-driven)');
    
    const today = new Date();
    const expired: Array<{ employeeId: string; leaveTypeId: string; expiredAmount: number }> = [];

    // Find entitlements with carry-forward expiry in the past
    const toExpire = await this.entitlementModel
      .find({
        carryForward: { $gt: 0 },
        carryForwardExpiry: { $lte: today },
      })
      .exec();

    for (const ent of toExpire) {
      try {
        const policy = await this.policyModel.findOne({ leaveTypeId: ent.leaveTypeId });
        if (policy) {
          await this.ensureEntitlementUpToDate(ent, policy);
          
          expired.push({
            employeeId: ent.employeeId.toString(),
            leaveTypeId: ent.leaveTypeId.toString(),
            expiredAmount: 0, // Already processed by ensure method
          });
        }
      } catch (error) {
        this.logger.error(`Failed to process expiry for ${ent.employeeId}: ${error.message}`);
      }
    }

    this.logger.log(`[Job] Processed ${toExpire.length} expiry checks`);
    return { processed: toExpire.length, expired };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get accrual status for an employee (always returns up-to-date state)
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

    // Ensure each entitlement is up-to-date before returning
    for (const ent of entitlements) {
      const policy = await this.policyModel.findOne({ leaveTypeId: ent.leaveTypeId });
      if (policy) {
        await this.ensureEntitlementUpToDate(ent, policy);
      }
    }

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
   * Preview carry-forward calculation without applying (uses current state)
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
    // Get up-to-date entitlement
    const entitlement = await this.getEntitlementUpToDate(employeeId, leaveTypeId);
    const policy = await this.policyModel.findOne({
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
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
