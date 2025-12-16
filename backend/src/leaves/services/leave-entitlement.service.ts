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
import { LeaveYearConfigService } from './leave-year-config.service';
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
    private leaveYearConfigService: LeaveYearConfigService,
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
    // Check if automatic entitlement creation is disabled
    const automaticEntitlementEnabled = process.env.AUTOMATIC_ENTITLEMENT_ENABLED !== 'false';
    
    if (!automaticEntitlementEnabled) {
      throw new BadRequestException(
        'Automatic entitlement creation is disabled. Please use manual entitlement management through Personalized Entitlements.'
      );
    }
    
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

    // Get policy for initial calculation
    const policy = await this.leavePolicyModel.findOne({
      leaveTypeId: new Types.ObjectId(createEntitlementDto.leaveTypeId),
    });

    // Calculate initial values based on policy
    const fullYearly = createEntitlementDto.yearlyEntitlement ?? policy?.yearlyRate ?? 0;
    let yearlyEntitlement = fullYearly;
    
    // Calculate next reset date using LeaveYearConfigService
    const leaveYearDates = this.leaveYearConfigService.calculateLeaveYearDates(
      new Date(),
      employee.dateOfHire ? new Date(employee.dateOfHire) : undefined,
    );
    const nextResetDate = leaveYearDates.nextResetDate;
    
    // Determine initial accrued/remaining. Keep `yearlyEntitlement` as the full policy amount
    // and only pro-rate the accrued amount for employees in their first leave year.
    const leaveYearConfig = await this.leaveYearConfigService.getConfig();
    // For monthly-accrual policies, initialize accrued to the monthly rate (first month's accrual).
    // Do not pro-rate the full-year amount into a small value — users expect the monthly accrual (e.g. 1.75).
    let initialAccrued = fullYearly;
    if (policy?.accrualMethod === AccrualMethod.MONTHLY) {
      initialAccrued = policy.monthlyRate ?? fullYearly / 12;
    }

    const remaining = (createEntitlementDto.remaining ?? initialAccrued) - (createEntitlementDto.taken ?? 0);

    const entitlement = new this.entitlementModel({
      ...createEntitlementDto,
      employeeId: new Types.ObjectId(createEntitlementDto.employeeId),
      leaveTypeId: new Types.ObjectId(createEntitlementDto.leaveTypeId),
      yearlyEntitlement: yearlyEntitlement,
      accruedActual: initialAccrued,
      accruedRounded: initialAccrued,
      remaining: createEntitlementDto.remaining ?? remaining,
      lastAccrualDate: createEntitlementDto.lastAccrualDate ?? new Date(),
      nextResetDate, // (REQ-012) Leave year config integration
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
    // Check if automatic entitlement calculation is disabled
    const automaticEntitlementEnabled = process.env.AUTOMATIC_ENTITLEMENT_ENABLED !== 'false';
    
    if (!automaticEntitlementEnabled) {
      throw new BadRequestException(
        'Automatic entitlement calculation is disabled. Please use manual entitlement management through Personalized Entitlements.'
      );
    }
    
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
          const originalAccrual = policy.monthlyRate;
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
                  `Unpaid leave: ${serviceDays.unpaidLeaveDays} days, Suspension: ${serviceDays.suspensionDays} days. ` +
                  `Service days: ${serviceDays.actualServiceDays}/${serviceDays.totalCalendarDays} (${serviceDays.serviceDaysPercentage.toFixed(1)}%). ` +
                  `Accrued: ${adjustedAccrual.toFixed(2)} instead of ${originalAccrual}`,
                hrUserId: new Types.ObjectId('000000000000000000000000'), // System user
              });
            }

            processed++;
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

          // Calculate next reset date using LeaveYearConfigService
          const employee = await this.employeeService.findById(entitlement.employeeId.toString());
          const leaveYearDates = this.leaveYearConfigService.calculateLeaveYearDates(
            new Date(),
            employee?.dateOfHire ? new Date(employee.dateOfHire) : undefined,
          );
          const nextResetDate = leaveYearDates.nextResetDate;

          // Apply expiry after months if configured (overrides leave year config)
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

    // Find existing entitlements
    let entitlements = await this.entitlementModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .populate('leaveTypeId', 'code name requiresAttachment attachmentType')
      .exec();

    // Auto-create missing entitlements based on policies
    // This ensures new leave types get entitlements even if employee already has some
    await this.autoCreateMissingEntitlements(employeeId, employee, entitlements);
    
    // Re-fetch entitlements to include any newly created ones
    entitlements = await this.entitlementModel
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
   * Auto-create missing entitlements for an employee based on applicable policies
   * This checks which leave types have policies but no entitlements, and creates them
   */
  private async autoCreateMissingEntitlements(
    employeeId: string, 
    employee: any, 
    existingEntitlements: any[]
  ): Promise<void> {
    // Respect environment flag to prevent implicit entitlement creation
    const automaticEntitlementEnabled = process.env.AUTOMATIC_ENTITLEMENT_ENABLED !== 'false';
    if (!automaticEntitlementEnabled) {
      console.log('Automatic entitlement creation is disabled. Skipping autoCreateMissingEntitlements.');
      return;
    }
    try {
      // Get all leave policies
      const policies = await this.leavePolicyModel
        .find()
        .populate('leaveTypeId')
        .exec();

      if (!policies || policies.length === 0) {
        return;
      }

      // Get the leave type IDs that already have entitlements
      const existingLeaveTypeIds = existingEntitlements
        .map(e => e.leaveTypeId?._id?.toString() || e.leaveTypeId?.toString())
        .filter(id => id);

      // Process each policy to create missing entitlements
      for (const policy of policies) {
        try {
          const leaveType = policy.leaveTypeId as any;
          
          if (!leaveType) {
            continue;
          }

          const leaveTypeId = leaveType._id.toString();

          // Skip if entitlement already exists
          if (existingLeaveTypeIds.includes(leaveTypeId)) {
            continue;
          }

          // Check if policy is eligible for this employee
          const isEligible = await this.checkPolicyEligibility(policy, employee);
          
          if (isEligible) {
            // Calculate entitlement based on policy
            // `fullYearly` is the full-year entitlement derived from policy
            const fullYearly = this.calculatePolicyEntitlement(policy, employee);
            let entitlement = fullYearly;
            
            // Calculate next reset date
            const leaveYearDates = this.leaveYearConfigService.calculateLeaveYearDates(
              new Date(),
              employee.dateOfHire ? new Date(employee.dateOfHire) : undefined,
            );
            const nextResetDate = leaveYearDates.nextResetDate;
            
            // Apply pro-rating for first year if enabled (only for monthly accrual)
            // Yearly accrual grants full entitlement upfront
            const leaveYearConfig = await this.leaveYearConfigService.getConfig();
            // Initialize accrued to monthlyRate for monthly accrual policies (first month's accrual)
            let initialAccrued = fullYearly;
            if (policy.accrualMethod === AccrualMethod.MONTHLY) {
              initialAccrued = policy.monthlyRate ?? fullYearly / 12;
            }

            // Create the missing entitlement. `yearlyEntitlement` remains the full policy amount;
            // `accruedActual`/`accruedRounded` reflect any pro-rating so far.
            await this.entitlementModel.create({
              employeeId: new Types.ObjectId(employeeId),
              leaveTypeId: policy.leaveTypeId,
              yearlyEntitlement: fullYearly,
              accruedActual: initialAccrued,
              accruedRounded: initialAccrued,
              carryForward: 0,
              taken: 0,
              pending: 0,
              remaining: initialAccrued,
              lastAccrualDate: new Date(),
              nextResetDate,
            });

            console.log(`[Auto-Create] Created entitlement for ${leaveType.code} - ${leaveType.name}: ${entitlement} days`);
          }
        } catch (policyError) {
          console.error(`Error processing policy ${policy._id}:`, policyError);
        }
      }
    } catch (error) {
      console.error(`Error in autoCreateMissingEntitlements:`, error);
    }
  }

  /**
   * Auto-create entitlements for an employee based on applicable policies
   */
  private async autoCreateEntitlementsForEmployee(employeeId: string, employee: any): Promise<void> {
    // Check if automatic entitlement creation is disabled
    const automaticEntitlementEnabled = process.env.AUTOMATIC_ENTITLEMENT_ENABLED !== 'false';
    
    if (!automaticEntitlementEnabled) {
      console.log('Automatic entitlement creation is disabled. Use manual entitlement management instead.');
      return;
    }
    
    try {
      // Get all leave policies
      const policies = await this.leavePolicyModel
        .find()
        .populate('leaveTypeId')
        .exec();

      if (!policies || policies.length === 0) {
        console.log(`No leave policies found for employee ${employeeId}`);
        return;
      }

      for (const policy of policies) {
        try {
          // Check if policy is eligible for this employee
          const isEligible = await this.checkPolicyEligibility(policy, employee);
          
          if (isEligible) {
            const leaveType = policy.leaveTypeId as any;
            
            if (!leaveType) {
              console.error(`Policy ${policy._id} has no leaveTypeId`);
              continue;
            }
            
            // Calculate entitlement based on policy
            const fullYearly = this.calculatePolicyEntitlement(policy, employee);
            let entitlement = fullYearly;
            
            // Calculate next reset date using LeaveYearConfigService
            const leaveYearDates = this.leaveYearConfigService.calculateLeaveYearDates(
              new Date(),
              employee.dateOfHire ? new Date(employee.dateOfHire) : undefined,
            );
            const nextResetDate = leaveYearDates.nextResetDate;
            
            // Apply pro-rating for first year if enabled in config (only for monthly accrual)
            // Yearly accrual grants full entitlement upfront
            const leaveYearConfig = await this.leaveYearConfigService.getConfig();
            // Initialize accrued to monthlyRate for monthly accrual policies (first month's accrual)
            let initialAccrued = fullYearly;
            if (policy.accrualMethod === AccrualMethod.MONTHLY) {
              initialAccrued = policy.monthlyRate ?? fullYearly / 12;
            }

            // Create the entitlement. Keep `yearlyEntitlement` as full policy amount;
            // set `accruedActual`/`accruedRounded` to the pro-rated initial accrual.
            await this.entitlementModel.create({
              employeeId: new Types.ObjectId(employeeId),
              leaveTypeId: policy.leaveTypeId,
              yearlyEntitlement: fullYearly,
              accruedActual: initialAccrued,
              accruedRounded: initialAccrued,
              carryForward: 0,
              taken: 0,
              pending: 0,
              remaining: initialAccrued,
              lastAccrualDate: new Date(),
              nextResetDate, // (REQ-012) Leave year config integration
            });
          }
        } catch (policyError) {
          console.error(`Error processing policy ${policy._id}:`, policyError);
          // Continue with other policies
        }
      }
    } catch (error) {
      console.error(`Error in autoCreateEntitlementsForEmployee:`, error);
      throw error;
    }
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
        // Assuming term = 6 months
        return policy.yearlyRate * Math.floor(tenureMonths / 6) * 0.5;
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
}
