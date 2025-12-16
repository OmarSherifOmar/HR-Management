import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeaveEntitlement, LeaveEntitlementDocument } from '../models/leave-entitlement.schema';
import { LeaveAdjustment, LeaveAdjustmentDocument } from '../models/leave-adjustment.schema';
import { LeaveRequest, LeaveRequestDocument } from '../models/leave-request.schema';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';
import { LeavePolicy, LeavePolicyDocument } from '../models/leave-policy.schema';
import { AdjustmentType } from '../enums/adjustment-type.enum';
import { LeaveStatus } from '../enums/leave-status.enum';
import { EmployeeService } from '../../employee-profile/employee-profile.service';

/**
 * REQ-042: Accrual Suspension/Adjustment Service
 * 
 * As an HR Manager, I want to accrual suspension/adjustment during unpaid leave 
 * or long absence so that balances reflect true entitlement.
 * 
 * Features:
 * - Pause accrual during unpaid leave and suspensions
 * - Exclude unpaid leave periods when calculating eligibility and accrual
 * - Calculate balance based on actual service days, excluding unpaid leave or absence
 */

export interface SuspensionPeriod {
  employeeId: string;
  startDate: Date;
  endDate?: Date;
  reason: 'unpaid_leave' | 'suspension' | 'long_absence';
  leaveRequestId?: string;
  totalDays?: number;
  isActive: boolean;
}

export interface AccrualSuspensionResult {
  employeeId: string;
  suspensionPeriods: SuspensionPeriod[];
  totalSuspendedDays: number;
  actualServiceDays: number;
  adjustedAccrual: number;
  originalAccrual: number;
  deductedAmount: number;
}

export interface ServiceDaysCalculation {
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  totalCalendarDays: number;
  unpaidLeaveDays: number;
  suspensionDays: number;
  actualServiceDays: number;
  serviceDaysPercentage: number;
}

@Injectable()
export class AccrualSuspensionService {
  constructor(
    @InjectModel(LeaveEntitlement.name) private entitlementModel: Model<LeaveEntitlementDocument>,
    @InjectModel(LeaveAdjustment.name) private adjustmentModel: Model<LeaveAdjustmentDocument>,
    @InjectModel(LeaveRequest.name) private leaveRequestModel: Model<LeaveRequestDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(LeavePolicy.name) private policyModel: Model<LeavePolicyDocument>,
    private employeeService: EmployeeService,
  ) {}

  // ==================== CALCULATE ACTUAL SERVICE DAYS ====================

