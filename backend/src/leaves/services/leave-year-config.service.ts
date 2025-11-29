import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LeaveEntitlement, LeaveEntitlementDocument } from '../models/leave-entitlement.schema';
import { LeavePolicy, LeavePolicyDocument } from '../models/leave-policy.schema';

/**
 * LeaveYearConfigService - US11: Define Legal Leave Year and Reset Rules
 * 
 * This service manages leave year calculations and resets using the existing
 * LeavePolicy and LeaveEntitlement models. Leave policies define carry-forward
 * rules, and entitlements track the nextResetDate for each employee.
 * 
 * Reset Basis Options (managed externally via configuration or policy metadata):
 * - CALENDAR_YEAR: January 1st to December 31st
 * - FISCAL_YEAR: Custom fiscal year (e.g., April 1st)
 * - HIRE_DATE_ANNIVERSARY: Based on employee's hire date
 */

export enum ResetBasis {
  CALENDAR_YEAR = 'CALENDAR_YEAR',
  FISCAL_YEAR = 'FISCAL_YEAR',
  HIRE_DATE_ANNIVERSARY = 'HIRE_DATE_ANNIVERSARY',
}

export interface LeaveYearConfig {
  resetBasis: ResetBasis;
  fiscalYearStartMonth?: number; // 1-12
  fiscalYearStartDay?: number;   // 1-31
  proRateFirstYear: boolean;
  gracePeriodDays: number;
}

// Default configuration (calendar year)
const DEFAULT_CONFIG: LeaveYearConfig = {
  resetBasis: ResetBasis.CALENDAR_YEAR,
  fiscalYearStartMonth: 1,
  fiscalYearStartDay: 1,
  proRateFirstYear: true,
  gracePeriodDays: 0,
};

@Injectable()
export class LeaveYearConfigService {
  private config: LeaveYearConfig = { ...DEFAULT_CONFIG };

  constructor(
    @InjectModel(LeaveEntitlement.name)
    private leaveEntitlementModel: Model<LeaveEntitlementDocument>,
    @InjectModel(LeavePolicy.name)
    private leavePolicyModel: Model<LeavePolicyDocument>,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // CONFIGURATION MANAGEMENT (In-Memory)
  // ─────────────────────────────────────────────────────────────

  getConfig(): LeaveYearConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<LeaveYearConfig>): LeaveYearConfig {
    this.config = { ...this.config, ...updates };
    return this.getConfig();
  }

  resetToDefault(): LeaveYearConfig {
    this.config = { ...DEFAULT_CONFIG };
    return this.getConfig();
  }

  // ─────────────────────────────────────────────────────────────
  // CALCULATE LEAVE YEAR DATES
  // ─────────────────────────────────────────────────────────────

  calculateLeaveYearDates(
    referenceDate: Date = new Date(),
    hireDate?: Date,
  ): { startDate: Date; endDate: Date; nextResetDate: Date } {
    let startDate: Date;
    let endDate: Date;

    switch (this.config.resetBasis) {
      case ResetBasis.CALENDAR_YEAR:
        startDate = new Date(referenceDate.getFullYear(), 0, 1);
        endDate = new Date(referenceDate.getFullYear(), 11, 31, 23, 59, 59);
        break;

      case ResetBasis.FISCAL_YEAR:
        const fiscalMonth = (this.config.fiscalYearStartMonth || 1) - 1; // 0-indexed
        const fiscalDay = this.config.fiscalYearStartDay || 1;
        const currentMonth = referenceDate.getMonth();

        if (currentMonth >= fiscalMonth) {
          startDate = new Date(referenceDate.getFullYear(), fiscalMonth, fiscalDay);
          endDate = new Date(referenceDate.getFullYear() + 1, fiscalMonth, fiscalDay - 1, 23, 59, 59);
        } else {
          startDate = new Date(referenceDate.getFullYear() - 1, fiscalMonth, fiscalDay);
          endDate = new Date(referenceDate.getFullYear(), fiscalMonth, fiscalDay - 1, 23, 59, 59);
        }
        break;

      case ResetBasis.HIRE_DATE_ANNIVERSARY:
        if (!hireDate) {
          throw new BadRequestException('Hire date is required for HIRE_DATE_ANNIVERSARY reset basis');
        }
        const hireMonth = hireDate.getMonth();
        const hireDay = hireDate.getDate();
        const refMonth = referenceDate.getMonth();
        const refDay = referenceDate.getDate();

        if (refMonth > hireMonth || (refMonth === hireMonth && refDay >= hireDay)) {
          startDate = new Date(referenceDate.getFullYear(), hireMonth, hireDay);
          endDate = new Date(referenceDate.getFullYear() + 1, hireMonth, hireDay - 1, 23, 59, 59);
        } else {
          startDate = new Date(referenceDate.getFullYear() - 1, hireMonth, hireDay);
          endDate = new Date(referenceDate.getFullYear(), hireMonth, hireDay - 1, 23, 59, 59);
        }
        break;

      default:
        startDate = new Date(referenceDate.getFullYear(), 0, 1);
        endDate = new Date(referenceDate.getFullYear(), 11, 31, 23, 59, 59);
    }

    // Add grace period to reset date
    const nextResetDate = new Date(endDate);
    nextResetDate.setDate(nextResetDate.getDate() + 1 + this.config.gracePeriodDays);

    return { startDate, endDate, nextResetDate };
  }

  // ─────────────────────────────────────────────────────────────
  // EXECUTE YEAR-END RESET FOR AN EMPLOYEE
  // ─────────────────────────────────────────────────────────────

