import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeaveEntitlement, LeaveEntitlementDocument } from '../models/leave-entitlement.schema';
import { LeaveAdjustment, LeaveAdjustmentDocument } from '../models/leave-adjustment.schema';
import { LeaveRequest, LeaveRequestDocument } from '../models/leave-request.schema';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';
import { AdjustmentType } from '../enums/adjustment-type.enum';
import { LeaveStatus } from '../enums/leave-status.enum';
import { EmployeeService } from '../../employee-profile/employee-profile.service';

/**
 * REQ-042: Real-time Payroll Synchronization Service
 * 
 * As an HR Manager, I want to automatically sync with the payroll system in real-time 
 * so that salary deductions or adjustments are calculated without delays.
 * 
 * Features:
 * - Approved leaves (paid/unpaid) change payroll calculations
 * - Deductions and encashments sync in real time with payroll
 * - Final settlement on termination/resignation
 * - Unpaid leave deduction calculation: (Base Salary / Work Days in Month) × Unpaid Leave Days
 */

export interface PayrollSyncEvent {
  eventType: 'leave_approved' | 'leave_cancelled' | 'unpaid_absence' | 'encashment' | 'final_settlement';
  employeeId: string;
  leaveRequestId?: string;
  leaveTypeId?: string;
  effectiveDate: Date;
  amount: number;
  days: number;
  description: string;
  syncedAt: Date;
  syncStatus: 'pending' | 'synced' | 'failed';
  payrollPeriod?: string;
}

export interface DeductionCalculation {
  employeeId: string;
  baseSalary: number;
  workDaysInMonth: number;
  dailyRate: number;
  unpaidLeaveDays: number;
  deductionAmount: number;
  effectiveMonth: string;
}

export interface EncashmentCalculation {
  employeeId: string;
  leaveTypeId: string;
  leaveDays: number;
  dailyRate: number;
  encashmentAmount: number;
  taxableAmount?: number;
}

export interface FinalSettlement {
  employeeId: string;
  terminationDate: Date;
  leaveBalances: Array<{
    leaveTypeId: string;
    leaveTypeName: string;
    balance: number;
    encashmentRate: number;
    encashmentAmount: number;
    action: 'encash' | 'forfeit';
  }>;
  totalEncashment: number;
  totalForfeited: number;
  settlementStatus: 'pending' | 'processed' | 'paid';
}

@Injectable()
export class PayrollSyncService {
  // Default work days in a month (can be configured per organization)
  private readonly DEFAULT_WORK_DAYS_PER_MONTH = 22;

  constructor(
    @InjectModel(LeaveEntitlement.name) private entitlementModel: Model<LeaveEntitlementDocument>,
    @InjectModel(LeaveAdjustment.name) private adjustmentModel: Model<LeaveAdjustmentDocument>,
    @InjectModel(LeaveRequest.name) private leaveRequestModel: Model<LeaveRequestDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
    private employeeService: EmployeeService,
  ) {}

  // ==================== UNPAID LEAVE DEDUCTION ====================

  /**
   * Calculate unpaid leave deduction for an employee
   * Formula: (Base Salary / Work Days in Month) × Unpaid Leave Days
   */
  async calculateUnpaidLeaveDeduction(
    employeeId: string,
    baseSalary: number,
    month: number, // 1-12
    year: number,
    workDaysInMonth?: number,
  ): Promise<DeductionCalculation> {
    const effectiveWorkDays = workDaysInMonth || this.DEFAULT_WORK_DAYS_PER_MONTH;
    const dailyRate = baseSalary / effectiveWorkDays;

    // Get unpaid leaves for the month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    // Find all unpaid leave types
    const unpaidLeaveTypes = await this.leaveTypeModel.find({ paid: false }).select('_id').exec();
    const unpaidLeaveTypeIds = unpaidLeaveTypes.map(lt => lt._id);

    if (unpaidLeaveTypeIds.length === 0) {
      return {
        employeeId,
        baseSalary,
        workDaysInMonth: effectiveWorkDays,
        dailyRate,
        unpaidLeaveDays: 0,
        deductionAmount: 0,
        effectiveMonth: `${year}-${month.toString().padStart(2, '0')}`,
      };
    }

    // Get approved unpaid leaves
    const unpaidLeaves = await this.leaveRequestModel.find({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: { $in: unpaidLeaveTypeIds },
      status: LeaveStatus.APPROVED,
      $or: [
        { 'dates.from': { $gte: startOfMonth, $lte: endOfMonth } },
        { 'dates.to': { $gte: startOfMonth, $lte: endOfMonth } },
        { 'dates.from': { $lte: startOfMonth }, 'dates.to': { $gte: endOfMonth } },
      ],
    }).exec();

    // Calculate total unpaid leave days in the month
    let totalUnpaidDays = 0;
    for (const leave of unpaidLeaves) {
      const overlapStart = new Date(Math.max(leave.dates.from.getTime(), startOfMonth.getTime()));
      const overlapEnd = new Date(Math.min(leave.dates.to.getTime(), endOfMonth.getTime()));
      totalUnpaidDays += this.calculateBusinessDays(overlapStart, overlapEnd);
    }

    const deductionAmount = dailyRate * totalUnpaidDays;

    return {
      employeeId,
      baseSalary,
      workDaysInMonth: effectiveWorkDays,
      dailyRate: Math.round(dailyRate * 100) / 100,
      unpaidLeaveDays: totalUnpaidDays,
      deductionAmount: Math.round(deductionAmount * 100) / 100,
      effectiveMonth: `${year}-${month.toString().padStart(2, '0')}`,
    };
  }

