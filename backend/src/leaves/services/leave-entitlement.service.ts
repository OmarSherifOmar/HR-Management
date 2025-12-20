import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeaveEntitlement, LeaveEntitlementDocument } from '../models/leave-entitlement.schema';
import { LeavePolicy, LeavePolicyDocument } from '../models/leave-policy.schema';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';
import { LeaveAdjustment, LeaveAdjustmentDocument } from '../models/leave-adjustment.schema';
import { CreateLeaveEntitlementDto } from '../dto/leave-entitlement/create-leave-entitlement.dto';
import { UpdateLeaveEntitlementDto } from '../dto/leave-entitlement/update-leave-entitlement.dto';
import { EmployeeService } from '../../employee-profile/employee-profile.service';
import { AccrualSuspensionService } from './accrual-suspension.service';
import { LeaveEligibilityService } from './leave-eligibility.service';
import { AccrualMethod } from '../enums/accrual-method.enum';
import { RoundingRule } from '../enums/rounding-rule.enum';
import { AdjustmentType } from '../enums/adjustment-type.enum';
import { ContractType } from '../../employee-profile/enums/employee-profile.enums';

/**
 * Leave Entitlement Service
 * 
 * User Story: As an HR Admin, I want to update entitlement calculations and 
 * scheduling logic so that leave balances are accurately computed and 
 * scheduling respects the new rules.
 * 
 * Input: None (internal system processing)
 */
@Injectable()
export class LeaveEntitlementService {
  constructor(
    @InjectModel(LeaveEntitlement.name) private entitlementModel: Model<LeaveEntitlementDocument>,
    @InjectModel(LeavePolicy.name) private leavePolicyModel: Model<LeavePolicyDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(LeaveAdjustment.name) private adjustmentModel: Model<LeaveAdjustmentDocument>,
    private employeeService: EmployeeService,
    private leaveEligibilityService: LeaveEligibilityService,
    @Inject(forwardRef(() => AccrualSuspensionService))
    private accrualSuspensionService: AccrualSuspensionService,
  ) {}

  // ==================== ENTITLEMENT CRUD ====================

  /**
   * Create entitlement for an employee
   */
  async createEntitlement(
    createEntitlementDto: CreateLeaveEntitlementDto,
  ): Promise<LeaveEntitlementDocument> {
    // Validate employee exists
    const employee = await this.employeeService.findById(createEntitlementDto.employeeId);
    if (!employee) {
      throw new NotFoundException(
        `Employee with ID ${createEntitlementDto.employeeId} not found`,
      );
    }

    // Validate leave type exists
    const leaveType = await this.leaveTypeModel.findById(createEntitlementDto.leaveTypeId);
    if (!leaveType) {
      throw new NotFoundException(
        `Leave type with ID ${createEntitlementDto.leaveTypeId} not found`,
      );
    }

    // Check if entitlement already exists for this employee + leave type
    const existing = await this.entitlementModel.findOne({
      employeeId: new Types.ObjectId(createEntitlementDto.employeeId),
      leaveTypeId: new Types.ObjectId(createEntitlementDto.leaveTypeId),
    });
    if (existing) {
      throw new BadRequestException(
        `Entitlement already exists for this employee and leave type. Use update instead.`,
      );
    }

    // Get policy - REQUIRED for creating entitlements
    const policy = await this.leavePolicyModel.findOne({
      leaveTypeId: new Types.ObjectId(createEntitlementDto.leaveTypeId),
    });

    if (!policy) {
      throw new NotFoundException(
        `No policy found for leave type ${createEntitlementDto.leaveTypeId}. Cannot create entitlement without a policy.`,
      );
    }

    // Log policy values for debugging initial accrual issues
    try {
      console.log('[ENTITLEMENT_CREATE] Policy values:', {
        policyId: policy._id?.toString?.() ?? null,
        accrualMethod: policy.accrualMethod,
        monthlyRate: policy.monthlyRate,
        yearlyRate: policy.yearlyRate,
        roundingRule: policy.roundingRule,
        dtoYearlyEntitlement: createEntitlementDto.yearlyEntitlement ?? null,
      });
    } catch (e) {
      // swallow logging errors to avoid blocking entitlement creation
      console.error('[ENTITLEMENT_CREATE] Failed to log policy values', e?.message ?? e);
    }

    // Validate minimum tenure requirement
    if (policy.eligibility?.minTenureMonths && policy.eligibility.minTenureMonths > 0) {
      const hireDate = employee.dateOfHire ? new Date(employee.dateOfHire) : null;
      
      if (!hireDate) {
        throw new BadRequestException(
          `Employee does not have a hire date set. Cannot validate tenure requirement.`,
        );
      }

      const now = new Date();
      const tenureMonths = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());

      if (tenureMonths < policy.eligibility.minTenureMonths) {
        throw new BadRequestException(
          `Employee does not meet minimum tenure requirement of ${policy.eligibility.minTenureMonths} months. Current tenure: ${tenureMonths} months.`,
        );
      }
    }