  async executeYearEndReset(
    employeeId: string,
    hireDate?: Date,
  ): Promise<{ processed: number; details: any[] }> {
    const entitlements = await this.leaveEntitlementModel
      .find({ employeeId })
      .exec();

    if (!entitlements.length) {
      throw new NotFoundException(`No entitlements found for employee ${employeeId}`);
    }

    const details: any[] = [];

    for (const ent of entitlements) {
      const policy = await this.leavePolicyModel.findOne({ leaveTypeId: ent.leaveTypeId }).exec();

      const previousBalance = ent.remaining;
      let carryForward = 0;

      // Calculate carry forward based on policy
      if (policy?.carryForwardAllowed && ent.remaining > 0) {
        carryForward = Math.min(ent.remaining, policy.maxCarryForward || ent.remaining);
      }

      // Update entitlement
      ent.carryForward = carryForward;
      ent.accruedActual = 0;
      ent.accruedRounded = 0;
      ent.taken = 0;
      ent.pending = 0;
      ent.remaining = ent.yearlyEntitlement + carryForward;

      // Set next reset date
      const yearDates = this.calculateLeaveYearDates(new Date(), hireDate);
      ent.nextResetDate = yearDates.nextResetDate;
      ent.lastAccrualDate = new Date();

      await ent.save();

      details.push({
        leaveTypeId: ent.leaveTypeId,
        previousBalance,
        carryForward,
        newBalance: ent.remaining,
        nextResetDate: ent.nextResetDate,
      });
    }

    return { processed: entitlements.length, details };
  }

  // ─────────────────────────────────────────────────────────────
  // BULK YEAR-END RESET (all employees)
  // ─────────────────────────────────────────────────────────────

  async executeBulkYearEndReset(): Promise<{
    totalEmployees: number;
    totalEntitlements: number;
    results: any[];
  }> {
    // Get all unique employee IDs from entitlements
    const employeeIds = await this.leaveEntitlementModel.distinct('employeeId').exec();

    const results: any[] = [];

    for (const empId of employeeIds) {
      try {
        const result = await this.executeYearEndReset(empId.toString());
        results.push({
          employeeId: empId,
          success: true,
          ...result,
        });
      } catch (error) {
        results.push({
          employeeId: empId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      totalEmployees: employeeIds.length,
      totalEntitlements: results.reduce((sum, r) => sum + (r.processed || 0), 0),
      results,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // PRO-RATE CALCULATION FOR NEW EMPLOYEES
  // ─────────────────────────────────────────────────────────────

  calculateProRatedEntitlement(
    yearlyEntitlement: number,
    hireDate: Date,
  ): number {
    if (!this.config.proRateFirstYear) {
      return yearlyEntitlement;
    }

    const yearDates = this.calculateLeaveYearDates(new Date(), hireDate);
    const totalDaysInYear =
      (yearDates.endDate.getTime() - yearDates.startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
    const remainingDaysInYear =
      (yearDates.endDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24) + 1;

    const proRatedDays = Math.round((yearlyEntitlement * remainingDaysInYear) / totalDaysInYear * 100) / 100;

    return Math.max(0, proRatedDays);
  }

  // ─────────────────────────────────────────────────────────────
  // GET UPCOMING RESETS
  // ─────────────────────────────────────────────────────────────

  async getUpcomingResets(
    withinDays: number = 30,
  ): Promise<{ employeeId: string; leaveTypeId: string; nextResetDate: Date }[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);

    const entitlements = await this.leaveEntitlementModel
      .find({
        nextResetDate: { $lte: futureDate, $gte: new Date() },
      })
      .select('employeeId leaveTypeId nextResetDate')
      .exec();

    return entitlements.map((e) => ({
      employeeId: e.employeeId.toString(),
      leaveTypeId: e.leaveTypeId.toString(),
      nextResetDate: e.nextResetDate!,
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // GET EMPLOYEE LEAVE YEAR INFO
  // ─────────────────────────────────────────────────────────────

  async getEmployeeLeaveYearInfo(
    employeeId: string,
    hireDate?: Date,
  ): Promise<{
    currentYearDates: { startDate: Date; endDate: Date; nextResetDate: Date };
    entitlements: { leaveTypeId: string; remaining: number; carryForward: number; nextResetDate?: Date }[];
  }> {
    const currentYearDates = this.calculateLeaveYearDates(new Date(), hireDate);
    
    const entitlements = await this.leaveEntitlementModel
      .find({ employeeId })
      .select('leaveTypeId remaining carryForward nextResetDate')
      .exec();

    return {
      currentYearDates,
      entitlements: entitlements.map((e) => ({
        leaveTypeId: e.leaveTypeId.toString(),
        remaining: e.remaining,
        carryForward: e.carryForward,
        nextResetDate: e.nextResetDate,
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // SET EMPLOYEE NEXT RESET DATE
  // ─────────────────────────────────────────────────────────────

  async setEmployeeResetDate(
    employeeId: string,
    leaveTypeId: string,
    nextResetDate: Date,
  ): Promise<LeaveEntitlementDocument> {
    const entitlement = await this.leaveEntitlementModel.findOneAndUpdate(
      { employeeId, leaveTypeId },
      { nextResetDate },
      { new: true },
    ).exec();

    if (!entitlement) {
      throw new NotFoundException(
        `Entitlement not found for employee ${employeeId} and leaveType ${leaveTypeId}`,
      );
    }

    return entitlement;
  }
}