  /**
   * Calculate unapproved absence deduction
   * For absences not covered by approved leave
   */
  async calculateUnapprovedAbsenceDeduction(
    employeeId: string,
    baseSalary: number,
    absenceDays: number,
    workDaysInMonth?: number,
  ): Promise<{
    employeeId: string;
    absenceDays: number;
    dailyRate: number;
    deductionAmount: number;
  }> {
    const effectiveWorkDays = workDaysInMonth || this.DEFAULT_WORK_DAYS_PER_MONTH;
    const dailyRate = baseSalary / effectiveWorkDays;
    const deductionAmount = dailyRate * absenceDays;

    return {
      employeeId,
      absenceDays,
      dailyRate: Math.round(dailyRate * 100) / 100,
      deductionAmount: Math.round(deductionAmount * 100) / 100,
    };
  }

  // ==================== LEAVE ENCASHMENT ====================

  /**
   * Calculate leave encashment amount
   * Used when employee wants to convert leave balance to cash
   */
  async calculateEncashment(
    employeeId: string,
    leaveTypeId: string,
    daysToEncash: number,
    dailyRate: number,
  ): Promise<EncashmentCalculation> {
    // Validate leave type
    const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
    if (!leaveType) {
      throw new NotFoundException(`Leave type ${leaveTypeId} not found`);
    }

    // Get current balance
    const entitlement = await this.entitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!entitlement) {
      throw new NotFoundException(`No entitlement found for employee ${employeeId}`);
    }

    if (daysToEncash > entitlement.remaining) {
      throw new BadRequestException(
        `Cannot encash ${daysToEncash} days. Only ${entitlement.remaining} days available.`
      );
    }

    const encashmentAmount = daysToEncash * dailyRate;

