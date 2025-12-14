import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeavePolicy, LeavePolicyDocument } from '../models/leave-policy.schema';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';
import { CreateLeavePolicyDto } from '../dto/leave-policy/create-leave-policy.dto';
import { UpdateLeavePolicyDto } from '../dto/leave-policy/update-leave-policy.dto';
import { EmployeeService } from '../../employee-profile/employee-profile.service';
import { ContractType } from '../../employee-profile/enums/employee-profile.enums';

@Injectable()
export class LeaveConfigurationService {
  constructor(
    @InjectModel(LeavePolicy.name) private leavePolicyModel: Model<LeavePolicyDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
    private employeeService: EmployeeService,
  ) {}

  /**
   * User Story 1: Initiate leave configuration process
   * Internal system control - retrieves current configuration status
   */
  async initiateLeaveConfiguration(): Promise<{
    initialized: boolean;
    leaveTypesCount: number;
    leavePoliciesCount: number;
    message: string;
  }> {
    const leaveTypesCount = await this.leaveTypeModel.countDocuments();
    const leavePoliciesCount = await this.leavePolicyModel.countDocuments();

    const initialized = leaveTypesCount > 0 && leavePoliciesCount > 0;

    return {
      initialized,
      leaveTypesCount,
      leavePoliciesCount,
      message: initialized
        ? 'Leave configuration is active. You can manage leave policies.'
        : 'Leave configuration not initialized. Please create leave types and policies.',
    };
  }

  /**
   * User Story 3: Configure leave settings
   * Create a new leave policy with accrual rates, carry-over, waiting periods
   */
  async createLeavePolicy(
    createLeavePolicyDto: CreateLeavePolicyDto,
    adminId: string,
  ): Promise<LeavePolicyDocument> {
    // Validate leave type exists
    const leaveType = await this.leaveTypeModel.findById(createLeavePolicyDto.leaveTypeId);
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${createLeavePolicyDto.leaveTypeId} not found`);
    }

    // Check if policy already exists for this leave type
    const existingPolicy = await this.leavePolicyModel.findOne({
      leaveTypeId: new Types.ObjectId(createLeavePolicyDto.leaveTypeId),
    });
    if (existingPolicy) {
      throw new BadRequestException(
        `A leave policy already exists for leave type ${leaveType.name}. Use update instead.`,
      );
    }

    const leavePolicy = new this.leavePolicyModel({
      ...createLeavePolicyDto,
      leaveTypeId: new Types.ObjectId(createLeavePolicyDto.leaveTypeId),
    });

    return leavePolicy.save();
  }

  /**
   * User Story 3: Update leave policy settings
   */
  async updateLeavePolicy(
    policyId: string,
    updateLeavePolicyDto: UpdateLeavePolicyDto,
    adminId: string,
  ): Promise<LeavePolicyDocument> {
    const existingPolicy = await this.leavePolicyModel.findById(policyId);
    if (!existingPolicy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    // If updating leave type, validate it exists
    if (updateLeavePolicyDto.leaveTypeId) {
      const leaveType = await this.leaveTypeModel.findById(updateLeavePolicyDto.leaveTypeId);
      if (!leaveType) {
        throw new NotFoundException(
          `Leave type with ID ${updateLeavePolicyDto.leaveTypeId} not found`,
        );
      }
    }

    Object.assign(existingPolicy, updateLeavePolicyDto);
    return existingPolicy.save();
  }

  /**
   * Get all leave policies
   */
  async getAllLeavePolicies(): Promise<LeavePolicyDocument[]> {
    return this.leavePolicyModel.find().populate('leaveTypeId').exec();
  }

  /**
   * Get leave policy by ID
   */
  async getLeavePolicyById(policyId: string): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel
      .findById(policyId)
      .populate('leaveTypeId')
      .exec();

    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    return policy;
  }

  /**
   * Get leave policy by leave type ID
   */
  async getLeavePolicyByLeaveType(leaveTypeId: string): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel
      .findOne({ leaveTypeId: new Types.ObjectId(leaveTypeId) })
      .populate('leaveTypeId')
      .exec();

    if (!policy) {
      throw new NotFoundException(`Leave policy for leave type ${leaveTypeId} not found`);
    }

    return policy;
  }

  /**
   * Delete leave policy
   */
  async deleteLeavePolicy(policyId: string): Promise<{ message: string }> {
    const result = await this.leavePolicyModel.findByIdAndDelete(policyId);
    if (!result) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }
    return { message: 'Leave policy deleted successfully' };
  }

  /**
   * User Story 3: Get accrual rate based on employment type
   * Uses Employee Profile to determine accrual rate
   */
  async getAccrualRateByEmploymentType(
    employeeId: string,
    leaveTypeId: string,
  ): Promise<{
    accrualRate: number;
    accrualMethod: string;
    employmentType: string;
  }> {
    const employee = await this.employeeService.findById(employeeId);
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const policy = await this.getLeavePolicyByLeaveType(leaveTypeId);

    // Determine accrual rate based on employment type (contract type)
    const employmentType = employee.contractType || ContractType.FULL_TIME_CONTRACT;
    let accrualRate = policy.monthlyRate;

    // Adjust rate for part-time employees if applicable
    if (employmentType === ContractType.PART_TIME_CONTRACT) {
      // Part-time employees typically get pro-rated accrual (50% in this case)
      accrualRate = policy.monthlyRate * 0.5;
    }

    // Check eligibility based on contract type
    if (
      policy.eligibility?.contractTypesAllowed &&
      policy.eligibility.contractTypesAllowed.length > 0
    ) {
      if (!policy.eligibility.contractTypesAllowed.includes(employmentType)) {
        throw new BadRequestException(
          `Employee's contract type (${employmentType}) is not eligible for this leave type`,
        );
      }
    }

    return {
      accrualRate,
      accrualMethod: policy.accrualMethod,
      employmentType,
    };
  }

  /**
   * Configure waiting period for leave eligibility
   */
  async configureWaitingPeriod(
    policyId: string,
    minTenureMonths: number,
  ): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    if (!policy.eligibility) {
      policy.eligibility = {};
    }
    policy.eligibility.minTenureMonths = minTenureMonths;
    policy.markModified('eligibility');

    return policy.save();
  }

  /**
   * Configure maximum carry-over days
   */
  async configureCarryOver(
    policyId: string,
    carryForwardAllowed: boolean,
    maxCarryForward: number,
    expiryAfterMonths?: number,
  ): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    policy.carryForwardAllowed = carryForwardAllowed;
    policy.maxCarryForward = maxCarryForward;
    if (expiryAfterMonths !== undefined) {
      policy.expiryAfterMonths = expiryAfterMonths;
    }

    return policy.save();
  }

  /**
   * Configure accrual settings
   */
  async configureAccrual(
    policyId: string,
    accrualMethod: string,
    monthlyRate: number,
    yearlyRate: number,
  ): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    policy.accrualMethod = accrualMethod as any;
    policy.monthlyRate = monthlyRate;
    policy.yearlyRate = yearlyRate;

    return policy.save();
  }
}