    // Calculate initial values based on policy
    // Use yearlyEntitlement from DTO if provided, otherwise calculate from policy
    const monthlyRate = policy.monthlyRate || 0;
    const fullYearly = policy.accrualMethod === AccrualMethod.MONTHLY ? monthlyRate * 12 : (policy.yearlyRate || 0);
    let yearlyEntitlement = createEntitlementDto.yearlyEntitlement ?? fullYearly;
    console.log('[ENTITLEMENT_CREATE] Computed yearlyEntitlement:', { 
      fullYearly, 
      yearlyEntitlement, 
      monthlyRate,
      fromDTO: createEntitlementDto.yearlyEntitlement,
      willUse: yearlyEntitlement 
    });
    
    // Determine initial accrued based on accrual method
    // ALWAYS recalculate based on the yearlyEntitlement value
    let initialAccrued: number;
    
    // Calculate next reset date (January 1st of next year)
    const today = new Date();
    const nextResetDate = new Date(today.getFullYear() + 1, 0, 1);
    
    if (policy.accrualMethod === AccrualMethod.MONTHLY) {
      // Monthly accrual: recalculate monthly rate from yearlyEntitlement
      // Grant first month's worth immediately
      initialAccrued = yearlyEntitlement / 12;
    } else if (policy.accrualMethod === AccrualMethod.YEARLY) {
      // Yearly accrual: grant full entitlement upfront
      initialAccrued = yearlyEntitlement;
    } else if (policy.accrualMethod === AccrualMethod.PER_TERM) {
      // Per term accrual: grant half of yearly entitlement at start
      // The other half will be granted after 6 months
      initialAccrued = yearlyEntitlement / 2;
      console.log('[ENTITLEMENT_CREATE] PER_TERM calculation:', {
        yearlyEntitlement,
        halfCalculated: yearlyEntitlement / 2,
        initialAccrued
      });
    } else {
      // Default to yearly
      initialAccrued = yearlyEntitlement;
    }

    // Apply rounding rule
    const roundedAccrual = this.applyRoundingRule(initialAccrued, policy.roundingRule);
    console.log('[ENTITLEMENT_CREATE] After rounding:', {
      initialAccrued,
      roundingRule: policy.roundingRule,
      roundedAccrual
    });

    const remaining = roundedAccrual - (createEntitlementDto.taken ?? 0);

    const entitlement = new this.entitlementModel({
      ...createEntitlementDto,
      employeeId: new Types.ObjectId(createEntitlementDto.employeeId),
      leaveTypeId: new Types.ObjectId(createEntitlementDto.leaveTypeId),
      yearlyEntitlement: yearlyEntitlement,
      accruedActual: initialAccrued,
      accruedRounded: roundedAccrual,
      remaining: remaining,
      lastAccrualDate: createEntitlementDto.lastAccrualDate ?? new Date(),
      nextResetDate,
    });

