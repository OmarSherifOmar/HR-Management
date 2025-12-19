import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeaveEntitlement, LeaveEntitlementDocument } from '../models/leave-entitlement.schema';
import { LeaveAdjustment, LeaveAdjustmentDocument } from '../models/leave-adjustment.schema';
import { LeavePolicy, LeavePolicyDocument } from '../models/leave-policy.schema';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';
import { AdjustmentType } from '../enums/adjustment-type.enum';
import { AccrualMethod } from '../enums/accrual-method.enum';
import { EmployeeService } from '../../employee-profile/employee-profile.service';
import { ContractType, EmployeeStatus } from '../../employee-profile/enums/employee-profile.enums';

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
    @InjectModel('Department') private departmentModel: Model<any>,
    @InjectModel('Position') private positionModel: Model<any>,
    @Inject(forwardRef(() => EmployeeService))
    private employeeService: EmployeeService,
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

    // Get policy to check accrual method
    // Try querying with both string and ObjectId to handle mixed storage types
    let policy = await this.leavePolicyModel.findOne({
      leaveTypeId: leaveTypeId,
    }).exec();

    // If not found with string, try with ObjectId conversion
    if (!policy) {
      policy = await this.leavePolicyModel.findOne({
        leaveTypeId: new Types.ObjectId(leaveTypeId),
      }).exec();
    }

    console.log('=== ASSIGN PERSONALIZED ENTITLEMENT ===');
    console.log('Leave Type ID:', leaveTypeId);
    console.log('Yearly Entitlement:', yearlyEntitlement);
    console.log('Policy Query Result:', policy);
    console.log('Policy Details:', policy ? {
      _id: policy._id,
      leaveTypeIdStored: policy.leaveTypeId,
      leaveTypeIdType: typeof policy.leaveTypeId,
      accrualMethod: policy.accrualMethod,
      monthlyRate: policy.monthlyRate,
      yearlyRate: policy.yearlyRate,
      roundingRule: policy.roundingRule
    } : 'NO POLICY FOUND');

    // Policy is required for creating entitlements
    if (!policy) {
      throw new NotFoundException(
        `No policy found for leave type ${leaveTypeId}. Please create a leave policy before assigning entitlements.`
      );
    }

    // Find or create entitlement record
    let entitlement = await this.leaveEntitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    console.log('Existing entitlement found:', !!entitlement);

    if (!entitlement) {
      // Calculate initial accrued based on policy's accrual method
      // ALWAYS use yearlyEntitlement as the source of truth for calculation
      let initialAccrued: number;
      
      if (policy.accrualMethod === AccrualMethod.MONTHLY) {
        // Monthly accrual: recalculate monthly rate from yearlyEntitlement
        // Grant first month's worth immediately
        initialAccrued = yearlyEntitlement / 12;
        console.log('Monthly accrual detected - initial accrued (recalculated):', initialAccrued);
      } else if (policy.accrualMethod === AccrualMethod.PER_TERM) {
        // Per term accrual: grant half of yearly entitlement at start
        // The other half will be granted after 6 months
        initialAccrued = yearlyEntitlement / 2;
        console.log('Per term accrual detected - initial accrued (half):', initialAccrued);
      } else if (policy.accrualMethod === AccrualMethod.YEARLY) {
        // Yearly accrual: grant full entitlement upfront
        initialAccrued = yearlyEntitlement;
        console.log('Yearly accrual - granting full entitlement:', initialAccrued);
      } else {
        // Default to yearly
        initialAccrued = yearlyEntitlement;
        console.log('Default accrual - granting full entitlement:', initialAccrued);
      }

      // Apply rounding rule
      const roundedAccrual = this.applyRoundingRule(initialAccrued, policy.roundingRule);
      console.log('Accrued after rounding rule:', roundedAccrual);

      entitlement = new this.leaveEntitlementModel({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
        yearlyEntitlement,
        accruedActual: initialAccrued,
        accruedRounded: roundedAccrual,
        carryForward: 0,
        taken: 0,
        pending: 0,
        remaining: roundedAccrual,
      });
      
      console.log('Created new entitlement with remaining:', roundedAccrual);
    } else {
      // Entitlement already exists - update it based on accrual method
      console.log('Updating existing entitlement');
      
      // Recalculate based on policy accrual method
      // ALWAYS use yearlyEntitlement as the source of truth for calculation
      let newAccrued: number;
      
      if (policy.accrualMethod === AccrualMethod.MONTHLY) {
        // Recalculate monthly rate from yearlyEntitlement
        newAccrued = yearlyEntitlement / 12;
        console.log('Monthly accrual - setting accrued to (recalculated):', newAccrued);
      } else if (policy.accrualMethod === AccrualMethod.PER_TERM) {
        // Grant half of yearly entitlement (other half after 6 months)
        newAccrued = yearlyEntitlement / 2;
        console.log('Per term accrual - setting accrued to (half):', newAccrued);
      } else if (policy.accrualMethod === AccrualMethod.YEARLY) {
        newAccrued = yearlyEntitlement;
        console.log('Yearly accrual - setting to full entitlement:', newAccrued);
      } else {
        newAccrued = yearlyEntitlement;
        console.log('Default accrual - setting to full entitlement:', newAccrued);
      }
      
      // Apply rounding rule
      const roundedAccrual = this.applyRoundingRule(newAccrued, policy.roundingRule);
      console.log('Accrued after rounding rule:', roundedAccrual);
      
      // Update entitlement values
      const oldYearly = entitlement.yearlyEntitlement;
      const oldRemaining = entitlement.remaining;
      
      entitlement.yearlyEntitlement = yearlyEntitlement;
      entitlement.accruedActual = newAccrued;
      entitlement.accruedRounded = roundedAccrual;
      
      // Recalculate remaining based on new accrued amount (using rounded value)
      entitlement.remaining = roundedAccrual - entitlement.taken - entitlement.pending;
      
      console.log('Updated: yearlyEntitlement:', yearlyEntitlement, 'accrued:', roundedAccrual, 'remaining:', entitlement.remaining);
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
      .populate('leaveTypeId', 'code name')
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

  /**
   * Get eligibility options from database
   * Returns real data for dropdown fields in the eligibility form
   */
  async getEligibilityOptions(): Promise<{
    departments: Array<{ code: string; name: string }>;
    positions: Array<{ code: string; title: string }>;
    contractTypes: string[];
    employeeStatuses: string[];
  }> {
    // Fetch departments from database
    const departments = await this.departmentModel
      .find({ isActive: true })
      .select('code name')
      .sort({ name: 1 })
      .lean()
      .exec();

    // Fetch positions from database
    const positions = await this.positionModel
      .find({ isActive: true })
      .select('code title')
      .sort({ title: 1 })
      .lean()
      .exec();

    // Get contract types from enum
    const contractTypes = Object.values(ContractType);

    // Get employee statuses from enum
    const employeeStatuses = Object.values(EmployeeStatus);

    return {
      departments: departments.map(d => ({ code: d.code, name: d.name })),
      positions: positions.map(p => ({ code: p.code, title: p.title })),
      contractTypes,
      employeeStatuses,
    };
  }

  /**
   * Add entitlement with eligibility rules
   * This method applies entitlements ONLY to employees who meet the defined eligibility criteria
   * Strict enforcement: no entitlement will be created for ineligible employees
   */
  async addEntitlementWithEligibility(
    leaveTypeId: string,
    yearlyEntitlement: number,
    eligibilityRules: {
      minTenureMonths?: number;
      positionsAllowed?: string[];
      contractTypesAllowed?: string[];
      allPositionsAllowed?: boolean;
      allContractTypesAllowed?: boolean;
    },
    hrUserId: string,
    reason?: string,
  ): Promise<{
    assignedCount: number;
    eligibleEmployees: string[];
    ineligibleCount: number;
    message: string;
  }> {
    // Verify leave type exists
    const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${leaveTypeId} not found`);
    }

    // Note: If no eligibility criteria are defined, entitlements will be assigned to ALL employees
    // This is intentional - "no restrictions" = "all employees"

    console.log('=== ADD ENTITLEMENT WITH ELIGIBILITY ===');
    console.log('Leave Type ID:', leaveTypeId);
    console.log('Yearly Entitlement:', yearlyEntitlement);
    console.log('Eligibility Rules:', JSON.stringify(eligibilityRules, null, 2));

    // Fetch all active employees using search with empty criteria
    const allEmployees = await this.employeeService.searchEmployees({});
    
    const eligibleEmployees: string[] = [];
    const candidates: any[] = [];
    let ineligibleCount = 0;

    // First pass: evaluate eligibility quickly and collect candidates
    console.log(`Total employees to check: ${allEmployees.length}`);
    for (const employee of allEmployees) {
      const isEligible = this.checkEmployeeEligibility(employee, eligibilityRules);
      console.log(`Employee ${employee._id} (${employee.firstName} ${employee.lastName}): ${isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
      if (isEligible) {
        candidates.push(employee);
      } else {
        ineligibleCount++;
      }
    }

    // If no eligible candidates, return early
    if (candidates.length === 0) {
      return {
        assignedCount: 0,
        eligibleEmployees: [],
        ineligibleCount,
        message: `No eligible employees found for the defined criteria.`,
      };
    }

    // Assign entitlements in parallel with a concurrency limit
    const concurrency = 20;
    const failures: string[] = [];
    const start = Date.now();

    for (let i = 0; i < candidates.length; i += concurrency) {
      const batch = candidates.slice(i, i + concurrency);
      await Promise.all(batch.map(async (employee) => {
        try {
          await this.assignPersonalizedEntitlement(
            employee._id.toString(),
            leaveTypeId,
            yearlyEntitlement,
            hrUserId,
            reason || 'Eligibility-based entitlement',
          );
          eligibleEmployees.push(employee._id.toString());
        } catch (err) {
          console.error(`Failed to assign entitlement to employee ${employee._id}:`, err?.message || err);
          failures.push(employee._id.toString());
        }
      }));
    }

    const durationMs = Date.now() - start;
    console.log(`Assigned entitlements to ${eligibleEmployees.length} employees (failed: ${failures.length}) in ${durationMs}ms`);
    ineligibleCount += failures.length;

    return {
      assignedCount: eligibleEmployees.length,
      eligibleEmployees,
      ineligibleCount,
      message: `Successfully assigned ${yearlyEntitlement} days of ${leaveType.name} to ${eligibleEmployees.length} eligible employees. ${ineligibleCount} employees did not meet eligibility criteria.`,
    };
  }

  /**
   * Check if an employee meets the defined eligibility rules
   * Returns true only if ALL defined criteria are met
   * Strict enforcement: employee must pass every rule that is defined
   */
  private checkEmployeeEligibility(
    employee: any,
    rules: {
      minTenureMonths?: number;
      positionsAllowed?: string[];
      contractTypesAllowed?: string[];
      allPositionsAllowed?: boolean;
      allContractTypesAllowed?: boolean;
    },
  ): boolean {
    console.log(`  Checking employee: ${employee.firstName} ${employee.lastName}`);
    console.log(`    Position: ${employee.primaryPositionId?.title || employee.position?.title || employee.position || 'N/A'}`);
    console.log(`    Contract Type: ${employee.employmentType || employee.contractType || 'N/A'}`);
    console.log(`    Hire Date: ${employee.hireDate || employee.dateOfHire || 'N/A'}`);
    
    // Check minimum tenure
    if (rules.minTenureMonths && rules.minTenureMonths > 0) {
      const hireDate = employee.hireDate ? new Date(employee.hireDate) : (employee.dateOfHire ? new Date(employee.dateOfHire) : null);
      if (!hireDate) {
        console.log(`    ✗ Tenure check FAILED: Employee has no hire date`);
        return false;
      }

      const tenureMonths = this.calculateMonthsWorked(hireDate);
      console.log(`    Tenure check: Employee has ${tenureMonths} months, required: ${rules.minTenureMonths}`);
      if (tenureMonths < rules.minTenureMonths) {
        console.log(`    ✗ Tenure check FAILED: Insufficient tenure`);
        return false;
      }
      console.log(`    ✓ Tenure check PASSED`);
    } else {
      console.log(`    ✓ Tenure check SKIPPED (No minimum tenure requirement)`);
    }

    // Check positions allowed
    // Only restrict if either allPositionsAllowed is true OR specific positions are defined
    if (rules.allPositionsAllowed) {
      console.log(`    ✓ Position check SKIPPED (All positions allowed)`);
    } else if (rules.positionsAllowed && rules.positionsAllowed.length > 0) {
      // Specific positions are defined - employee must match one of them
      const employeePosition = employee.primaryPositionId?.title || employee.position?.title || employee.position;
      console.log(`    Position check: Employee has '${employeePosition}', allowed: [${rules.positionsAllowed.join(', ')}]`);
      
      if (!employeePosition) {
        console.log(`    ✗ Position check FAILED: Employee has no position`);
        return false;
      }

      // Check if position matches any allowed position
      const isAllowed = rules.positionsAllowed.some(allowedPos => {
        // Try exact match
        if (allowedPos === employeePosition) return true;
        
        // Try partial match (case-insensitive)
        if (employeePosition.toLowerCase().includes(allowedPos.toLowerCase())) return true;
        if (allowedPos.toLowerCase().includes(employeePosition.toLowerCase())) return true;
        
        return false;
      });

      if (!isAllowed) {
        console.log(`    ✗ Position check FAILED: Position not in allowed list`);
        return false;
      }
      console.log(`    ✓ Position check PASSED`);
    } else {
      // No position restrictions defined - all positions are allowed
      console.log(`    ✓ Position check SKIPPED (No position restrictions)`);
    }

    // Check contract types allowed
    // Only restrict if either allContractTypesAllowed is true OR specific contract types are defined
    if (rules.allContractTypesAllowed) {
      console.log(`    ✓ Contract Type check SKIPPED (All contract types allowed)`);
    } else if (rules.contractTypesAllowed && rules.contractTypesAllowed.length > 0) {
      // Specific contract types are defined - employee must match one of them
      const employeeContractType = employee.employmentType || employee.contractType;
      console.log(`    Contract Type check: Employee has '${employeeContractType}', allowed: [${rules.contractTypesAllowed.join(', ')}]`);
      
      if (!employeeContractType || !rules.contractTypesAllowed.includes(employeeContractType)) {
        console.log(`    ✗ Contract Type check FAILED`);
        return false;
      }
      console.log(`    ✓ Contract Type check PASSED`);
    } else {
      // No contract type restrictions defined - all contract types are allowed
      console.log(`    ✓ Contract Type check SKIPPED (No contract type restrictions)`);
    }

    // All defined criteria passed
    console.log(`    ✓✓✓ Employee is ELIGIBLE`);
    return true;
  }

  /**
   * Calculate months worked since hire date
   */
  private calculateMonthsWorked(hireDate: Date): number {
    const now = new Date();
    const months = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());
    return Math.max(0, months);
  }

  /**
   * Apply rounding rule to entitlement value
   */
  private applyRoundingRule(value: number, rule: string): number {
    switch (rule) {
      case 'round':
        return Math.round(value);
      case 'roundUp':
        return Math.ceil(value);
      case 'roundDown':
        return Math.floor(value);
      case 'none':
      default:
        return value;
    }
  }
}