  /**
   * Calculate actual service days for an employee in a given period
   * Excludes unpaid leave days and suspension periods
   */
  async calculateActualServiceDays(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<ServiceDaysCalculation> {
    // Get total calendar days in the period
    const totalCalendarDays = this.calculateCalendarDays(periodStart, periodEnd);

    // Get unpaid leave days in the period
    const unpaidLeaveDays = await this.getUnpaidLeaveDays(employeeId, periodStart, periodEnd);

    // Get suspension days from employee status (if any)
    const suspensionDays = await this.getSuspensionDays(employeeId, periodStart, periodEnd);

    // Calculate actual service days
    const actualServiceDays = Math.max(0, totalCalendarDays - unpaidLeaveDays - suspensionDays);
    const serviceDaysPercentage = totalCalendarDays > 0 
      ? (actualServiceDays / totalCalendarDays) * 100 
      : 0;

    return {
      employeeId,
      periodStart,
      periodEnd,
      totalCalendarDays,
      unpaidLeaveDays,
      suspensionDays,
      actualServiceDays,
      serviceDaysPercentage,
    };
  }

  /**
   * Get unpaid leave days for an employee in a given period
   */
  async getUnpaidLeaveDays(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number> {
    // Find all unpaid leave types
    const unpaidLeaveTypes = await this.leaveTypeModel.find({ paid: false }).select('_id').exec();
    const unpaidLeaveTypeIds = unpaidLeaveTypes.map(lt => lt._id);

    if (unpaidLeaveTypeIds.length === 0) {
      return 0;
    }

    // Find approved unpaid leaves in the period
    const unpaidLeaves = await this.leaveRequestModel.find({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: { $in: unpaidLeaveTypeIds },
      status: LeaveStatus.APPROVED,
      $or: [
        // Leave starts within period
        { 'dates.from': { $gte: periodStart, $lte: periodEnd } },
        // Leave ends within period
        { 'dates.to': { $gte: periodStart, $lte: periodEnd } },
        // Leave spans the entire period
        { 'dates.from': { $lte: periodStart }, 'dates.to': { $gte: periodEnd } },
      ],
    }).exec();

    let totalUnpaidDays = 0;
    for (const leave of unpaidLeaves) {
      // Calculate overlapping days with the period
      const overlapStart = new Date(Math.max(leave.dates.from.getTime(), periodStart.getTime()));
      const overlapEnd = new Date(Math.min(leave.dates.to.getTime(), periodEnd.getTime()));
      const overlapDays = this.calculateCalendarDays(overlapStart, overlapEnd);
      totalUnpaidDays += overlapDays;
    }

    return totalUnpaidDays;
  }

  /**
   * Get suspension days for an employee based on their status history
   * This checks if employee was in SUSPENDED status during the period
   */
  async getSuspensionDays(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number> {
    // Get employee profile to check current and historical status
    const employee = await this.employeeService.findById(employeeId);
    if (!employee) {
      return 0;
    }

    // Check if currently suspended and when it started
    if (employee.status === 'SUSPENDED' && employee.statusEffectiveFrom) {
      const suspensionStart = new Date(employee.statusEffectiveFrom);
      if (suspensionStart <= periodEnd) {
        const overlapStart = new Date(Math.max(suspensionStart.getTime(), periodStart.getTime()));
        const overlapEnd = periodEnd;
        return this.calculateCalendarDays(overlapStart, overlapEnd);
      }
    }

    // Note: For full historical tracking, you would need a status history table
    // For now, we only check current status
    return 0;
  }

  // ==================== ADJUST ACCRUAL FOR SUSPENSION ====================

  /**
   * Process accrual with suspension adjustment for an employee
   * Calculates accrual based on actual service days instead of full period
   */
  async processAccrualWithSuspension(
    employeeId: string,
    leaveTypeId: string,
    periodStart: Date,
    periodEnd: Date,
    hrUserId: string,
  ): Promise<AccrualSuspensionResult> {
    // Get policy for accrual rate
    const policy = await this.policyModel.findOne({
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!policy) {
      throw new NotFoundException(`No policy found for leave type ${leaveTypeId}`);
    }

    // Calculate service days
    const serviceDays = await this.calculateActualServiceDays(employeeId, periodStart, periodEnd);

    // Calculate original accrual (full month)
    const originalAccrual = policy.monthlyRate;

    // Calculate adjusted accrual based on actual service days
    const adjustedAccrual = (originalAccrual * serviceDays.serviceDaysPercentage) / 100;
    const deductedAmount = originalAccrual - adjustedAccrual;

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

    // Update entitlement with adjusted accrual
    entitlement.accruedActual += adjustedAccrual;
    entitlement.accruedRounded = Math.round(entitlement.accruedActual * 2) / 2;
    entitlement.remaining += adjustedAccrual;
    entitlement.lastAccrualDate = new Date();
    await entitlement.save();

    // Create adjustment record
    await this.adjustmentModel.create({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      adjustmentType: AdjustmentType.ADD,
      amount: adjustedAccrual,
      reason: `[ACCRUAL_WITH_SUSPENSION] Period: ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}. ` +
        `Total days: ${serviceDays.totalCalendarDays}, Unpaid leave: ${serviceDays.unpaidLeaveDays}, ` +
        `Suspension: ${serviceDays.suspensionDays}, Actual service: ${serviceDays.actualServiceDays} (${serviceDays.serviceDaysPercentage.toFixed(1)}%). ` +
        `Original: ${originalAccrual}, Adjusted: ${adjustedAccrual.toFixed(2)}, Deducted: ${deductedAmount.toFixed(2)}`,
      hrUserId: new Types.ObjectId(hrUserId),
    });

    // Get suspension periods for the result
    const suspensionPeriods = await this.getSuspensionPeriods(employeeId, periodStart, periodEnd);

    return {
      employeeId,
      suspensionPeriods,
      totalSuspendedDays: serviceDays.unpaidLeaveDays + serviceDays.suspensionDays,
      actualServiceDays: serviceDays.actualServiceDays,
      adjustedAccrual,
      originalAccrual,
      deductedAmount,
    };
  }

  /**
   * Get suspension periods for an employee
   */
  async getSuspensionPeriods(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<SuspensionPeriod[]> {
    const periods: SuspensionPeriod[] = [];

    // Get unpaid leave types
    const unpaidLeaveTypes = await this.leaveTypeModel.find({ paid: false }).select('_id').exec();
    const unpaidLeaveTypeIds = unpaidLeaveTypes.map(lt => lt._id);

    // Get unpaid leave periods
    const unpaidLeaves = await this.leaveRequestModel.find({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: { $in: unpaidLeaveTypeIds },
      status: LeaveStatus.APPROVED,
      $or: [
        { 'dates.from': { $gte: periodStart, $lte: periodEnd } },
        { 'dates.to': { $gte: periodStart, $lte: periodEnd } },
        { 'dates.from': { $lte: periodStart }, 'dates.to': { $gte: periodEnd } },
      ],
    }).exec();

    for (const leave of unpaidLeaves) {
      const overlapStart = new Date(Math.max(leave.dates.from.getTime(), periodStart.getTime()));
      const overlapEnd = new Date(Math.min(leave.dates.to.getTime(), periodEnd.getTime()));
      
      periods.push({
        employeeId,
        startDate: overlapStart,
        endDate: overlapEnd,
        reason: 'unpaid_leave',
        leaveRequestId: leave._id.toString(),
        totalDays: this.calculateCalendarDays(overlapStart, overlapEnd),
        isActive: new Date() <= leave.dates.to,
      });
    }

    // Check for suspension status
    const employee = await this.employeeService.findById(employeeId);
    if (employee?.status === 'SUSPENDED' && employee.statusEffectiveFrom) {
      const suspensionStart = new Date(employee.statusEffectiveFrom);
      if (suspensionStart <= periodEnd) {
        const overlapStart = new Date(Math.max(suspensionStart.getTime(), periodStart.getTime()));
        periods.push({
          employeeId,
          startDate: overlapStart,
          endDate: undefined, // Still active
          reason: 'suspension',
          totalDays: this.calculateCalendarDays(overlapStart, periodEnd),
          isActive: true,
        });
      }
    }

    return periods;
  }

  // ==================== BULK ACCRUAL WITH SUSPENSION ====================

  /**
   * Run bulk accrual for all employees with suspension adjustments
   */
  async runBulkAccrualWithSuspension(
    leaveTypeId: string,
    periodStart: Date,
    periodEnd: Date,
    hrUserId: string,
    employeeIds?: string[],
  ): Promise<{
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    results: AccrualSuspensionResult[];
    errors: Array<{ employeeId: string; error: string }>;
  }> {
    const results: AccrualSuspensionResult[] = [];
    const errors: Array<{ employeeId: string; error: string }> = [];

    // Get employees to process
    const employeeModel = this.employeeService['employeeModel'];
    const query: any = { isActive: true };
    if (employeeIds?.length) {
      query._id = { $in: employeeIds.map(id => new Types.ObjectId(id)) };
    }

    const employees = await employeeModel.find(query).select('_id').exec();

    for (const employee of employees) {
      try {
        const result = await this.processAccrualWithSuspension(
          employee._id.toString(),
          leaveTypeId,
          periodStart,
          periodEnd,
          hrUserId,
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

  // ==================== MANUAL SUSPENSION ====================

  /**
   * Manually suspend accrual for an employee
   */
  async suspendAccrual(
    employeeId: string,
    leaveTypeId: string,
    reason: string,
    hrUserId: string,
    startDate?: Date,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // Validate employee exists
    const employee = await this.employeeService.findById(employeeId);
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    // Create adjustment record for audit trail
    await this.adjustmentModel.create({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      adjustmentType: AdjustmentType.DEDUCT,
      amount: 0, // No immediate deduction, just marking suspension start
      reason: `[ACCRUAL_SUSPENDED] ${reason}. Suspension started: ${(startDate || new Date()).toISOString().split('T')[0]}`,
      hrUserId: new Types.ObjectId(hrUserId),
    });

    return {
      success: true,
      message: `Accrual suspended for employee ${employeeId}. Future accruals will be adjusted based on actual service days.`,
    };
  }

  /**
   * Resume accrual for an employee after suspension
   */
  async resumeAccrual(
    employeeId: string,
    leaveTypeId: string,
    reason: string,
    hrUserId: string,
    endDate?: Date,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // Create adjustment record for audit trail
    await this.adjustmentModel.create({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      adjustmentType: AdjustmentType.ADD,
      amount: 0, // No immediate addition, just marking suspension end
      reason: `[ACCRUAL_RESUMED] ${reason}. Suspension ended: ${(endDate || new Date()).toISOString().split('T')[0]}`,
      hrUserId: new Types.ObjectId(hrUserId),
    });

    return {
      success: true,
      message: `Accrual resumed for employee ${employeeId}. Future accruals will be calculated at full rate.`,
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Calculate calendar days between two dates (inclusive)
   */
  private calculateCalendarDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Get accrual suspension history for an employee
   */
  async getAccrualSuspensionHistory(
    employeeId: string,
    leaveTypeId?: string,
  ): Promise<LeaveAdjustmentDocument[]> {
    const query: any = {
      employeeId: new Types.ObjectId(employeeId),
      reason: { $regex: /\[ACCRUAL_SUSPENDED\]|\[ACCRUAL_RESUMED\]|\[ACCRUAL_WITH_SUSPENSION\]/ },
    };

    if (leaveTypeId) {
      query.leaveTypeId = new Types.ObjectId(leaveTypeId);
    }

    return this.adjustmentModel
      .find(query)
      .populate('leaveTypeId', 'code name')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Preview accrual adjustment without applying
   */
  async previewAccrualAdjustment(
    employeeId: string,
    leaveTypeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<{
    serviceDays: ServiceDaysCalculation;
    originalAccrual: number;
    adjustedAccrual: number;
    deduction: number;
  }> {
    const policy = await this.policyModel.findOne({
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!policy) {
      throw new NotFoundException(`No policy found for leave type ${leaveTypeId}`);
    }

    const serviceDays = await this.calculateActualServiceDays(employeeId, periodStart, periodEnd);
    const originalAccrual = policy.monthlyRate;
    const adjustedAccrual = (originalAccrual * serviceDays.serviceDaysPercentage) / 100;

    return {
      serviceDays,
      originalAccrual,
      adjustedAccrual,
      deduction: originalAccrual - adjustedAccrual,
    };
  }
}