    return entitlement.save();
  }

  /**
   * Get all entitlements
   */
  async getAllEntitlements(): Promise<LeaveEntitlementDocument[]> {
    return this.entitlementModel
      .find()
      .populate('employeeId', 'firstName lastName employeeNumber')
      .populate('leaveTypeId', 'code name')
      .exec();
  }

  /**
   * Get entitlements by employee
   */
  async getEntitlementsByEmployee(employeeId: string): Promise<LeaveEntitlementDocument[]> {
    return this.entitlementModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .populate('leaveTypeId', 'code name')
      .exec();
  }

  /**
   * Get entitlement by ID
   */
  async getEntitlementById(entitlementId: string): Promise<LeaveEntitlementDocument> {
    const entitlement = await this.entitlementModel
      .findById(entitlementId)
      .populate('employeeId', 'firstName lastName employeeNumber')
      .populate('leaveTypeId', 'code name')
      .exec();

    if (!entitlement) {
      throw new NotFoundException(`Entitlement with ID ${entitlementId} not found`);
    }
    return entitlement;
  }

  /**
   * Get specific entitlement by employee and leave type
   */
  async getEntitlementByEmployeeAndType(
    employeeId: string,
    leaveTypeId: string,
  ): Promise<LeaveEntitlementDocument> {
    const entitlement = await this.entitlementModel
      .findOne({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
      })
      .populate('leaveTypeId', 'code name')
      .exec();

    if (!entitlement) {
      throw new NotFoundException(
        `Entitlement not found for employee ${employeeId} and leave type ${leaveTypeId}`,
      );
    }
    return entitlement;
  }

  /**
   * Update entitlement
   */
  async updateEntitlement(
    entitlementId: string,
    updateEntitlementDto: UpdateLeaveEntitlementDto,
  ): Promise<LeaveEntitlementDocument> {
    const entitlement = await this.entitlementModel.findById(entitlementId);
    if (!entitlement) {
      throw new NotFoundException(`Entitlement with ID ${entitlementId} not found`);
    }

    Object.assign(entitlement, updateEntitlementDto);
    
    // Recalculate remaining if taken or pending changed
    if (updateEntitlementDto.taken !== undefined || updateEntitlementDto.pending !== undefined) {
      entitlement.remaining = 
        entitlement.yearlyEntitlement + 
        entitlement.carryForward + 
        entitlement.accruedRounded - 
        entitlement.taken - 
        entitlement.pending;
    }

    return entitlement.save();
  }

  /**
   * Delete entitlement
   */
  async deleteEntitlement(entitlementId: string): Promise<{ message: string }> {
    const result = await this.entitlementModel.findByIdAndDelete(entitlementId);
    if (!result) {
      throw new NotFoundException(`Entitlement with ID ${entitlementId} not found`);
    }
    return { message: 'Entitlement deleted successfully' };
  }

  // ==================== ENTITLEMENT CALCULATIONS ====================

  /**
   * Calculate and update entitlement for an employee based on policy rules
   */
  async calculateEntitlement(
    employeeId: string,
    leaveTypeId: string,
  ): Promise<LeaveEntitlementDocument> {
    // Get or create entitlement
    let entitlement = await this.entitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    const policy = await this.leavePolicyModel.findOne({
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!policy) {
      throw new NotFoundException(`No policy found for leave type ${leaveTypeId}`);
    }

    const employee = await this.employeeService.findById(employeeId);
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Calculate tenure in months
    const hireDate = new Date(employee.dateOfHire);
    const now = new Date();
    const tenureMonths = this.calculateMonthsDifference(hireDate, now);

    // Check eligibility based on waiting period
    if (policy.eligibility?.minTenureMonths && tenureMonths < policy.eligibility.minTenureMonths) {
      throw new BadRequestException(
        `Employee does not meet minimum tenure requirement of ${policy.eligibility.minTenureMonths} months`,
      );
    }

    if (!entitlement) {
      // Create new entitlement
      entitlement = new this.entitlementModel({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
        yearlyEntitlement: policy.yearlyRate,
        accruedActual: 0,
        accruedRounded: 0,
        carryForward: 0,
        taken: 0,
        pending: 0,
        remaining: 0,
        lastAccrualDate: new Date(),
      });
    }

    // Calculate accrued based on accrual method
    const accrued = this.calculateAccrual(policy, tenureMonths);
    
    // Apply rounding rule
    const roundedAccrual = this.applyRoundingRule(accrued, policy.roundingRule);

    entitlement.accruedActual = accrued;
    entitlement.accruedRounded = roundedAccrual;
    entitlement.yearlyEntitlement = policy.yearlyRate;
    entitlement.lastAccrualDate = new Date();

    // Calculate remaining balance
    entitlement.remaining = 
      entitlement.yearlyEntitlement + 
      entitlement.carryForward + 
      entitlement.accruedRounded - 
      entitlement.taken - 
      entitlement.pending;

    return entitlement.save();
  }

  /**
   * Run accrual calculation for all employees (scheduled job)
   * REQ-042: Integrates accrual suspension to exclude unpaid leave and suspension periods
   */
  async runMonthlyAccrual(): Promise<{ processed: number; errors: string[] }> {
    const entitlements = await this.entitlementModel.find().exec();
    let processed = 0;
    const errors: string[] = [];

    // Calculate period for this month's accrual
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    for (const entitlement of entitlements) {
      try {
        const policy = await this.leavePolicyModel.findOne({
          leaveTypeId: entitlement.leaveTypeId,
        });

        if (!policy) continue;

        // Calculate monthly accrual
        if (policy.accrualMethod === AccrualMethod.MONTHLY) {
          // REQ-042: Calculate actual service days (excludes unpaid leave and suspensions)
          const serviceDays = await this.accrualSuspensionService.calculateActualServiceDays(
            entitlement.employeeId.toString(),
            periodStart,
            periodEnd,
          );

          // Calculate accrual based on actual service days percentage
          // Use entitlement's yearlyEntitlement as source of truth for calculation
          const originalAccrual = entitlement.yearlyEntitlement 
            ? entitlement.yearlyEntitlement / 12 
            : policy.monthlyRate;
          const adjustedAccrual = (originalAccrual * serviceDays.serviceDaysPercentage) / 100;

          // Only accrue if there were actual service days
          if (serviceDays.actualServiceDays > 0) {
            entitlement.accruedActual += adjustedAccrual;
            entitlement.accruedRounded = this.applyRoundingRule(
              entitlement.accruedActual,
              policy.roundingRule,
            );
            entitlement.remaining = 
              entitlement.yearlyEntitlement + 
              entitlement.carryForward + 
              entitlement.accruedRounded - 
              entitlement.taken - 
              entitlement.pending;
            entitlement.lastAccrualDate = new Date();
            await entitlement.save();

            // Log suspension adjustment if accrual was reduced
            if (adjustedAccrual < originalAccrual) {
              const deductedAmount = originalAccrual - adjustedAccrual;
              await this.adjustmentModel.create({
                employeeId: entitlement.employeeId,
                leaveTypeId: entitlement.leaveTypeId,
                adjustmentType: AdjustmentType.DEDUCT,
                amount: deductedAmount,
                reason: `[AUTO_ACCRUAL_SUSPENSION] Month: ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}. ` +
                  `Unpaid leave: ${serviceDays.unpaidLeaveDays} days, Suspension: ${serviceDays.suspensionDays} days, ` +
                  `Extended leave (>30d): ${serviceDays.extendedLeaveDays} days. ` +
                  `Service days: ${serviceDays.actualServiceDays}/${serviceDays.totalCalendarDays} (${serviceDays.serviceDaysPercentage.toFixed(1)}%). ` +
                  `Accrued: ${adjustedAccrual.toFixed(2)} instead of ${originalAccrual}`,
                hrUserId: new Types.ObjectId('000000000000000000000000'), // System user
              });
            }

            processed++;
          }
        } else if (policy.accrualMethod === AccrualMethod.PER_TERM) {
          // Per-term accrual: Grant second half of yearly entitlement after 6 months
          // Check if it's been 6 months since creation or last term accrual
          const employee = await this.employeeService.findById(entitlement.employeeId.toString());
          if (!employee) continue;

          const hireDate = new Date(employee.dateOfHire);
          const monthsSinceHire = this.calculateMonthsDifference(hireDate, now);
          
          // Grant second half at 6-month mark (July 1st if hired Jan-Jun, Jan 1st if hired Jul-Dec)
          const currentMonth = now.getMonth() + 1; // 1-12
          const shouldGrantSecondHalf = 
            (currentMonth === 7 && monthsSinceHire >= 6 && monthsSinceHire < 12) || // Mid-year grant
            (currentMonth === 1 && monthsSinceHire >= 6); // Year-end/start grant for those hired mid-year

          if (shouldGrantSecondHalf) {
            // Check if we haven't already granted the second half this period
            const lastAccrual = entitlement.lastAccrualDate;
            const alreadyGrantedThisPeriod = lastAccrual && 
              lastAccrual.getFullYear() === now.getFullYear() && 
              lastAccrual.getMonth() === now.getMonth();

            if (!alreadyGrantedThisPeriod) {
              const secondHalf = entitlement.yearlyEntitlement / 2;
              entitlement.accruedActual += secondHalf;
              entitlement.accruedRounded = this.applyRoundingRule(
                entitlement.accruedActual,
                policy.roundingRule,
              );
              entitlement.remaining = 
                entitlement.yearlyEntitlement + 
                entitlement.carryForward + 
                entitlement.accruedRounded - 
                entitlement.taken - 
                entitlement.pending;
              entitlement.lastAccrualDate = new Date();
              await entitlement.save();

              // Log the second half grant
              await this.adjustmentModel.create({
                employeeId: entitlement.employeeId,
                leaveTypeId: entitlement.leaveTypeId,
                adjustmentType: AdjustmentType.ADD,
                amount: secondHalf,
                reason: `[PER_TERM_ACCRUAL] Second half of yearly entitlement granted after 6 months. Month: ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
                hrUserId: new Types.ObjectId('000000000000000000000000'),
              });

              processed++;
            }
          }
        }
      } catch (error) {
        errors.push(`Error processing entitlement ${entitlement._id}: ${error.message}`);
      }
    }

    return { processed, errors };
  }

  /**
   * Process year-end carry-forward for all employees
   */
  async processYearEndCarryForward(): Promise<{ processed: number; errors: string[] }> {
    const entitlements = await this.entitlementModel.find().exec();
    let processed = 0;
    const errors: string[] = [];

    for (const entitlement of entitlements) {
      try {
        const policy = await this.leavePolicyModel.findOne({
          leaveTypeId: entitlement.leaveTypeId,
        });

        if (!policy) continue;

        if (policy.carryForwardAllowed) {
          // Calculate carry-forward amount
          let carryForwardAmount = entitlement.remaining;
          
          // Apply max carry-forward limit
          if (policy.maxCarryForward && carryForwardAmount > policy.maxCarryForward) {
            carryForwardAmount = policy.maxCarryForward;
          }

          // Calculate next reset date (January 1st of next year)
          const today = new Date();
          const nextResetDate = new Date(today.getFullYear() + 1, 0, 1);

          // Apply expiry after months if configured (overrides annual reset)
          const expiryDate = policy.expiryAfterMonths
            ? new Date(new Date().setMonth(new Date().getMonth() + policy.expiryAfterMonths))
            : nextResetDate;

          // Reset for new year
          entitlement.carryForward = carryForwardAmount;
          entitlement.accruedActual = 0;
          entitlement.accruedRounded = 0;
          entitlement.taken = 0;
          entitlement.pending = 0;
          entitlement.remaining = entitlement.yearlyEntitlement + carryForwardAmount;
          entitlement.nextResetDate = expiryDate;
          
          console.log(`Reset entitlement for employee ${entitlement.employeeId}: next reset on ${expiryDate}`);
          await entitlement.save();
          processed++;
        } else {
          // No carry-forward - reset to zero
          entitlement.carryForward = 0;
          entitlement.accruedActual = 0;
          entitlement.accruedRounded = 0;
          entitlement.taken = 0;
          entitlement.pending = 0;
          entitlement.remaining = entitlement.yearlyEntitlement;
          
          await entitlement.save();
          processed++;
        }
      } catch (error) {
        errors.push(`Error processing entitlement ${entitlement._id}: ${error.message}`);
      }
    }

    return { processed, errors };
  }

  /**
   * Process expired carry-forward balances
   */
  async processExpiredCarryForward(): Promise<{ processed: number; expired: number }> {
    const now = new Date();
    const expiredEntitlements = await this.entitlementModel
      .find({
        nextResetDate: { $lte: now },
        carryForward: { $gt: 0 },
      })
      .exec();

    let processed = 0;
    let expired = 0;

    for (const entitlement of expiredEntitlements) {
      const expiredAmount = entitlement.carryForward;
      entitlement.carryForward = 0;
      entitlement.remaining -= expiredAmount;
      entitlement.nextResetDate = undefined;
      await entitlement.save();
      
      processed++;
      expired += expiredAmount;
    }

    return { processed, expired };
  }

  /**
   * Get entitlement balance summary for an employee
   */
  async getEmployeeBalanceSummary(employeeId: string): Promise<{
    employeeId: string;
    balances: {
      leaveTypeId: string;
      leaveTypeName: string;
      leaveTypeCode: string;
      yearlyEntitlement: number;
      accrued: number;
      carryForward: number;
      taken: number;
      pending: number;
      remaining: number;
      requiresAttachment?: boolean;
      attachmentType?: string;
    }[];
  }> {
    // Check if employee exists
    const employee = await this.employeeService.findById(employeeId);
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Fetch existing entitlements
    const entitlements = await this.entitlementModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .populate('leaveTypeId', 'code name requiresAttachment attachmentType')
      .exec();

    // Filter out entitlements with null leaveTypeId
    const validEntitlements = entitlements.filter((e) => e.leaveTypeId != null);

    // Filter out leave types the employee is not eligible for
    const eligibleBalances: Array<{
      leaveTypeId: string;
      leaveTypeName: string;
      leaveTypeCode: string;
      yearlyEntitlement: number;
      accrued: number;
      carryForward: number;
      taken: number;
      pending: number;
      remaining: number;
      requiresAttachment?: boolean;
      attachmentType?: string;
    }> = [];
    
    for (const e of validEntitlements) {
      const leaveType = e.leaveTypeId as any;
      const leaveTypeId = leaveType._id?.toString() || e.leaveTypeId.toString();
      
      // Check eligibility
      const eligibilityCheck = await this.leaveEligibilityService.isEmployeeEligibleForLeaveType(
        employeeId,
        leaveTypeId,
        employee,
      );

      // Only include if employee is eligible
      if (eligibilityCheck.eligible) {
        eligibleBalances.push({
          leaveTypeId,
          leaveTypeName: leaveType.name || 'Unknown',
          leaveTypeCode: leaveType.code || 'N/A',
          yearlyEntitlement: e.yearlyEntitlement,
          accrued: e.accruedRounded,
          carryForward: e.carryForward,
          taken: e.taken,
          pending: e.pending,
          remaining: e.remaining,
          requiresAttachment: leaveType.requiresAttachment,
          attachmentType: leaveType.attachmentType,
        });
      }
    }

    return {
      employeeId,
      balances: eligibleBalances,
    };
  }

  /**
   * Check if a policy is eligible for an employee
   */
  private async checkPolicyEligibility(policy: LeavePolicyDocument, employee: any): Promise<boolean> {
    // If no eligibility rules, policy applies to all
    if (!policy.eligibility || Object.keys(policy.eligibility).length === 0) {
      return true;
    }

    const eligibility = policy.eligibility;

    // Check contract type
    if (eligibility.contractType && eligibility.contractType.length > 0) {
      if (!eligibility.contractType.includes(employee.contractType)) {
        return false;
      }
    }

    // Check nationality
    if (eligibility.nationality) {
      if (employee.nationality !== eligibility.nationality) {
        return false;
      }
    }

    // Check minimum tenure
    if (eligibility.minTenureMonths) {
      const tenureMonths = this.calculateTenureMonths(employee.dateOfHire);
      if (tenureMonths < eligibility.minTenureMonths) {
        return false;
      }
    }

    // Check gender
    if (eligibility.gender) {
      if (employee.gender !== eligibility.gender) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate policy entitlement for an employee
   */
  private calculatePolicyEntitlement(policy: LeavePolicyDocument, employee: any): number {
    // Calculate yearly entitlement based on accrual method
    let entitlement = 0;
    
    if (policy.accrualMethod === 'monthly' && policy.monthlyRate) {
      // For monthly accrual, calculate yearly entitlement as monthlyRate * 12
      entitlement = policy.monthlyRate * 12;
    } else {
      // For other methods, use the yearly rate
      entitlement = policy.yearlyRate || 0;
    }
    
    console.log('calculatePolicyEntitlement:', {
      yearlyRate: policy.yearlyRate,
      monthlyRate: policy.monthlyRate,
      accrualMethod: policy.accrualMethod,
      calculatedEntitlement: entitlement
    });

    // Check for tenure-based increases
    if (policy.eligibility?.tenureBasedIncrease) {
      const tenureMonths = this.calculateTenureMonths(employee.dateOfHire);
      const tenureYears = Math.floor(tenureMonths / 12);
      
      const increases = policy.eligibility.tenureBasedIncrease;
      for (const increase of increases) {
        if (tenureYears >= increase.yearsOfService) {
          entitlement = increase.entitlement;
        }
      }
    }
    
    console.log('Final calculated entitlement:', entitlement);

    return entitlement;
  }

  /**
   * Calculate employee tenure in months
   */
  private calculateTenureMonths(dateOfHire: Date): number {
    const now = new Date();
    const hireDate = new Date(dateOfHire);
    return this.calculateMonthsDifference(hireDate, now);
  }

  // ==================== HELPER METHODS ====================

  private calculateMonthsDifference(startDate: Date, endDate: Date): number {
    const years = endDate.getFullYear() - startDate.getFullYear();
    const months = endDate.getMonth() - startDate.getMonth();
    return years * 12 + months;
  }

  private calculateAccrual(policy: LeavePolicyDocument, tenureMonths: number): number {
    switch (policy.accrualMethod) {
      case AccrualMethod.MONTHLY:
        return policy.monthlyRate * tenureMonths;
      case AccrualMethod.YEARLY:
        return policy.yearlyRate * Math.floor(tenureMonths / 12);
      case AccrualMethod.PER_TERM:
        // Per term: Half at start, half after 6 months
        // Grant one full yearly entitlement per complete 6-month period (up to 2 halves per year)
        const completeSixMonthPeriods = Math.floor(tenureMonths / 6);
        return policy.yearlyRate * Math.min(completeSixMonthPeriods, 2) * 0.5;
      default:
        return 0;
    }
  }

  /**
   * Check if employee is within their first leave year
   */
  private isWithinFirstLeaveYear(hireDate: Date, leaveYearDates: any): boolean {
    const now = new Date();
    const oneYearAfterHire = new Date(hireDate);
    oneYearAfterHire.setFullYear(oneYearAfterHire.getFullYear() + 1);
    
    // Employee is in first year if current date is before their first anniversary
    return now < oneYearAfterHire;
  }

  private applyRoundingRule(value: number, rule: RoundingRule): number {
    switch (rule) {
      case RoundingRule.ROUND:
        return Math.round(value);
      case RoundingRule.ROUND_UP:
        return Math.ceil(value);
      case RoundingRule.ROUND_DOWN:
        return Math.floor(value);
      case RoundingRule.NONE:
      default:
        return value;
    }
  }

  // ==================== SCHEDULED JOBS ====================

  /**
   * Monthly accrual job - runs on the 1st of each month at midnight
   */
  // Uncomment to enable scheduled job:
  // @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async scheduledMonthlyAccrual(): Promise<void> {
    console.log('Running scheduled monthly accrual...');
    const result = await this.runMonthlyAccrual();
    console.log(`Monthly accrual completed. Processed: ${result.processed}, Errors: ${result.errors.length}`);
  }

  /**
   * Year-end carry-forward job - runs on January 1st at midnight
   */
  // Uncomment to enable scheduled job:
  // @Cron('0 0 1 1 *') // January 1st at midnight
  async scheduledYearEndCarryForward(): Promise<void> {
    console.log('Running scheduled year-end carry-forward...');
    const result = await this.processYearEndCarryForward();
    console.log(`Year-end carry-forward completed. Processed: ${result.processed}`);
  }

  /**
   * Daily expiry check - runs every day at midnight
   */
  // Uncomment to enable scheduled job:
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduledExpiryCheck(): Promise<void> {
    console.log('Running scheduled expiry check...');
    const result = await this.processExpiredCarryForward();
    console.log(`Expiry check completed. Processed: ${result.processed}, Expired days: ${result.expired}`);
  }

  /**
   * Fix existing entitlements - grant full yearly entitlement upfront
   */
  async fixExistingEntitlements(): Promise<{ updated: number }> {
    const entitlements = await this.entitlementModel.find({
      accruedActual: 0,
      accruedRounded: 0,
    });

    let updated = 0;
    for (const entitlement of entitlements) {
      entitlement.accruedActual = entitlement.yearlyEntitlement;
      entitlement.accruedRounded = entitlement.yearlyEntitlement;
      await entitlement.save();
      updated++;
    }

    return { updated };
  }

  /**
   * Fix PER_TERM entitlements with incorrect initial accrual
   * Recalculates and grants correct half (50%) of yearlyEntitlement
   */
  async fixPerTermEntitlements(): Promise<{ 
    checked: number; 
    fixed: number; 
    details: Array<{ employeeId: string; leaveTypeId: string; before: number; after: number }> 
  }> {
    const entitlements = await this.entitlementModel.find().populate('leaveTypeId');
    let checked = 0;
    let fixed = 0;
    const details: Array<{ employeeId: string; leaveTypeId: string; before: number; after: number }> = [];

    for (const entitlement of entitlements) {
      const policy = await this.leavePolicyModel.findOne({
        leaveTypeId: entitlement.leaveTypeId,
      });

      if (!policy || policy.accrualMethod !== AccrualMethod.PER_TERM) {
        continue;
      }

      checked++;

      // Expected initial accrual: half of yearlyEntitlement
      const expectedInitialAccrued = entitlement.yearlyEntitlement / 2;
      
      // Check if current accrued is incorrect (not equal to expected half)
      // Allow small tolerance for floating point comparison
      const tolerance = 0.01;
      if (Math.abs(entitlement.accruedActual - expectedInitialAccrued) > tolerance) {
        const beforeAccrued = entitlement.accruedActual;
        
        // Fix the accrual
        entitlement.accruedActual = expectedInitialAccrued;
        entitlement.accruedRounded = this.applyRoundingRule(expectedInitialAccrued, policy.roundingRule);
        
        // Recalculate remaining
        entitlement.remaining = 
          entitlement.yearlyEntitlement + 
          entitlement.carryForward + 
          entitlement.accruedRounded - 
          entitlement.taken - 
          entitlement.pending;

        await entitlement.save();

        details.push({
          employeeId: entitlement.employeeId.toString(),
          leaveTypeId: entitlement.leaveTypeId.toString(),
          before: beforeAccrued,
          after: entitlement.accruedActual,
        });

        fixed++;
      }
    }

    return { checked, fixed, details };
  }

  /**
   * Debug helper to show policy and entitlement details
   */
  async debugEntitlement(employeeId: string, leaveTypeId: string): Promise<any> {
    const entitlement = await this.entitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    }).populate('leaveTypeId');

    const policy = await this.leavePolicyModel.findOne({
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    return {
      entitlement: entitlement ? {
        _id: entitlement._id,
        yearlyEntitlement: entitlement.yearlyEntitlement,
        accruedActual: entitlement.accruedActual,
        accruedRounded: entitlement.accruedRounded,
        carryForward: entitlement.carryForward,
        taken: entitlement.taken,
        pending: entitlement.pending,
        remaining: entitlement.remaining,
        lastAccrualDate: entitlement.lastAccrualDate,
      } : null,
      policy: policy ? {
        _id: policy._id,
        accrualMethod: policy.accrualMethod,
        monthlyRate: policy.monthlyRate,
        yearlyRate: policy.yearlyRate,
        roundingRule: policy.roundingRule,
        carryForwardAllowed: policy.carryForwardAllowed,
        maxCarryForward: policy.maxCarryForward,
      } : null,
      calculation: policy && entitlement ? {
        expectedInitialAccrued: entitlement.yearlyEntitlement / 2,
        actualAccrued: entitlement.accruedActual,
        difference: entitlement.accruedActual - (entitlement.yearlyEntitlement / 2),
        isCorrect: Math.abs(entitlement.accruedActual - (entitlement.yearlyEntitlement / 2)) < 0.01,
      } : null,
    };
  }
}