    return {
      employeeId,
      leaveTypeId,
      leaveDays: daysToEncash,
      dailyRate,
      encashmentAmount: Math.round(encashmentAmount * 100) / 100,
    };
  }

  /**
   * Process leave encashment
   * Deducts from balance and creates payroll sync event
   */
  async processEncashment(
    employeeId: string,
    leaveTypeId: string,
    daysToEncash: number,
    dailyRate: number,
    hrUserId: string,
  ): Promise<{
    calculation: EncashmentCalculation;
    payrollEvent: PayrollSyncEvent;
    updatedBalance: number;
  }> {
    const calculation = await this.calculateEncashment(employeeId, leaveTypeId, daysToEncash, dailyRate);

    // Update entitlement
    const entitlement = await this.entitlementModel.findOneAndUpdate(
      {
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
      },
      {
        $inc: { remaining: -daysToEncash },
      },
      { new: true }
    );

    // Create adjustment record
    await this.adjustmentModel.create({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      adjustmentType: AdjustmentType.ENCASHMENT,
      amount: daysToEncash,
      reason: `[ENCASHMENT] ${daysToEncash} days encashed at rate ${dailyRate}/day = ${calculation.encashmentAmount}`,
      hrUserId: new Types.ObjectId(hrUserId),
    });

    // Create payroll sync event
    const payrollEvent: PayrollSyncEvent = {
      eventType: 'encashment',
      employeeId,
      leaveTypeId,
      effectiveDate: new Date(),
      amount: calculation.encashmentAmount,
      days: daysToEncash,
      description: `Leave encashment: ${daysToEncash} days at ${dailyRate}/day`,
      syncedAt: new Date(),
      syncStatus: 'pending',
      payrollPeriod: this.getCurrentPayrollPeriod(),
    };

    return {
      calculation,
      payrollEvent,
      updatedBalance: entitlement?.remaining || 0,
    };
  }

  // ==================== FINAL SETTLEMENT ====================

  /**
   * Calculate final settlement for terminated/resigned employee
   * Converts remaining leave balance to encashment or forfeits based on rules
   */
  async calculateFinalSettlement(
    employeeId: string,
    terminationDate: Date,
    dailyRate: number,
    encashableLeaveTypes?: string[], // Leave type IDs that can be encashed
  ): Promise<FinalSettlement> {
    // Get all entitlements for the employee
    const entitlements = await this.entitlementModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .populate('leaveTypeId', 'code name paid')
      .exec();

    const leaveBalances: FinalSettlement['leaveBalances'] = [];
    let totalEncashment = 0;
    let totalForfeited = 0;

    for (const entitlement of entitlements) {
      const leaveType = entitlement.leaveTypeId as any;
      const balance = entitlement.remaining;

      if (balance <= 0) continue;

      // Determine if this leave type can be encashed
      const canEncash = encashableLeaveTypes 
        ? encashableLeaveTypes.includes(leaveType._id.toString())
        : leaveType.paid; // Default: only paid leave types can be encashed

      if (canEncash) {
        const encashmentAmount = balance * dailyRate;
        totalEncashment += encashmentAmount;

        leaveBalances.push({
          leaveTypeId: leaveType._id.toString(),
          leaveTypeName: leaveType.name,
          balance,
          encashmentRate: dailyRate,
          encashmentAmount: Math.round(encashmentAmount * 100) / 100,
          action: 'encash',
        });
      } else {
        totalForfeited += balance;

        leaveBalances.push({
          leaveTypeId: leaveType._id.toString(),
          leaveTypeName: leaveType.name,
          balance,
          encashmentRate: 0,
          encashmentAmount: 0,
          action: 'forfeit',
        });
      }
    }

    return {
      employeeId,
      terminationDate,
      leaveBalances,
      totalEncashment: Math.round(totalEncashment * 100) / 100,
      totalForfeited,
      settlementStatus: 'pending',
    };
  }

  /**
   * Process final settlement
   * Clears all leave balances and creates payroll sync event
   */
  async processFinalSettlement(
    employeeId: string,
    terminationDate: Date,
    dailyRate: number,
    hrUserId: string,
    encashableLeaveTypes?: string[],
  ): Promise<{
    settlement: FinalSettlement;
    payrollEvent: PayrollSyncEvent;
  }> {
    const settlement = await this.calculateFinalSettlement(
      employeeId, 
      terminationDate, 
      dailyRate,
      encashableLeaveTypes
    );

    // Process each leave balance
    for (const balance of settlement.leaveBalances) {
      // Create adjustment record
      await this.adjustmentModel.create({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(balance.leaveTypeId),
        adjustmentType: balance.action === 'encash' ? AdjustmentType.ENCASHMENT : AdjustmentType.DEDUCT,
        amount: balance.balance,
        reason: `[FINAL_SETTLEMENT] ${balance.action === 'encash' 
          ? `Encashed ${balance.balance} days at ${dailyRate}/day = ${balance.encashmentAmount}` 
          : `Forfeited ${balance.balance} days due to termination`}`,
        hrUserId: new Types.ObjectId(hrUserId),
      });

      // Zero out the balance
      await this.entitlementModel.updateOne(
        {
          employeeId: new Types.ObjectId(employeeId),
          leaveTypeId: new Types.ObjectId(balance.leaveTypeId),
        },
        {
          $set: { remaining: 0, carryForward: 0, pending: 0 },
        }
      );
    }

    settlement.settlementStatus = 'processed';

    // Create payroll sync event
    const payrollEvent: PayrollSyncEvent = {
      eventType: 'final_settlement',
      employeeId,
      effectiveDate: terminationDate,
      amount: settlement.totalEncashment,
      days: settlement.leaveBalances.reduce((sum, b) => sum + (b.action === 'encash' ? b.balance : 0), 0),
      description: `Final settlement: ${settlement.totalEncashment} (encashment) + ${settlement.totalForfeited} days forfeited`,
      syncedAt: new Date(),
      syncStatus: 'pending',
      payrollPeriod: this.getCurrentPayrollPeriod(),
    };

    return {
      settlement,
      payrollEvent,
    };
  }

  // ==================== PAYROLL SYNC EVENTS ====================

  /**
   * Generate payroll sync event when leave is approved
   */
  async generateLeaveApprovalSyncEvent(
    leaveRequestId: string,
  ): Promise<PayrollSyncEvent> {
    const leaveRequest = await this.leaveRequestModel
      .findById(leaveRequestId)
      .populate('leaveTypeId', 'code name paid')
      .exec();

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request ${leaveRequestId} not found`);
    }

    const leaveType = leaveRequest.leaveTypeId as any;
    const isPaid = leaveType.paid;

    return {
      eventType: 'leave_approved',
      employeeId: leaveRequest.employeeId.toString(),
      leaveRequestId: leaveRequest._id.toString(),
      leaveTypeId: leaveType._id.toString(),
      effectiveDate: leaveRequest.dates.from,
      amount: 0, // Will be calculated by payroll based on salary
      days: leaveRequest.durationDays,
      description: `${isPaid ? 'Paid' : 'Unpaid'} leave approved: ${leaveType.name} (${leaveRequest.durationDays} days)`,
      syncedAt: new Date(),
      syncStatus: 'pending',
      payrollPeriod: this.getPayrollPeriodForDate(leaveRequest.dates.from),
    };
  }

  /**
   * Generate payroll sync event when leave is cancelled
   */
  async generateLeaveCancellationSyncEvent(
    leaveRequestId: string,
  ): Promise<PayrollSyncEvent> {
    const leaveRequest = await this.leaveRequestModel
      .findById(leaveRequestId)
      .populate('leaveTypeId', 'code name paid')
      .exec();

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request ${leaveRequestId} not found`);
    }

    const leaveType = leaveRequest.leaveTypeId as any;

    return {
      eventType: 'leave_cancelled',
      employeeId: leaveRequest.employeeId.toString(),
      leaveRequestId: leaveRequest._id.toString(),
      leaveTypeId: leaveType._id.toString(),
      effectiveDate: new Date(),
      amount: 0,
      days: -leaveRequest.durationDays, // Negative to indicate reversal
      description: `Leave cancelled: ${leaveType.name} (${leaveRequest.durationDays} days)`,
      syncedAt: new Date(),
      syncStatus: 'pending',
      payrollPeriod: this.getPayrollPeriodForDate(leaveRequest.dates.from),
    };
  }

  /**
   * Get monthly payroll summary for all employees
   */
  async getMonthlyPayrollSummary(
    month: number,
    year: number,
    baseSalaryMap: Map<string, number>, // employeeId -> baseSalary
  ): Promise<{
    period: string;
    employees: Array<{
      employeeId: string;
      paidLeaveDays: number;
      unpaidLeaveDays: number;
      deductionAmount: number;
    }>;
    totalDeductions: number;
  }> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    // Get all approved leaves in the month
    const approvedLeaves = await this.leaveRequestModel
      .find({
        status: LeaveStatus.APPROVED,
        $or: [
          { 'dates.from': { $gte: startOfMonth, $lte: endOfMonth } },
          { 'dates.to': { $gte: startOfMonth, $lte: endOfMonth } },
          { 'dates.from': { $lte: startOfMonth }, 'dates.to': { $gte: endOfMonth } },
        ],
      })
      .populate('leaveTypeId', 'paid')
      .exec();

    // Group by employee
    const employeeData = new Map<string, { paidDays: number; unpaidDays: number }>();

    for (const leave of approvedLeaves) {
      const employeeId = leave.employeeId.toString();
      const isPaid = (leave.leaveTypeId as any).paid;

      // Calculate overlapping days with the month
      const overlapStart = new Date(Math.max(leave.dates.from.getTime(), startOfMonth.getTime()));
      const overlapEnd = new Date(Math.min(leave.dates.to.getTime(), endOfMonth.getTime()));
      const days = this.calculateBusinessDays(overlapStart, overlapEnd);

      if (!employeeData.has(employeeId)) {
        employeeData.set(employeeId, { paidDays: 0, unpaidDays: 0 });
      }

      const data = employeeData.get(employeeId)!;
      if (isPaid) {
        data.paidDays += days;
      } else {
        data.unpaidDays += days;
      }
    }

    // Calculate deductions
    const employees: Array<{
      employeeId: string;
      paidLeaveDays: number;
      unpaidLeaveDays: number;
      deductionAmount: number;
    }> = [];

    let totalDeductions = 0;

    for (const [employeeId, data] of employeeData) {
      const baseSalary = baseSalaryMap.get(employeeId) || 0;
      const dailyRate = baseSalary / this.DEFAULT_WORK_DAYS_PER_MONTH;
      const deductionAmount = dailyRate * data.unpaidDays;

      employees.push({
        employeeId,
        paidLeaveDays: data.paidDays,
        unpaidLeaveDays: data.unpaidDays,
        deductionAmount: Math.round(deductionAmount * 100) / 100,
      });

      totalDeductions += deductionAmount;
    }

    return {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      employees,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Calculate business days between two dates (excluding weekends)
   */
  private calculateBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Get current payroll period (YYYY-MM format)
   */
  private getCurrentPayrollPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  /**
   * Get payroll period for a specific date
   */
  private getPayrollPeriodForDate(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }
}
