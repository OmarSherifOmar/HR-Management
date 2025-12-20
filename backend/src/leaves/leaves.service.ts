import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeaveEntitlement, LeaveEntitlementDocument } from './models/leave-entitlement.schema';
import { LeaveAdjustment, LeaveAdjustmentDocument } from './models/leave-adjustment.schema';
import { LeaveRequest, LeaveRequestDocument } from './models/leave-request.schema';
import { LeaveType, LeaveTypeDocument } from './models/leave-type.schema';
import { LeavePolicy, LeavePolicyDocument } from './models/leave-policy.schema';
import { AdjustmentType } from './enums/adjustment-type.enum';
import { LeaveStatus } from './enums/leave-status.enum';
import { EmployeeService } from '../employee-profile/employee-profile.service';
import { Attachment, AttachmentDocument } from './models/attachment.schema';
import { FileMetadata } from './dto/attachment/create-attachment.dto';
import { AttachmentType } from './enums/attachment-type.enum';
import * as path from 'path';
import * as fs from 'fs';
import { Calendar, CalendarDocument } from './models/calendar.schema';
import { Holiday, HolidayDocument } from '../time-management/models/holiday.schema';
import { HolidayType } from '../time-management/models/enums/index';
import { AccrualMethod } from './enums/accrual-method.enum';
import { RoundingRule } from './enums/rounding-rule.enum';
import { CreateLeavePolicyDto } from './dto/leave-policy/create-leave-policy.dto';
import { UpdateLeavePolicyDto } from './dto/leave-policy/update-leave-policy.dto';
import { ContractType, SystemRole, EmployeeStatus } from '../employee-profile/enums/employee-profile.enums';
import { CreateLeaveEntitlementDto } from './dto/leave-entitlement/create-leave-entitlement.dto';
import { UpdateLeaveEntitlementDto } from './dto/leave-entitlement/update-leave-entitlement.dto';
import { CreateLeaveRequestDto } from './dto/leave-request/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/leave-request/update-leave-request.dto';
import { Role } from '../auth/decorators/roles.decorator';
import { LeaveCategory, LeaveCategoryDocument } from './models/leave-category.schema';
import { CreateLeaveTypeDto } from './dto/leave-type/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/leave-type/update-leave-type.dto';
import { CreateLeaveCategoryDto } from './dto/leave-category/create-leave-category.dto';
import { NotificationService as TimeManagementNotificationService } from '../time-management/services/notification.service';
import { NotificationLogDocument, NotificationLog } from '../time-management/models/notification-log.schema';

// ============================================================================
// CONSOLIDATED SERVICES FILE
// Contains ALL 18 service implementations
// ============================================================================

// ═══════════════════════════════════════════════════════════════════════════
// accrual-suspension.service.ts
// ═══════════════════════════════════════════════════════════════════════════


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
  extendedLeaveDays: number;
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
   * Excludes unpaid leave days, suspension periods, and extended leave (>30 days, non-maternity)
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

    // Get extended leave days (>30 days, non-maternity)
    const extendedLeaveDays = await this.getExtendedLeaveDays(employeeId, periodStart, periodEnd);

    // Calculate actual service days
    const actualServiceDays = Math.max(0, totalCalendarDays - unpaidLeaveDays - suspensionDays - extendedLeaveDays);
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
      extendedLeaveDays,
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

  /**
   * Get extended leave days (>30 days) for an employee in a given period
   * Excludes maternity leave which is identified by code 'MATERNITY' or name containing 'maternity'
   * 
   * Business Rule: If an employee takes vacation/leave for more than 30 calendar days 
   * (excluding maternity leave), accrual calculation should stop during that extended leave period.
   * 
   * Note: We use CALENDAR DAYS (not business days) to determine if leave exceeds 30 days.
   * This is calculated from dates.from to dates.to, inclusive of all days including weekends.
   */
  async getExtendedLeaveDays(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number> {
    // Find all leave types except maternity leave
    const leaveTypes = await this.leaveTypeModel.find({
      paid: true, // Only consider paid leaves (unpaid already handled separately)
      $and: [
        // Exclude maternity leave by code or name
        { code: { $not: /maternity/i } },
        { name: { $not: /maternity/i } },
      ],
    }).select('_id').exec();

    const leaveTypeIds = leaveTypes.map(lt => lt._id);

    if (leaveTypeIds.length === 0) {
      return 0;
    }

    // Find all approved leaves that overlap with the period
    // We'll filter by calendar days duration in the loop below
    const approvedLeaves = await this.leaveRequestModel.find({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: { $in: leaveTypeIds },
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

    let totalExtendedLeaveDays = 0;
    for (const leave of approvedLeaves) {
      // Calculate TOTAL CALENDAR DAYS of the leave (not just business days)
      const totalLeaveDays = this.calculateCalendarDays(leave.dates.from, leave.dates.to);
      
      // Only count as "extended leave" if the total leave duration exceeds 30 calendar days
      if (totalLeaveDays > 30) {
        // Calculate overlapping days with the accrual period
        const overlapStart = new Date(Math.max(leave.dates.from.getTime(), periodStart.getTime()));
        const overlapEnd = new Date(Math.min(leave.dates.to.getTime(), periodEnd.getTime()));
        const overlapDays = this.calculateCalendarDays(overlapStart, overlapEnd);
        totalExtendedLeaveDays += overlapDays;
      }
    }

    return totalExtendedLeaveDays;
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

    // Get entitlement to determine yearlyEntitlement for accurate accrual calculation
    let entitlement = await this.entitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    // Calculate original accrual (full month) based on entitlement's yearlyEntitlement
    // If no entitlement exists yet, fall back to policy's monthlyRate
    const originalAccrual = entitlement?.yearlyEntitlement 
      ? entitlement.yearlyEntitlement / 12 
      : policy.monthlyRate;

    // Calculate adjusted accrual based on actual service days
    const adjustedAccrual = (originalAccrual * serviceDays.serviceDaysPercentage) / 100;
    const deductedAmount = originalAccrual - adjustedAccrual;

    // Check if automatic entitlement creation is disabled
    const automaticEntitlementEnabled = process.env.AUTOMATIC_ENTITLEMENT_ENABLED !== 'false';
    
    // Create entitlement if it doesn't exist
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
        `Suspension: ${serviceDays.suspensionDays}, Extended leave (>30d): ${serviceDays.extendedLeaveDays}, ` +
        `Actual service: ${serviceDays.actualServiceDays} (${serviceDays.serviceDaysPercentage.toFixed(1)}%). ` +
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
    
    // Get entitlement to determine yearlyEntitlement for accurate accrual calculation
    const entitlement = await this.entitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    // Calculate original accrual based on entitlement's yearlyEntitlement
    // If no entitlement exists yet, fall back to policy's monthlyRate
    const originalAccrual = entitlement?.yearlyEntitlement 
      ? entitlement.yearlyEntitlement / 12 
      : policy.monthlyRate;
    const adjustedAccrual = (originalAccrual * serviceDays.serviceDaysPercentage) / 100;

    return {
      serviceDays,
      originalAccrual,
      adjustedAccrual,
      deduction: originalAccrual - adjustedAccrual,
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// attachment.service.ts
// ═══════════════════════════════════════════════════════════════════════════


/**
 * Attachment Service
 * 
 * REQ-016: As an employee, I want to attach documents (e.g., a doctor's note) 
 * to my leave request so that HR and my manager have the required proof for 
 * specialized leave types.
 * 
 * Features:
 * - Upload attachments for leave requests
 * - Validate file types and sizes
 * - Link attachments to leave requests
 * - Check if attachment is required based on leave type
 */
@Injectable()
export class AttachmentService {
  // Allowed file types for attachments
  private readonly allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  // Maximum file size in bytes (5MB)
  private readonly maxFileSize = 5 * 1024 * 1024;

  // Upload directory (configurable for persistent storage)
  private readonly uploadDir = process.env.UPLOADS_DIR
    ? path.join(process.env.UPLOADS_DIR, 'attachments')
    : path.resolve('uploads', 'attachments');

  constructor(
    @InjectModel(Attachment.name) private attachmentModel: Model<AttachmentDocument>,
    @InjectModel(LeaveRequest.name) private leaveRequestModel: Model<LeaveRequestDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
  ) {
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  // ==================== UPLOAD ATTACHMENT ====================

  /**
   * Create an attachment record (after file upload)
   * 
   * @param fileMetadata - File metadata extracted from uploaded file
   * @returns Created attachment
   */
  async createAttachment(fileMetadata: FileMetadata): Promise<AttachmentDocument> {
    // Validate file type
    if (!this.isAllowedFileType(fileMetadata.fileType)) {
      throw new BadRequestException(
        `File type ${fileMetadata.fileType} is not allowed. Allowed types: PDF, JPEG, PNG, DOC, DOCX`,
      );
    }

    // Validate file size
    if (fileMetadata.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    const attachment = new this.attachmentModel({
      originalName: fileMetadata.originalName,
      filePath: fileMetadata.filePath,
      fileType: fileMetadata.fileType,
      size: fileMetadata.size,
    });

    return attachment.save();
  }

  // ==================== GET ATTACHMENTS ====================

  /**
   * Get attachment by ID
   */
  async getAttachmentById(attachmentId: string): Promise<AttachmentDocument> {
    const attachment = await this.attachmentModel.findById(attachmentId).exec();

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${attachmentId} not found`);
    }

    return attachment;
  }

  /**
   * Get attachment for a leave request
   */
  async getAttachmentForLeaveRequest(leaveRequestId: string): Promise<AttachmentDocument | null> {
    const leaveRequest = await this.leaveRequestModel.findById(leaveRequestId);
    if (!leaveRequest || !leaveRequest.attachmentId) {
      return null;
    }

    return this.attachmentModel.findById(leaveRequest.attachmentId).exec();
  }

  // ==================== VALIDATION HELPERS ====================

  /**
   * Check if attachment is required for a leave request
   */
  async isAttachmentRequired(
    leaveTypeId: string,
    durationDays: number,
  ): Promise<{ required: boolean; type?: AttachmentType; reason?: string }> {
    const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${leaveTypeId} not found`);
    }

    // Check if leave type requires attachment
    if (leaveType.requiresAttachment) {
      return {
        required: true,
        type: leaveType.attachmentType,
        reason: `${leaveType.name} requires a ${leaveType.attachmentType || 'supporting'} document`,
      };
    }

    // Additional rule: Medical certificate for sick leave > 1 day
    if (leaveType.code?.toLowerCase().includes('sick') && durationDays > 1) {
      return {
        required: true,
        type: AttachmentType.MEDICAL,
        reason: 'Medical certificate required for sick leave exceeding 1 day',
      };
    }

    return { required: false };
  }

  /**
   * Validate attachment meets leave type requirements
   */
  async validateAttachmentForLeaveType(
    attachmentId: string,
    leaveTypeId: string,
  ): Promise<{ valid: boolean; message?: string }> {
    const attachment = await this.attachmentModel.findById(attachmentId);
    if (!attachment) {
      return { valid: false, message: 'Attachment not found' };
    }

    const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
    if (!leaveType) {
      return { valid: false, message: 'Leave type not found' };
    }

    // Basic validation - file exists
    return { valid: true };
  }

  // ==================== DELETE ATTACHMENT ====================

  /**
   * Delete an attachment
   */
  async deleteAttachment(
    attachmentId: string,
    requesterId: string,
  ): Promise<{ message: string }> {
    const attachment = await this.attachmentModel.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${attachmentId} not found`);
    }

    // Check if attached to any leave request
    const leaveRequest = await this.leaveRequestModel.findOne({
      attachmentId: new Types.ObjectId(attachmentId),
    });

    if (leaveRequest) {
      // Only the employee who submitted can delete
      if (leaveRequest.employeeId.toString() !== requesterId) {
        throw new ForbiddenException('You can only delete attachments from your own leave requests');
      }

      // Cannot delete from approved requests
      if (leaveRequest.status === LeaveStatus.APPROVED) {
        throw new BadRequestException(
          'Cannot delete attachments from approved leave requests',
        );
      }

      // Remove reference from leave request
      leaveRequest.attachmentId = undefined;
      await leaveRequest.save();
    }

    // Delete file from filesystem
    try {
      if (fs.existsSync(attachment.filePath)) {
        fs.unlinkSync(attachment.filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    await this.attachmentModel.findByIdAndDelete(attachmentId);

    return { message: 'Attachment deleted successfully' };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Ensure upload directory exists
   */
  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Check if file type is allowed
   */
  private isAllowedFileType(fileType: string): boolean {
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx'];
    return allowedExtensions.includes(fileType.toLowerCase());
  }

  /**
   * Generate unique filename for upload
   */
  generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}${ext}`;
  }

  /**
   * Get file path for storing uploaded file
   */
  getUploadPath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }

  /**
   * Get allowed MIME types
   */
  getAllowedMimeTypes(): string[] {
    return this.allowedMimeTypes;
  }

  /**
   * Get maximum file size in bytes
   */
  getMaxFileSize(): number {
    return this.maxFileSize;
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// balance-adjustment.service.ts
// ═══════════════════════════════════════════════════════════════════════════


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


// ═══════════════════════════════════════════════════════════════════════════
// calendar.service.ts
// ═══════════════════════════════════════════════════════════════════════════


/**
 * CalendarService - US9: Set Calendars and Blocked Days
 * 
 * Uses the Calendar model with holidays as ObjectId[] references to Holiday model
 * from time-management module. BlockedPeriods remain as embedded array.
 */
@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(Calendar.name) private calendarModel: Model<CalendarDocument>,
    @InjectModel(Holiday.name) private holidayModel: Model<HolidayDocument>,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // CALENDAR (YEAR) MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  async createCalendar(year: number): Promise<CalendarDocument> {
    const existing = await this.calendarModel.findOne({ year }).exec();
    if (existing) throw new BadRequestException(`Calendar for year ${year} already exists`);

    const calendar = new this.calendarModel({ year, holidays: [], blockedPeriods: [] });
    return calendar.save();
  }

  async getCalendarByYear(year: number): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);
    return calendar;
  }

  async getAllCalendars(): Promise<CalendarDocument[]> {
    return this.calendarModel.find().populate('holidays').sort({ year: -1 }).exec();
  }

  async deleteCalendar(year: number): Promise<{ deleted: boolean }> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    // Optionally delete associated holidays (or keep them for other uses)
    // For now, we remove the calendar but holidays remain in the Holiday collection
    await this.calendarModel.findOneAndDelete({ year }).exec();
    return { deleted: true };
  }

  // ─────────────────────────────────────────────────────────────
  // HOLIDAY MANAGEMENT (using Holiday model from time-management)
  // ─────────────────────────────────────────────────────────────

  async addHoliday(
    year: number,
    holiday: { 
      startDate: Date; 
      endDate?: Date; 
      name: string; 
      type?: HolidayType;
    },
  ): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    const endDate = holiday.endDate || holiday.startDate;
    if (new Date(holiday.startDate) > new Date(endDate)) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    // Check for duplicate holiday by name or date range
    const existingHolidays = await this.holidayModel.find({
      _id: { $in: calendar.holidays },
    }).exec();

    // Check for duplicate name
    const duplicateName = existingHolidays.find(h => h.name === holiday.name);
    if (duplicateName) {
      throw new BadRequestException(
        `Holiday with the name "${holiday.name}" already exists in this calendar.`
      );
    }

    // Check for overlapping dates
    const overlapping = existingHolidays.find(h => {
      const hStart = new Date(h.startDate);
      const hEnd = h.endDate ? new Date(h.endDate) : hStart;
      const newStart = new Date(holiday.startDate);
      const newEnd = new Date(endDate);

      // Check if dates overlap
      return (newStart <= hEnd && newEnd >= hStart);
    });

    if (overlapping) {
      const overlapStart = overlapping.startDate.toLocaleDateString();
      const overlapEnd = overlapping.endDate 
        ? overlapping.endDate.toLocaleDateString() 
        : overlapStart;
      throw new BadRequestException(
        `Date range overlaps with existing holiday "${overlapping.name}" (${overlapStart}${overlapping.endDate ? ' - ' + overlapEnd : ''}). ` +
        `Please choose different dates or delete the conflicting holiday first.`
      );
    }

    // Create a new Holiday document
    const newHoliday = new this.holidayModel({
      type: holiday.type || HolidayType.ORGANIZATIONAL,
      startDate: holiday.startDate,
      endDate: holiday.endDate,
      name: holiday.name,
      active: true,
    });
    const savedHoliday = await newHoliday.save();

    // Add the holiday reference to the calendar
    calendar.holidays.push(savedHoliday._id as Types.ObjectId);
    await calendar.save();

    const updatedCalendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    return updatedCalendar!;
  }

  async getHolidays(year: number): Promise<HolidayDocument[]> {
    const calendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);
    return calendar.holidays as unknown as HolidayDocument[];
  }

  async updateHoliday(
    year: number,
    holidayId: string,
    holiday: { 
      startDate?: Date; 
      endDate?: Date; 
      name?: string; 
      type?: HolidayType;
      active?: boolean;
    },
  ): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    // Check if holiday belongs to this calendar
    const holidayObjectId = new Types.ObjectId(holidayId);
    if (!calendar.holidays.some(h => h.equals(holidayObjectId))) {
      throw new BadRequestException('Holiday not found in this calendar');
    }

    // Validate dates if both provided
    if (holiday.startDate && holiday.endDate) {
      if (new Date(holiday.startDate) > new Date(holiday.endDate)) {
        throw new BadRequestException('startDate must be before or equal to endDate');
      }
    }

    // Update the holiday document
    const updatedHoliday = await this.holidayModel.findByIdAndUpdate(
      holidayId,
      { $set: holiday },
      { new: true },
    ).exec();

    if (!updatedHoliday) {
      throw new NotFoundException('Holiday not found');
    }

    const updatedCalendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    return updatedCalendar!;
  }

  async removeHoliday(year: number, holidayId: string): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    const holidayObjectId = new Types.ObjectId(holidayId);
    if (!calendar.holidays.some(h => h.equals(holidayObjectId))) {
      throw new BadRequestException('Holiday not found in this calendar');
    }

    // Remove from calendar's holidays array
    calendar.holidays = calendar.holidays.filter(h => !h.equals(holidayObjectId));
    await calendar.save();

    // Optionally delete the holiday document itself
    await this.holidayModel.findByIdAndDelete(holidayId).exec();

    const updatedCalendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    return updatedCalendar!;
  }

  async bulkAddHolidays(
    year: number,
    holidays: { 
      startDate: Date; 
      endDate?: Date; 
      name: string; 
      type?: HolidayType;
    }[],
  ): Promise<{ calendar: CalendarDocument; added: number; skipped: string[] }> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    const skipped: string[] = [];
    let added = 0;

    for (const h of holidays) {
      const endDate = h.endDate || h.startDate;
      if (new Date(h.startDate) > new Date(endDate)) {
        skipped.push(`${h.name} (invalid dates)`);
        continue;
      }

      // Check for duplicate by name among existing holidays in this calendar
      const existingHolidays = await this.holidayModel.find({
        _id: { $in: calendar.holidays },
        name: h.name,
      }).exec();

      if (existingHolidays.length > 0) {
        skipped.push(h.name);
        continue;
      }

      // Create new holiday
      const newHoliday = new this.holidayModel({
        type: h.type || HolidayType.ORGANIZATIONAL,
        startDate: h.startDate,
        endDate: h.endDate,
        name: h.name,
        active: true,
      });
      const savedHoliday = await newHoliday.save();

      calendar.holidays.push(savedHoliday._id as Types.ObjectId);
      added++;
    }

    await calendar.save();
    const populatedCalendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();

    return { calendar: populatedCalendar!, added, skipped };
  }

  // ─────────────────────────────────────────────────────────────
  // BLOCKED PERIODS (COMPANY CLOSURES) - embedded array
  // ─────────────────────────────────────────────────────────────

  async addBlockedPeriod(
    year: number,
    period: { from: Date; to: Date; reason: string },
  ): Promise<CalendarDocument> {
    if (new Date(period.from) > new Date(period.to)) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    // Check for exact duplicate (same dates or same reason)
    const exactDuplicate = calendar.blockedPeriods.find(
      bp => this.isSameDateRange(bp.from, bp.to, period.from, period.to) ||
            bp.reason.toLowerCase() === period.reason.toLowerCase()
    );

    if (exactDuplicate) {
      const dupFrom = new Date(exactDuplicate.from).toLocaleDateString();
      const dupTo = new Date(exactDuplicate.to).toLocaleDateString();
      throw new BadRequestException(
        `Blocked period already exists: "${exactDuplicate.reason}" (${dupFrom} - ${dupTo}). ` +
        `Please delete it first or choose a different date range and reason.`
      );
    }

    // Check for overlapping dates
    const overlapping = calendar.blockedPeriods.find(bp => {
      const bpStart = new Date(bp.from);
      const bpEnd = new Date(bp.to);
      const newStart = new Date(period.from);
      const newEnd = new Date(period.to);

      return (newStart <= bpEnd && newEnd >= bpStart);
    });

    if (overlapping) {
      const overlapFrom = new Date(overlapping.from).toLocaleDateString();
      const overlapTo = new Date(overlapping.to).toLocaleDateString();
      throw new BadRequestException(
        `Date range overlaps with existing blocked period "${overlapping.reason}" (${overlapFrom} - ${overlapTo}). ` +
        `Please choose different dates or delete the conflicting period first.`
      );
    }

    calendar.blockedPeriods.push(period);
    await calendar.save();
    const updatedCalendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    return updatedCalendar!;
  }

  async getBlockedPeriods(year: number): Promise<{ from: Date; to: Date; reason: string }[]> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);
    return calendar.blockedPeriods;
  }

  async updateBlockedPeriod(
    year: number,
    index: number,
    period: { from: Date; to: Date; reason: string },
  ): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    if (index < 0 || index >= calendar.blockedPeriods.length) {
      throw new BadRequestException('Invalid blocked period index');
    }

    if (new Date(period.from) > new Date(period.to)) {
      throw new BadRequestException('from date must be before or equal to to date');
    }

    calendar.blockedPeriods[index] = period;
    await calendar.save();
    const updatedCalendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    return updatedCalendar!;
  }

  async removeBlockedPeriod(year: number, index: number): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ year }).exec();
    if (!calendar) throw new NotFoundException(`Calendar for year ${year} not found`);

    if (index < 0 || index >= calendar.blockedPeriods.length) {
      throw new BadRequestException('Invalid blocked period index');
    }

    calendar.blockedPeriods.splice(index, 1);
    await calendar.save();
    const updatedCalendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    return updatedCalendar!;
  }

  // ─────────────────────────────────────────────────────────────
  // UTILITY: Check if a date is blocked (holiday or closure)
  // ─────────────────────────────────────────────────────────────

  async isDateBlocked(date: Date): Promise<{ blocked: boolean; reason?: string; type?: string }> {
    const year = date.getFullYear();
    const calendar = await this.calendarModel.findOne({ year }).populate('holidays').exec();
    if (!calendar) return { blocked: false };

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // Check holidays (populated Holiday documents)
    const holidays = calendar.holidays as unknown as HolidayDocument[];
    for (const h of holidays) {
      if (!h.active) continue;
      
      const startDate = new Date(h.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = h.endDate ? new Date(h.endDate) : new Date(h.startDate);
      endDate.setHours(23, 59, 59, 999);

      if (checkDate >= startDate && checkDate <= endDate) {
        return { blocked: true, reason: h.name || h.type, type: 'holiday' };
      }
    }

    // Check blocked periods
    for (const bp of calendar.blockedPeriods) {
      const from = new Date(bp.from);
      from.setHours(0, 0, 0, 0);
      const to = new Date(bp.to);
      to.setHours(23, 59, 59, 999);
      
      if (checkDate >= from && checkDate <= to) {
        return { blocked: true, reason: bp.reason, type: 'blocked_period' };
      }
    }

    return { blocked: false };
  }

  async getBlockedDatesInRange(
    from: Date,
    to: Date,
  ): Promise<{ date: Date; reason: string; type: string }[]> {
    const blockedDates: { date: Date; reason: string; type: string }[] = [];
    const current = new Date(from);

    while (current <= to) {
      const result = await this.isDateBlocked(new Date(current));
      if (result.blocked) {
        blockedDates.push({
          date: new Date(current),
          reason: result.reason!,
          type: result.type!,
        });
      }
      current.setDate(current.getDate() + 1);
    }

    return blockedDates;
  }

  // ─────────────────────────────────────────────────────────────
  // GET CALENDAR SUMMARY
  // ─────────────────────────────────────────────────────────────

  async getCalendarSummary(year: number): Promise<{
    year: number;
    holidays: HolidayDocument[];
    blockedPeriods: { from: Date; to: Date; reason: string }[];
    totalHolidayDays: number;
    totalBlockedDays: number;
  }> {
    const calendar = await this.getCalendarByYear(year);
    const holidays = calendar.holidays as unknown as HolidayDocument[];

    // Calculate total holiday days
    let totalHolidayDays = 0;
    for (const h of holidays) {
      if (!h.active) continue;
      const startDate = new Date(h.startDate);
      const endDate = h.endDate ? new Date(h.endDate) : new Date(h.startDate);
      const days = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
      totalHolidayDays += days;
    }

    // Calculate total blocked days
    let totalBlockedDays = 0;
    for (const bp of calendar.blockedPeriods) {
      const days = Math.ceil(
        (new Date(bp.to).getTime() - new Date(bp.from).getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
      totalBlockedDays += days;
    }

    return {
      year: calendar.year,
      holidays,
      blockedPeriods: calendar.blockedPeriods,
      totalHolidayDays,
      totalBlockedDays,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // HELPER METHODS: Duplicate Detection for Blocked Periods
  // ─────────────────────────────────────────────────────────────

  private isSameDateRange(
    date1From: Date,
    date1To: Date,
    date2From: Date,
    date2To: Date,
  ): boolean {
    const from1 = new Date(date1From).toISOString().split('T')[0];
    const to1 = new Date(date1To).toISOString().split('T')[0];
    const from2 = new Date(date2From).toISOString().split('T')[0];
    const to2 = new Date(date2To).toISOString().split('T')[0];
    return from1 === from2 && to1 === to2;
  }

  private isBlockedPeriodDuplicate(
    existingPeriods: { from: Date; to: Date; reason: string }[],
    newPeriod: { from: Date; to: Date; reason: string },
  ): boolean {
    return existingPeriods.some(
      (bp) =>
        this.isSameDateRange(bp.from, bp.to, newPeriod.from, newPeriod.to) ||
        bp.reason.toLowerCase() === newPeriod.reason.toLowerCase(),
    );
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// leave-accrual.service.ts
// ═══════════════════════════════════════════════════════════════════════════


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


// ═══════════════════════════════════════════════════════════════════════════
// leave-configuration.service.ts
// ═══════════════════════════════════════════════════════════════════════════


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
      // Convert leaveTypeId to ObjectId before assigning
      updateLeavePolicyDto.leaveTypeId = new Types.ObjectId(updateLeavePolicyDto.leaveTypeId) as any;
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


// ═══════════════════════════════════════════════════════════════════════════
// leave-eligibility.service.ts
// ═══════════════════════════════════════════════════════════════════════════


/**
 * User Story 6: HR Admin Set Eligibility Rules
 * 
 * This service manages eligibility rules for leave types including:
 * - Minimum tenure requirements
 * - Employee type restrictions
 * - Position-based eligibility
 */
@Injectable()
export class LeaveEligibilityService {
  constructor(
    @InjectModel(LeavePolicy.name) private leavePolicyModel: Model<LeavePolicyDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
  ) {}

  /**
   * Set eligibility rules for a leave policy
   */
  async setEligibilityRules(
    policyId: string,
    eligibilityRules: {
      minTenureMonths?: number;
      contractTypesAllowed?: string[];
      positionsAllowed?: string[];
    },
  ): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    // Initialize eligibility object if it doesn't exist
    if (!policy.eligibility) {
      policy.eligibility = {};
    }

    // Update eligibility fields
    if (eligibilityRules.minTenureMonths !== undefined) {
      policy.eligibility.minTenureMonths = eligibilityRules.minTenureMonths;
    }
    if (eligibilityRules.contractTypesAllowed !== undefined) {
      policy.eligibility.contractTypesAllowed = eligibilityRules.contractTypesAllowed;
    }
    if (eligibilityRules.positionsAllowed !== undefined) {
      policy.eligibility.positionsAllowed = eligibilityRules.positionsAllowed;
    }

    policy.markModified('eligibility');
    return policy.save();
  }

  /**
   * Get eligibility rules for a leave policy
   */
  async getEligibilityRules(policyId: string): Promise<{
    policyId: string;
    leaveTypeId: string;
    eligibility: {
      minTenureMonths?: number;
      contractTypesAllowed?: string[];
      positionsAllowed?: string[];
    };
  }> {
    const policy = await this.leavePolicyModel
      .findById(policyId)
      .populate('leaveTypeId')
      .exec();

    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    return {
      policyId: policy._id.toString(),
      leaveTypeId: policy.leaveTypeId.toString(),
      eligibility: policy.eligibility || {},
    };
  }

  /**
   * Set minimum tenure requirement for a leave policy
   */
  async setMinTenureRequirement(
    policyId: string,
    minTenureMonths: number,
  ): Promise<LeavePolicyDocument> {
    if (minTenureMonths < 0) {
      throw new BadRequestException('Minimum tenure months cannot be negative');
    }

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
   * Set allowed contract types for a leave policy
   */
  async setAllowedContractTypes(
    policyId: string,
    contractTypes: string[],
  ): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    if (!policy.eligibility) {
      policy.eligibility = {};
    }
    policy.eligibility.contractTypesAllowed = contractTypes;
    policy.markModified('eligibility');

    return policy.save();
  }

  /**
   * Set allowed positions for a leave policy
   */
  async setAllowedPositions(
    policyId: string,
    positions: string[],
  ): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    if (!policy.eligibility) {
      policy.eligibility = {};
    }
    policy.eligibility.positionsAllowed = positions;
    policy.markModified('eligibility');

    return policy.save();
  }

  /**
   * Bulk update eligibility rules for multiple policies
   */
  async bulkUpdateEligibilityRules(
    updates: Array<{
      policyId: string;
      eligibilityRules: {
        minTenureMonths?: number;
        contractTypesAllowed?: string[];
        positionsAllowed?: string[];
      };
    }>,
  ): Promise<{ updated: number; failed: string[] }> {
    let updated = 0;
    const failed: string[] = [];

    for (const update of updates) {
      try {
        await this.setEligibilityRules(update.policyId, update.eligibilityRules);
        updated++;
      } catch (error) {
        failed.push(update.policyId);
      }
    }

    return { updated, failed };
  }

  /**
   * Remove all eligibility restrictions from a policy
   */
  async clearEligibilityRules(policyId: string): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    policy.eligibility = {};
    policy.markModified('eligibility');

    return policy.save();
  }

  /**
   * Get all policies with eligibility rules configured
   */
  async getPoliciesWithEligibilityRules(): Promise<
    Array<{
      policyId: string;
      leaveTypeName: string;
      eligibility: Record<string, any>;
    }>
  > {
    const policies = await this.leavePolicyModel
      .find({ 'eligibility.minTenureMonths': { $exists: true } })
      .populate('leaveTypeId')
      .exec();

    return policies.map((policy) => ({
      policyId: policy._id.toString(),
      leaveTypeName: (policy.leaveTypeId as any)?.name || 'Unknown',
      eligibility: policy.eligibility || {},
    }));
  }

  /**
   * Check if an employee is eligible for a specific leave type
   */
  async isEmployeeEligibleForLeaveType(
    employeeId: string,
    leaveTypeId: string,
    employee?: any,
  ): Promise<{ eligible: boolean; reason?: string }> {
    // Find the policy for this leave type
    const policy = await this.leavePolicyModel
      .findOne({ leaveTypeId: new Types.ObjectId(leaveTypeId) })
      .exec();

    // If no policy or no eligibility rules, employee is eligible by default
    if (!policy || !policy.eligibility) {
      console.log(`No policy or eligibility rules for leave type ${leaveTypeId} - eligible by default`);
      return { eligible: true };
    }

    const eligibility = policy.eligibility;

    // If no eligibility rules are set, employee is eligible
    if (
      !eligibility.minTenureMonths &&
      (!eligibility.contractTypesAllowed || eligibility.contractTypesAllowed.length === 0) &&
      (!eligibility.positionsAllowed || eligibility.positionsAllowed.length === 0)
    ) {
      console.log(`No eligibility restrictions set for leave type ${leaveTypeId} - eligible by default`);
      return { eligible: true };
    }

    // If employee data not provided, cannot verify eligibility - assume ineligible for safety
    if (!employee) {
      console.warn(`Employee data not provided for eligibility check - leave type ${leaveTypeId} marked as ineligible`);
      return { 
        eligible: false, 
        reason: 'Unable to verify eligibility - employee data unavailable' 
      };
    }

    console.log(`Checking eligibility for employee ${employeeId}, leave type ${leaveTypeId}`);
    console.log(`Eligibility rules:`, eligibility);
    console.log(`Employee data:`, {
      hireDate: employee.hireDate,
      contractType: employee.contractType || employee.employmentType,
      position: employee.position?.name || employee.position
    });

    // Check minimum tenure
    if (eligibility.minTenureMonths && eligibility.minTenureMonths > 0) {
      const hireDate = employee.hireDate ? new Date(employee.hireDate) : null;
      if (hireDate) {
        const monthsWorked = this.calculateMonthsWorked(hireDate);
        console.log(`Tenure check: ${monthsWorked} months worked vs ${eligibility.minTenureMonths} required`);
        if (monthsWorked < eligibility.minTenureMonths) {
          return {
            eligible: false,
            reason: `Requires minimum ${eligibility.minTenureMonths} months tenure (current: ${monthsWorked} months)`,
          };
        }
      }
    }

    // Check contract type
    if (eligibility.contractTypesAllowed && eligibility.contractTypesAllowed.length > 0) {
      const employeeContractType = employee.contractType || employee.employmentType;
      console.log(`Contract type check: ${employeeContractType} vs allowed:`, eligibility.contractTypesAllowed);
      if (employeeContractType && !eligibility.contractTypesAllowed.includes(employeeContractType)) {
        return {
          eligible: false,
          reason: `Contract type '${employeeContractType}' not allowed for this leave type`,
        };
      }
    }

    // Check position
    if (eligibility.positionsAllowed && eligibility.positionsAllowed.length > 0) {
      const employeePosition = employee.position?.name || employee.position;
      const employeePositionCode = employee.position?.code || '';
      
      console.log(`Position check: Employee position="${employeePosition}", code="${employeePositionCode}"`);
      console.log(`Allowed positions:`, eligibility.positionsAllowed);
      
      // Check if employee has a position
      if (!employeePosition) {
        return {
          eligible: false,
          reason: `No position assigned - this leave type requires specific positions`,
        };
      }
      
      // Check if position matches (exact match or partial match with code)
      const isAllowed = eligibility.positionsAllowed.some(allowedPos => {
        // Try exact match
        if (allowedPos === employeePosition) return true;
        
        // Try matching without parentheses (e.g., "Manager" matches "Manager (EF11)")
        const allowedPosBase = allowedPos.split('(')[0].trim();
        const employeePosBase = employeePosition.split('(')[0].trim();
        if (allowedPosBase === employeePosBase) return true;
        
        // Try matching with code in parentheses
        if (employeePositionCode && allowedPos.includes(`(${employeePositionCode})`)) return true;
        
        return false;
      });
      
      if (!isAllowed) {
        return {
          eligible: false,
          reason: `Position '${employeePosition}' not allowed for this leave type. Required: ${eligibility.positionsAllowed.join(', ')}`,
        };
      }
    }

    console.log(`Employee ${employeeId} is eligible for leave type ${leaveTypeId}`);
    return { eligible: true };
  }

  /**
   * Calculate months worked since hire date
   */
  private calculateMonthsWorked(hireDate: Date): number {
    const now = new Date();
    const months = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());
    return Math.max(0, months);
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// leave-entitlement.service.ts
// ═══════════════════════════════════════════════════════════════════════════


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


// ═══════════════════════════════════════════════════════════════════════════
// leave-parameters.service.ts
// ═══════════════════════════════════════════════════════════════════════════


/**
 * User Story 8: HR Admin Configure Leave Parameters
 * Input: Organizational Structure (for approval hierarchy)
 * 
 * This service manages leave parameters including:
 * - Maximum consecutive days
 * - Notice period requirements
 * - Approval workflow configuration
 * - Leave-specific business rules
 */
@Injectable()
export class LeaveParametersService {
  constructor(
    @InjectModel(LeavePolicy.name) private leavePolicyModel: Model<LeavePolicyDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
  ) {}

  /**
   * Configure maximum consecutive days for a leave policy
   */
  async configureMaxConsecutiveDays(
    policyId: string,
    maxConsecutiveDays: number,
  ): Promise<LeavePolicyDocument> {
    if (maxConsecutiveDays <= 0) {
      throw new BadRequestException('Maximum consecutive days must be positive');
    }

    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    policy.maxConsecutiveDays = maxConsecutiveDays;
    return policy.save();
  }

  /**
   * Configure minimum notice days required for a leave request
   */
  async configureMinNoticeDays(
    policyId: string,
    minNoticeDays: number,
  ): Promise<LeavePolicyDocument> {
    if (minNoticeDays < 0) {
      throw new BadRequestException('Minimum notice days cannot be negative');
    }

    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    policy.minNoticeDays = minNoticeDays;
    return policy.save();
  }

  /**
   * Configure both max consecutive days and notice period
   */
  async configureLeaveParameters(
    policyId: string,
    params: {
      maxConsecutiveDays?: number;
      minNoticeDays?: number;
    },
  ): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    if (params.maxConsecutiveDays !== undefined) {
      if (params.maxConsecutiveDays <= 0) {
        throw new BadRequestException('Maximum consecutive days must be positive');
      }
      policy.maxConsecutiveDays = params.maxConsecutiveDays;
    }

    if (params.minNoticeDays !== undefined) {
      if (params.minNoticeDays < 0) {
        throw new BadRequestException('Minimum notice days cannot be negative');
      }
      policy.minNoticeDays = params.minNoticeDays;
    }

    return policy.save();
  }

  /**
   * Get leave parameters for a policy
   */
  async getLeaveParameters(policyId: string): Promise<{
    policyId: string;
    leaveTypeId: string;
    leaveTypeName: string;
    maxConsecutiveDays?: number;
    minNoticeDays: number;
    accrualMethod: string;
    carryForwardAllowed: boolean;
    maxCarryForward: number;
    expiryAfterMonths?: number;
  }> {
    const policy = await this.leavePolicyModel
      .findById(policyId)
      .populate('leaveTypeId')
      .exec();

    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    return {
      policyId: policy._id.toString(),
      leaveTypeId: policy.leaveTypeId.toString(),
      leaveTypeName: (policy.leaveTypeId as any)?.name || 'Unknown',
      maxConsecutiveDays: policy.maxConsecutiveDays,
      minNoticeDays: policy.minNoticeDays,
      accrualMethod: policy.accrualMethod,
      carryForwardAllowed: policy.carryForwardAllowed,
      maxCarryForward: policy.maxCarryForward,
      expiryAfterMonths: policy.expiryAfterMonths,
    };
  }

  /**
   * Get all leave parameters summary
   */
  async getAllLeaveParametersSummary(): Promise<
    Array<{
      policyId: string;
      leaveTypeName: string;
      maxConsecutiveDays?: number;
      minNoticeDays: number;
      carryForwardAllowed: boolean;
    }>
  > {
    const policies = await this.leavePolicyModel
      .find()
      .populate('leaveTypeId')
      .exec();

    return policies.map((policy) => ({
      policyId: policy._id.toString(),
      leaveTypeName: (policy.leaveTypeId as any)?.name || 'Unknown',
      maxConsecutiveDays: policy.maxConsecutiveDays,
      minNoticeDays: policy.minNoticeDays,
      carryForwardAllowed: policy.carryForwardAllowed,
    }));
  }

  /**
   * Validate leave request against policy parameters
   * Can be used before submitting a leave request
   */
  async validateLeaveRequest(
    leaveTypeId: string,
    requestedDays: number,
    requestDate: Date,
    startDate: Date,
  ): Promise<{
    isValid: boolean;
    violations: string[];
    warnings: string[];
  }> {
    const policy = await this.leavePolicyModel
      .findOne({ leaveTypeId: new Types.ObjectId(leaveTypeId) })
      .exec();

    if (!policy) {
      return {
        isValid: false,
        violations: ['No policy configured for this leave type'],
        warnings: [],
      };
    }

    const violations: string[] = [];
    const warnings: string[] = [];

    // Check maximum consecutive days
    if (policy.maxConsecutiveDays && requestedDays > policy.maxConsecutiveDays) {
      violations.push(
        `Requested days (${requestedDays}) exceeds maximum consecutive days allowed (${policy.maxConsecutiveDays})`,
      );
    }

    // Check minimum notice period
    const daysDifference = Math.floor(
      (startDate.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDifference < policy.minNoticeDays) {
      violations.push(
        `Notice period (${daysDifference} days) is less than required minimum (${policy.minNoticeDays} days)`,
      );
    }

    // Add warnings for edge cases
    if (policy.maxConsecutiveDays && requestedDays >= policy.maxConsecutiveDays * 0.8) {
      warnings.push('Requested days is close to the maximum limit');
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings,
    };
  }

  /**
   * Configure approval workflow settings
   * This stores approval levels and requirements in policy eligibility
   */
  async configureApprovalWorkflow(
    policyId: string,
    approvalConfig: {
      requiresSupervisorApproval: boolean;
      requiresHRApproval: boolean;
      autoApproveUnderDays?: number;
      approvalLevels?: number;
    },
  ): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findById(policyId);
    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    if (!policy.eligibility) {
      policy.eligibility = {};
    }

    // Store approval workflow config in eligibility object
    policy.eligibility.approvalWorkflow = {
      requiresSupervisorApproval: approvalConfig.requiresSupervisorApproval,
      requiresHRApproval: approvalConfig.requiresHRApproval,
      autoApproveUnderDays: approvalConfig.autoApproveUnderDays,
      approvalLevels: approvalConfig.approvalLevels || 1,
    };

    policy.markModified('eligibility');
    return policy.save();
  }

  /**
   * Get approval workflow configuration for a policy
   */
  async getApprovalWorkflow(policyId: string): Promise<{
    policyId: string;
    leaveTypeName: string;
    approvalWorkflow: {
      requiresSupervisorApproval: boolean;
      requiresHRApproval: boolean;
      autoApproveUnderDays?: number;
      approvalLevels: number;
    };
  }> {
    const policy = await this.leavePolicyModel
      .findById(policyId)
      .populate('leaveTypeId')
      .exec();

    if (!policy) {
      throw new NotFoundException(`Leave policy with ID ${policyId} not found`);
    }

    const defaultWorkflow = {
      requiresSupervisorApproval: true,
      requiresHRApproval: false,
      autoApproveUnderDays: undefined,
      approvalLevels: 1,
    };

    return {
      policyId: policy._id.toString(),
      leaveTypeName: (policy.leaveTypeId as any)?.name || 'Unknown',
      approvalWorkflow: policy.eligibility?.approvalWorkflow || defaultWorkflow,
    };
  }

  /**
   * Bulk update parameters for multiple policies
   */
  async bulkUpdateParameters(
    updates: Array<{
      policyId: string;
      maxConsecutiveDays?: number;
      minNoticeDays?: number;
    }>,
  ): Promise<{ updated: number; failed: string[] }> {
    let updated = 0;
    const failed: string[] = [];

    for (const update of updates) {
      try {
        await this.configureLeaveParameters(update.policyId, {
          maxConsecutiveDays: update.maxConsecutiveDays,
          minNoticeDays: update.minNoticeDays,
        });
        updated++;
      } catch (error) {
        failed.push(update.policyId);
      }
    }

    return { updated, failed };
  }

  /**
   * Get policies requiring advance notice
   */
  async getPoliciesRequiringNotice(): Promise<
    Array<{
      policyId: string;
      leaveTypeName: string;
      minNoticeDays: number;
    }>
  > {
    const policies = await this.leavePolicyModel
      .find({ minNoticeDays: { $gt: 0 } })
      .populate('leaveTypeId')
      .exec();

    return policies.map((policy) => ({
      policyId: policy._id.toString(),
      leaveTypeName: (policy.leaveTypeId as any)?.name || 'Unknown',
      minNoticeDays: policy.minNoticeDays,
    }));
  }

  /**
   * Get policies with consecutive day limits
   */
  async getPoliciesWithDayLimits(): Promise<
    Array<{
      policyId: string;
      leaveTypeName: string;
      maxConsecutiveDays: number;
    }>
  > {
    const policies = await this.leavePolicyModel
      .find({ maxConsecutiveDays: { $exists: true, $gt: 0 } })
      .populate('leaveTypeId')
      .exec();

    return policies.map((policy) => ({
      policyId: policy._id.toString(),
      leaveTypeName: (policy.leaveTypeId as any)?.name || 'Unknown',
      maxConsecutiveDays: policy.maxConsecutiveDays!,
    }));
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// leaves-notification.service.ts
// ═══════════════════════════════════════════════════════════════════════════


/**
 * Notification Types for Leave Management
 * 
 * REQ-019: Employee notifications (status changes)
 * REQ-024: Manager notifications (assignment)
 * REQ-030: Finalization notifications (all stakeholders)
 */


/**
 * Leave Notification Service
 * 
 * Handles all leave-related notification logic and message formatting.
 * Delegates actual notification persistence to TimeManagementNotificationService.
 * 
 * REQ-019: Employee receives notifications on approval, rejection, return, modification
 * REQ-024: Manager receives notifications when requests are assigned or overdue
 * REQ-030: All stakeholders notified when request is finalized
 */
@Injectable()
export class LeavesNotificationService {
  private readonly logger = new Logger(LeavesNotificationService.name);

  constructor(
    private readonly timeManagementNotificationService: TimeManagementNotificationService,
  ) {}

  /**
   * Send a single notification using time management service
   */
  private async send(
    recipientId: string,
    type: LeaveNotificationType | string,
    message: string,
  ): Promise<NotificationLogDocument> {
    const sent = await this.timeManagementNotificationService.send(
      new Types.ObjectId(recipientId),
      type,
      message,
    );
    this.logger.log(`[LEAVE_NOTIFICATION] ${type} sent to ${recipientId}`);
    return sent;
  }

  /**
   * Get notifications for a user
   * Delegates to time management notification service
   */
  async getNotificationsForUser(
    userId: string,
    options?: { limit?: number; skip?: number },
  ): Promise<NotificationLogDocument[]> {
    return this.timeManagementNotificationService.getNotificationsForUser(
      new Types.ObjectId(userId),
      options,
    );
  }

  /**
   * Get notification count for a user
   * Delegates to time management notification service
   */
  async getNotificationCount(userId: string): Promise<number> {
    return this.timeManagementNotificationService.getNotificationCount(
      new Types.ObjectId(userId),
    );
  }

  /**
   * Send multiple notifications at once
   */
  private async sendBatch(
    notifications: { recipientId: string; type: LeaveNotificationType | string; message: string }[],
  ): Promise<NotificationLogDocument[]> {
    const results: NotificationLogDocument[] = [];
    
    for (const notification of notifications) {
      const sent = await this.timeManagementNotificationService.send(
        new Types.ObjectId(notification.recipientId),
        notification.type,
        notification.message,
      );
      results.push(sent);
    }
    
    this.logger.log(`[LEAVE_BATCH_NOTIFICATION] Sent ${results.length} notifications`);
    return results;
  }

  /**
   * Generic notification sender with structured data
   * Used for custom notification types like irregular pattern flagging
   */
  async sendNotification(params: {
    recipientId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
  }): Promise<NotificationLogDocument | null> {
    // For special recipient types like 'hr_manager', we'd need to resolve the actual ID
    // For now, log it and skip if it's a placeholder
    if (params.recipientId === 'hr_manager') {
      this.logger.log(`[NOTIFICATION] HR Manager notification (not sent - needs resolution): ${params.message}`);
      // In a real implementation, you'd resolve the HR manager ID here
      return null;
    }

    const formattedMessage = `[${params.title}] ${params.message}`;
    const sent = await this.timeManagementNotificationService.send(
      new Types.ObjectId(params.recipientId),
      params.type,
      formattedMessage,
    );
    
    this.logger.log(`[NOTIFICATION] ${params.type} sent to ${params.recipientId}: ${params.title}`);
    return sent;
  }

  // ==================== REQ-019: EMPLOYEE STATUS NOTIFICATIONS ====================

  /**
   * REQ-019: Notify employee that their leave request was approved
   */
  async notifyLeaveRequestApproved(
    employeeId: string,
    details: { leaveType: string; startDate: string; endDate: string; durationDays: number },
  ): Promise<NotificationLogDocument> {
    const message = `Your ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} (${details.durationDays} days) has been approved.`;
    return this.send(employeeId, LeaveNotificationType.LEAVE_REQUEST_APPROVED, message);
  }

  /**
   * REQ-019: Notify employee that their leave request was rejected
   */
  async notifyLeaveRequestRejected(
    employeeId: string,
    details: { leaveType: string; startDate: string; endDate: string; reason?: string },
  ): Promise<NotificationLogDocument> {
    const message = `Your ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} has been rejected.${details.reason ? ` Reason: ${details.reason}` : ''}`;
    return this.send(employeeId, LeaveNotificationType.LEAVE_REQUEST_REJECTED, message);
  }

  /**
   * REQ-019: Notify employee that their leave request was returned for correction
   */
  async notifyLeaveRequestReturned(
    employeeId: string,
    details: { leaveType: string; startDate: string; endDate: string; reason: string },
  ): Promise<NotificationLogDocument> {
    const message = `Your ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} has been returned for correction. Reason: ${details.reason}`;
    return this.send(employeeId, LeaveNotificationType.LEAVE_REQUEST_RETURNED, message);
  }

  /**
   * REQ-019: Notify employee that their leave request was modified
   */
  async notifyLeaveRequestModified(
    employeeId: string,
    details: { leaveType: string; changes: string },
  ): Promise<NotificationLogDocument> {
    const message = `Your ${details.leaveType} leave request has been modified. Changes: ${details.changes}`;
    return this.send(employeeId, LeaveNotificationType.LEAVE_REQUEST_MODIFIED, message);
  }

  // ==================== REQ-024: MANAGER ASSIGNMENT NOTIFICATIONS ====================

  /**
   * REQ-024: Notify manager that a new leave request is assigned to them
   */
  async notifyManagerRequestAssigned(
    managerId: string,
    details: { employeeName: string; leaveType: string; startDate: string; endDate: string },
  ): Promise<NotificationLogDocument> {
    const message = `A new ${details.leaveType} leave request from ${details.employeeName} for ${details.startDate} to ${details.endDate} has been assigned to you for review.`;
    return this.send(managerId, LeaveNotificationType.LEAVE_REQUEST_ASSIGNED, message);
  }

  /**
   * REQ-024: Notify manager/escalate when request is overdue (pending > 48 hrs)
   */
  async notifyRequestOverdue(
    managerId: string,
    details: { employeeName: string; leaveType: string; startDate: string; endDate: string; hoursPending: number },
  ): Promise<NotificationLogDocument> {
    const message = `URGENT: Leave request from ${details.employeeName} (${details.leaveType} for ${details.startDate} to ${details.endDate}) has been pending for ${details.hoursPending} hours and requires immediate action.`;
    return this.send(managerId, LeaveNotificationType.LEAVE_REQUEST_OVERDUE, message);
  }

  // ==================== REQ-030: FINALIZATION NOTIFICATIONS ====================

  /**
   * REQ-030: Notify all stakeholders when a leave request is finalized
   * 
   * Sends notifications to:
   * - Employee (owner of the request)
   * - Employee's Manager
   * - Attendance Coordinator (if provided)
   */
  async notifyRequestFinalized(
    stakeholders: {
      employeeId: string;
      managerId?: string;
      attendanceCoordinatorId?: string;
    },
    details: {
      employeeName: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      durationDays: number;
    },
  ): Promise<NotificationLogDocument[]> {
    const notifications: { recipientId: string; type: LeaveNotificationType; message: string }[] = [];

    // Notify employee
    notifications.push({
      recipientId: stakeholders.employeeId,
      type: LeaveNotificationType.LEAVE_REQUEST_FINALIZED,
      message: `Your ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} (${details.durationDays} days) has been finalized and approved.`,
    });

    // Notify manager
    if (stakeholders.managerId) {
      notifications.push({
        recipientId: stakeholders.managerId,
        type: LeaveNotificationType.LEAVE_REQUEST_FINALIZED,
        message: `${details.employeeName}'s ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} (${details.durationDays} days) has been finalized.`,
      });
    }

    // Notify attendance coordinator
    if (stakeholders.attendanceCoordinatorId) {
      notifications.push({
        recipientId: stakeholders.attendanceCoordinatorId,
        type: LeaveNotificationType.LEAVE_REQUEST_FINALIZED,
        message: `${details.employeeName}'s ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} (${details.durationDays} days) has been finalized. Please update attendance records.`,
      });
    }

    return this.sendBatch(notifications);
  }
}




// ═══════════════════════════════════════════════════════════════════════════
// leave-request.service.ts
// ═══════════════════════════════════════════════════════════════════════════


/**
 * Leave Request Service
 * 
 * REQ-015: As an employee, I want to submit a new leave request with details 
 * (leave type, dates, justification, and attachments) so that my absence can 
 * be reviewed and approved according to company policy.
 * 
 * Features:
 * - Submit new leave request
 * - Attach documents (e.g., doctor's note)
 * - Modify leave request (before final approval)
 * - Cancel leave request (before final approval)
 * - Check overlapping dates
 * - Validate entitlement balance
 * - Support retroactive submissions (configurable max period)
 */
@Injectable()
export class LeaveRequestService {
  // Maximum days allowed for retroactive leave submission (configurable)
  private readonly maxRetroactiveDays = 7;

  constructor(
    @InjectModel(LeaveRequest.name) private leaveRequestModel: Model<LeaveRequestDocument>,
    @InjectModel(LeaveEntitlement.name) private entitlementModel: Model<LeaveEntitlementDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(LeavePolicy.name) private policyModel: Model<LeavePolicyDocument>,
    @InjectModel(Attachment.name) private attachmentModel: Model<AttachmentDocument>,
    private employeeService: EmployeeService,
    private notificationService: LeavesNotificationService,
    private calendarService: CalendarService,
  ) {}

  // ==================== SUBMIT NEW LEAVE REQUEST (REQ-015) ====================

  /**
   * Submit a new leave request
   * 
   * Validates:
   * - Employee exists and is active
   * - Leave type exists
   * - Dates are valid (not in past beyond retroactive limit)
   * - No overlapping approved leaves
   * - Sufficient entitlement balance
   * - Attachment provided if required by leave type
   * - Policy constraints (min notice days, max consecutive days)
   */
  async submitLeaveRequest(
    createDto: CreateLeaveRequestDto,
    requesterId: string,
  ): Promise<LeaveRequestDocument> {
    const employeeId = createDto.employeeId || requesterId;

    // 1. Validate employee exists and is active
    const employee = await this.employeeService.findById(employeeId);
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // 2. Validate leave type exists
    const leaveType = await this.leaveTypeModel.findById(createDto.leaveTypeId);
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${createDto.leaveTypeId} not found`);
    }

    // 3. Get leave policy for validation
    const policy = await this.policyModel.findOne({
      leaveTypeId: new Types.ObjectId(createDto.leaveTypeId),
    });

    // 4. Validate dates
    const fromDate = new Date(createDto.startDate);
    const toDate = new Date(createDto.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (fromDate > toDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    // 5. Get holidays in the range (for duration calculation, but don't block the request)
    const holidays = await this.calendarService.getBlockedDatesInRange(fromDate, toDate);

    // 6. Check retroactive submission limit
    const daysDiff = Math.floor((today.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > this.maxRetroactiveDays) {
      throw new BadRequestException(
        `Cannot submit leave request more than ${this.maxRetroactiveDays} days after the leave date`,
      );
    }

    // 7. Check minimum notice days (if policy exists and leave is in future)
    if (policy?.minNoticeDays && fromDate > today) {
      const noticeDays = Math.floor((fromDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (noticeDays < policy.minNoticeDays) {
        throw new BadRequestException(
          `This leave type requires at least ${policy.minNoticeDays} days advance notice`,
        );
      }
    }

    // 8. Calculate duration in business days (excluding weekends and holidays)
    const durationDays = this.calculateBusinessDaysExcludingHolidays(fromDate, toDate, holidays);
    if (durationDays < 0.5) {
      throw new BadRequestException('Leave duration must be at least half a day');
    }

    // 9. Check maximum consecutive days
    if (policy?.maxConsecutiveDays && durationDays > policy.maxConsecutiveDays) {
      throw new BadRequestException(
        `Maximum consecutive days for this leave type is ${policy.maxConsecutiveDays}`,
      );
    }

    // 10. Check for overlapping approved leaves
    const overlapping = await this.checkOverlappingLeaves(employeeId, fromDate, toDate);
    if (overlapping.length > 0) {
      throw new BadRequestException(
        'You have overlapping approved leave requests for the selected dates',
      );
    }

    // 11. Validate entitlement balance (if leave type is deductible)
    if (leaveType.deductible) {
      const entitlement = await this.entitlementModel.findOne({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(createDto.leaveTypeId),
      });

      if (!entitlement) {
        throw new BadRequestException(
          'No entitlement found for this leave type. Please contact HR.',
        );
      }

      // Calculate available balance based on accrued days (not full yearly entitlement)
      // Employee can only use what they've accrued so far
      const accruedBalance = entitlement.accruedRounded + entitlement.carryForward;
      const availableBalance = accruedBalance - entitlement.taken - entitlement.pending;
      
      if (durationDays > availableBalance) {
        throw new BadRequestException(
          `Insufficient accrued leave balance. Available: ${availableBalance} days (Accrued: ${entitlement.accruedRounded}, Carry Forward: ${entitlement.carryForward}, Taken: ${entitlement.taken}, Pending: ${entitlement.pending}), Requested: ${durationDays} days`,
        );
      }
    }

    // 12. Validate attachment if required
    if (leaveType.requiresAttachment && !createDto.attachmentId) {
      throw new BadRequestException(
        `This leave type requires an attachment (${leaveType.attachmentType || 'document'})`,
      );
    }

    // 13. Validate attachment exists if provided
    if (createDto.attachmentId) {
      const attachment = await this.attachmentModel.findById(createDto.attachmentId);
      if (!attachment) {
        throw new NotFoundException(`Attachment with ID ${createDto.attachmentId} not found`);
      }
    }

    // 14. Enforce special absence rules (cumulative tracking, occurrence tracking)
    const specialAbsenceRule = policy?.eligibility?.specialAbsenceRule;
    if (specialAbsenceRule) {
      // Check cumulative tracking (e.g., sick leave over 3 years: max 360 days)
      if (specialAbsenceRule.trackCumulatively && specialAbsenceRule.cumulativeMaxDays) {
        const cumulativePeriodYears = specialAbsenceRule.cumulativePeriodYears || 3;
        const periodStartDate = new Date();
        periodStartDate.setFullYear(periodStartDate.getFullYear() - cumulativePeriodYears);

        // Count total days taken in the cumulative period
        const cumulativeTaken = await this.leaveRequestModel.aggregate([
          {
            $match: {
              employeeId: new Types.ObjectId(employeeId),
              leaveTypeId: new Types.ObjectId(createDto.leaveTypeId),
              status: { $in: [LeaveStatus.APPROVED, LeaveStatus.PENDING] },
              'dates.from': { $gte: periodStartDate },
            },
          },
          {
            $group: {
              _id: null,
              totalDays: { $sum: '$durationDays' },
            },
          },
        ]);

        const totalCumulativeDays = (cumulativeTaken[0]?.totalDays || 0) + durationDays;
        if (totalCumulativeDays > specialAbsenceRule.cumulativeMaxDays) {
          throw new BadRequestException(
            `Cumulative limit exceeded: ${specialAbsenceRule.cumulativeMaxDays} days allowed over ${cumulativePeriodYears} years. ` +
            `You have used ${cumulativeTaken[0]?.totalDays || 0} days, requesting ${durationDays} days.`,
          );
        }
        console.log(`Cumulative tracking: ${totalCumulativeDays}/${specialAbsenceRule.cumulativeMaxDays} days used`);
      }

      // Check occurrence tracking (e.g., maternity leave: max 3 times)
      if (specialAbsenceRule.trackOccurrences && specialAbsenceRule.maxOccurrences) {
        const occurrenceCount = await this.leaveRequestModel.countDocuments({
          employeeId: new Types.ObjectId(employeeId),
          leaveTypeId: new Types.ObjectId(createDto.leaveTypeId),
          status: LeaveStatus.APPROVED,
        });

        if (occurrenceCount >= specialAbsenceRule.maxOccurrences) {
          throw new BadRequestException(
            `Maximum occurrences exceeded: ${specialAbsenceRule.maxOccurrences} times allowed. ` +
            `You have already used this leave type ${occurrenceCount} times.`,
          );
        }
        console.log(`Occurrence tracking: ${occurrenceCount + 1}/${specialAbsenceRule.maxOccurrences} occurrences`);
      }
    }

    // 15. Determine initial approval flow based on policy configuration
    const approvalFlow = await this.buildApprovalFlow(employeeId, policy);

    // 16. Check for auto-approve threshold
    const autoApproveUnderDays = policy?.eligibility?.approvalWorkflow?.autoApproveUnderDays;
    let initialStatus = LeaveStatus.PENDING;
    
    if (autoApproveUnderDays && durationDays < autoApproveUnderDays) {
      console.log(`Auto-approving leave request: ${durationDays} days < ${autoApproveUnderDays} days threshold`);
      initialStatus = LeaveStatus.APPROVED;
      // Mark all approval steps as approved
      approvalFlow.forEach(step => {
        step.status = 'approved';
        step.decidedAt = new Date();
      });
    }

    // 17. Check for irregular pattern (e.g., Friday/Monday pattern)
    const irregularPatternFlag = this.checkIrregularPattern(fromDate, toDate);

    // 18. Create the leave request
    const leaveRequest = new this.leaveRequestModel({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(createDto.leaveTypeId),
      dates: {
        from: fromDate,
        to: toDate,
      },
      durationDays,
      justification: createDto.justification,
      attachmentId: createDto.attachmentId
        ? new Types.ObjectId(createDto.attachmentId)
        : undefined,
      approvalFlow,
      status: initialStatus,
      irregularPatternFlag,
    });

    const savedRequest = await leaveRequest.save();

    // 16. Update pending balance in entitlement
    if (leaveType.deductible) {
      await this.entitlementModel.updateOne(
        {
          employeeId: new Types.ObjectId(employeeId),
          leaveTypeId: new Types.ObjectId(createDto.leaveTypeId),
        },
        {
          $inc: { pending: durationDays },
        },
      );
    }

    // REQ-024: Notify manager that a new leave request is assigned to them
    const managerStep = approvalFlow.find((step) => step.role === 'direct_manager');
    if (managerStep?.decidedBy) {
      const manager = await this.employeeService.findById(managerStep.decidedBy.toString());
      if (manager) {
        await this.notificationService.notifyManagerRequestAssigned(
          managerStep.decidedBy.toString(),
          {
            employeeName: `${employee.firstName} ${employee.lastName}`,
            leaveType: leaveType.name,
            startDate: fromDate.toISOString().split('T')[0],
            endDate: toDate.toISOString().split('T')[0],
          },
        );
      }
    }

    return savedRequest;
  }

  // ==================== ATTACH DOCUMENTS ====================

  /**
   * Attach a document to an existing leave request
   */
  async attachDocument(
    requestId: string,
    attachmentId: string,
    requesterId: string,
  ): Promise<LeaveRequestDocument> {
    const leaveRequest = await this.leaveRequestModel.findById(requestId);
    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${requestId} not found`);
    }

    // Only the employee who submitted can attach documents
    if (leaveRequest.employeeId.toString() !== requesterId) {
      throw new ForbiddenException('You can only attach documents to your own leave requests');
    }

    // Can only attach to non-approved/cancelled requests
    if ([LeaveStatus.APPROVED, LeaveStatus.CANCELLED].includes(leaveRequest.status)) {
      throw new BadRequestException('Cannot attach documents to approved or cancelled requests');
    }

    // Validate attachment exists
    const attachment = await this.attachmentModel.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${attachmentId} not found`);
    }

    leaveRequest.attachmentId = new Types.ObjectId(attachmentId);
    return leaveRequest.save();
  }

  // ==================== MODIFY LEAVE REQUEST ====================

  /**
   * Modify a leave request (before final approval)
   * 
   * Employee can modify dates, justification, and attachments
   * if the request is still pending or returned for correction
   */
  async modifyLeaveRequest(
    requestId: string,
    updateDto: UpdateLeaveRequestDto,
    requesterId: string,
  ): Promise<LeaveRequestDocument> {
    const leaveRequest = await this.leaveRequestModel.findById(requestId);
    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${requestId} not found`);
    }

    // Only the employee who submitted can modify
    if (leaveRequest.employeeId.toString() !== requesterId) {
      throw new ForbiddenException('You can only modify your own leave requests');
    }

    // Can only modify pending requests
    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'Cannot modify a leave request that has been approved, rejected, or cancelled',
      );
    }

    const oldDuration = leaveRequest.durationDays;
    const leaveType = await this.leaveTypeModel.findById(leaveRequest.leaveTypeId);

    // Calculate new duration if dates are being updated
    let newDuration = oldDuration;

    // Validate and apply new dates if provided
    if (updateDto.startDate || updateDto.endDate) {
      const fromDate = new Date(updateDto.startDate || leaveRequest.dates.from);
      const toDate = new Date(updateDto.endDate || leaveRequest.dates.to);

      if (fromDate > toDate) {
        throw new BadRequestException('Start date cannot be after end date');
      }

      // Get holidays in the range (for duration calculation)
      const holidays = await this.calendarService.getBlockedDatesInRange(fromDate, toDate);

      // Check for overlapping leaves (excluding this request)
      const overlapping = await this.checkOverlappingLeaves(
        leaveRequest.employeeId.toString(),
        fromDate,
        toDate,
        requestId,
      );
      if (overlapping.length > 0) {
        throw new BadRequestException(
          'You have overlapping approved leave requests for the selected dates',
        );
      }

      leaveRequest.dates = { from: fromDate, to: toDate };

      // Recalculate duration based on new dates (excluding holidays)
      newDuration = this.calculateBusinessDaysExcludingHolidays(fromDate, toDate, holidays);
      if (newDuration < 0.5) {
        throw new BadRequestException('Leave duration must be at least half a day');
      }
    }

    // Check balance if duration increased
    if (newDuration > oldDuration && leaveType?.deductible) {
      const entitlement = await this.entitlementModel.findOne({
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
      });

      if (entitlement) {
        // Calculate available balance based on accrued days (not full yearly entitlement)
        // When modifying, oldDuration is already in pending, so add it back to get actual available
        const accruedBalance = entitlement.accruedRounded + entitlement.carryForward;
        const availableBalance = accruedBalance - entitlement.taken - entitlement.pending + oldDuration;
        
        if (newDuration > availableBalance) {
          throw new BadRequestException(
            `Insufficient accrued leave balance. Available: ${availableBalance} days (Accrued: ${entitlement.accruedRounded}, Carry Forward: ${entitlement.carryForward}, Taken: ${entitlement.taken}, Pending: ${entitlement.pending - oldDuration}), Requested: ${newDuration} days`,
          );
        }
      }
    }

    // Update pending balance difference if duration changed
    if (newDuration !== oldDuration && leaveType?.deductible) {
      const difference = newDuration - oldDuration;
      await this.entitlementModel.updateOne(
        {
          employeeId: leaveRequest.employeeId,
          leaveTypeId: leaveRequest.leaveTypeId,
        },
        {
          $inc: { pending: difference },
        },
      );
    }

    // Update duration
    leaveRequest.durationDays = newDuration;

    // Update other fields
    if (updateDto.justification !== undefined) {
      leaveRequest.justification = updateDto.justification;
    }

    if (updateDto.attachmentId !== undefined) {
      if (updateDto.attachmentId) {
        const attachment = await this.attachmentModel.findById(updateDto.attachmentId);
        if (!attachment) {
          throw new NotFoundException(`Attachment with ID ${updateDto.attachmentId} not found`);
        }
        leaveRequest.attachmentId = new Types.ObjectId(updateDto.attachmentId);
      } else {
        leaveRequest.attachmentId = undefined;
      }
    }

    // Recheck irregular pattern
    leaveRequest.irregularPatternFlag = this.checkIrregularPattern(
      leaveRequest.dates.from,
      leaveRequest.dates.to,
    );

    return leaveRequest.save();
  }

  // ==================== CANCEL LEAVE REQUEST ====================

  /**
   * Cancel a leave request before final approval
   */
  async cancelLeaveRequest(
    requestId: string,
    requesterId: string,
  ): Promise<LeaveRequestDocument> {
    const leaveRequest = await this.leaveRequestModel.findById(requestId);
    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${requestId} not found`);
    }

    // Only the employee who submitted can cancel
    if (leaveRequest.employeeId.toString() !== requesterId) {
      throw new ForbiddenException('You can only cancel your own leave requests');
    }

    // Can only cancel pending requests
    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel a leave request that is ${leaveRequest.status}. Only pending requests can be cancelled.`,
      );
    }

    const leaveType = await this.leaveTypeModel.findById(leaveRequest.leaveTypeId);

    // Restore pending balance if was deductible
    if (leaveType?.deductible) {
      await this.entitlementModel.updateOne(
        {
          employeeId: leaveRequest.employeeId,
          leaveTypeId: leaveRequest.leaveTypeId,
        },
        {
          $inc: { pending: -leaveRequest.durationDays },
        },
      );
    }

    leaveRequest.status = LeaveStatus.CANCELLED;
    const savedRequest = await leaveRequest.save();

    // TODO: Notify relevant parties
    // await this.notificationService.notifyCancellation(savedRequest);

    return savedRequest;
  }

  // ==================== GET REQUESTS ====================

  /**
   * Get all leave requests for an employee
   */
  async getEmployeeLeaveRequests(
    employeeId: string,
    status?: LeaveStatus,
  ): Promise<LeaveRequestDocument[]> {
    const query: any = { employeeId: new Types.ObjectId(employeeId) };
    if (status) {
      query.status = status;
    }

    return this.leaveRequestModel
      .find(query)
      .populate('leaveTypeId', 'code name')
      .populate('attachmentId')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get a single leave request by ID
   */
  async getLeaveRequestById(requestId: string): Promise<LeaveRequestDocument> {
    const leaveRequest = await this.leaveRequestModel
      .findById(requestId)
      .populate('employeeId', 'firstName lastName employeeNumber')
      .populate('leaveTypeId', 'code name requiresAttachment attachmentType')
      .populate('attachmentId')
      .exec();

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${requestId} not found`);
    }

    return leaveRequest;
  }

  /**
   * Get leave requests pending for a specific employee (as requester)
   */
  async getPendingRequests(employeeId: string): Promise<LeaveRequestDocument[]> {
    return this.leaveRequestModel
      .find({
        employeeId: new Types.ObjectId(employeeId),
        status: LeaveStatus.PENDING,
      })
      .populate('leaveTypeId', 'code name')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * REQ-032 & REQ-033: Get leave history for an employee with filters and sorting
   * Returns past leave requests with their statuses for tracking leave usage over time
   */
  async getEmployeeLeaveHistory(
    employeeId: string,
    filters?: {
      leaveTypeId?: string;
      status?: LeaveStatus;
      startDate?: Date;
      endDate?: Date;
      sortBy?: 'date' | 'status' | 'leaveType' | 'duration';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<LeaveRequestDocument[]> {
    const query: any = { employeeId: new Types.ObjectId(employeeId) };
    
    // Filter by leave type
    if (filters?.leaveTypeId) {
      query.leaveTypeId = new Types.ObjectId(filters.leaveTypeId);
    }

    // Filter by status
    if (filters?.status) {
      query.status = filters.status;
    }

    // Filter by date range
    if (filters?.startDate || filters?.endDate) {
      query['dates.from'] = {};
      if (filters?.startDate) {
        query['dates.from'].$gte = filters.startDate;
      }
      if (filters?.endDate) {
        query['dates.from'].$lte = filters.endDate;
      }
    }

    // Determine sort field
    let sortField: string;
    switch (filters?.sortBy) {
      case 'status':
        sortField = 'status';
        break;
      case 'leaveType':
        sortField = 'leaveTypeId';
        break;
      case 'duration':
        sortField = 'durationDays';
        break;
      case 'date':
      default:
        sortField = 'dates.from';
    }

    // Determine sort order (default: descending for dates)
    const sortOrder = filters?.sortOrder === 'asc' ? 1 : -1;

    return this.leaveRequestModel
      .find(query)
      .populate('leaveTypeId', 'code name')
      .populate('attachmentId')
      .sort({ [sortField]: sortOrder })
      .exec();
  }

  // ==================== MANAGER REVIEW/APPROVE/REJECT (REQ-020, REQ-021, REQ-022) ====================

  /**
   * REQ-020: Get leave requests assigned to a manager for review
   * 
   * Returns all pending leave requests where the manager is the next approver
   */
  async getRequestsForManagerReview(managerId: string): Promise<LeaveRequestDocument[]> {
    const managerObjectId = new Types.ObjectId(managerId);

    return this.leaveRequestModel
      .find({
        status: LeaveStatus.PENDING,
        'approvalFlow': {
          $elemMatch: {
            role: 'direct_manager',
            status: 'pending',
            decidedBy: managerObjectId,
          },
        },
      })
      .populate('employeeId', 'firstName lastName employeeNumber primaryDepartmentId')
      .populate('leaveTypeId', 'code name')
      .populate('attachmentId')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * REQ-034: Manager view of team balances and upcoming leaves
   *
   * Returns an array of team members with their entitlements and upcoming leaves
   */
  async getTeamBalancesAndUpcomingLeaves(
    managerId: string,
    filters?: {
      leaveTypeId?: string;
      status?: LeaveStatus;
      startDate?: Date;
      endDate?: Date;
      departmentId?: string;
      sortBy?: 'name' | 'department' | 'upcomingDate';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<any[]> {
    // Find manager profile
    const manager = await this.employeeService.findById(managerId);
    if (!manager) {
      throw new NotFoundException(`Manager with ID ${managerId} not found`);
    }

    const managerRolesDoc = await this.employeeService.getSystemRoleForEmployee(manager._id);
    const managerRoles = managerRolesDoc?.roles ?? [];

    console.log('[Team Balances] Manager:', {
      _id: manager._id,
      name: `${manager.firstName} ${manager.lastName}`,
      roles: managerRoles,
      primaryDepartmentId: manager.primaryDepartmentId,
    });

    // Build employee query based on role:
    // - HR Admin: can view all departments
    // - Department Head: can only view their department
    const employeeModel = this.employeeService['employeeModel'];
    const teamQuery: any = { status: 'ACTIVE' };
    
    if (managerRoles.includes(SystemRole.HR_ADMIN)) {
      // HR Admin sees all departments
      console.log('[Team Balances] HR Admin - viewing all departments');
      if (filters?.departmentId) {
        // Allow filtering by specific department if provided
        teamQuery.primaryDepartmentId = new Types.ObjectId(filters.departmentId);
      }
      // Otherwise no department filter - show all
    } else if (managerRoles.includes(SystemRole.DEPARTMENT_HEAD)) {
      // Department Head sees only their department
      if (manager.primaryDepartmentId) {
        const normalizedDeptId = new Types.ObjectId(manager.primaryDepartmentId.toString());
        teamQuery.primaryDepartmentId = normalizedDeptId;
        console.log('[Team Balances] Department Head - viewing department:', normalizedDeptId);
      } else {
        console.warn('[Team Balances] Department Head has no primaryDepartmentId - will return no employees');
      }
    } else {
      // HR Manager or other roles: fallback to supervisor-based logic
      if (manager.primaryPositionId) {
        const normalizedPositionId = new Types.ObjectId(manager.primaryPositionId.toString());
        teamQuery.supervisorPositionId = normalizedPositionId;
        console.log('[Team Balances] Using supervisor-based query for position:', normalizedPositionId);
      } else {
        console.warn('[Team Balances] Manager has no primaryPositionId - will return no employees');
      }
      if (filters?.departmentId) {
        teamQuery.primaryDepartmentId = new Types.ObjectId(filters.departmentId);
      }
    }

    console.log('[Team Balances] Query for team employees:', teamQuery);

    const teamMembers = await employeeModel
      .find(teamQuery)
      .select('_id firstName lastName employeeNumber primaryDepartmentId')
      .exec();

    console.log('[Team Balances] Found team members:', teamMembers.length);
    teamMembers.forEach((member, idx) => {
      console.log(`  ${idx + 1}. ${member.firstName} ${member.lastName} (${member._id})`);
    });

    // Default date range for upcoming if not provided: today -> 90 days out
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const defaultEnd = new Date(today);
    defaultEnd.setDate(defaultEnd.getDate() + 90);
    const startDate = filters?.startDate || today;
    const endDate = filters?.endDate || defaultEnd;

    const results: any[] = [];

    for (const member of teamMembers) {
      // Entitlements for this member
      const entitlements = await this.entitlementModel
        .find({ employeeId: member._id })
        .populate('leaveTypeId', 'code name deductible')
        .exec();

      // Build upcoming leaves query
      const leaveQuery: any = {
        employeeId: new Types.ObjectId(member._id),
        'dates.from': { $gte: startDate, $lte: endDate },
      };

      // Status filter - default include pending and approved upcoming
      if (filters?.status) {
        leaveQuery.status = filters.status;
      } else {
        leaveQuery.status = { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] };
      }

      if (filters?.leaveTypeId) {
        leaveQuery.leaveTypeId = new Types.ObjectId(filters.leaveTypeId);
      }

      const upcomingLeaves = await this.leaveRequestModel
        .find(leaveQuery)
        .populate('leaveTypeId', 'code name')
        .populate('attachmentId')
        .sort({ 'dates.from': 1 })
        .exec();

      results.push({
        employee: member,
        entitlements,
        upcomingLeaves,
      });
    }

    // Sorting
    const sortOrder = filters?.sortOrder === 'asc' ? 1 : -1;
    switch (filters?.sortBy) {
      case 'department':
        results.sort((a, b) => {
          const da = a.employee.primaryDepartmentId?.toString() || '';
          const db = b.employee.primaryDepartmentId?.toString() || '';
          if (da === db) return 0;
          return da > db ? sortOrder : -sortOrder;
        });
        break;
      case 'upcomingDate':
        results.sort((a, b) => {
          const aDate = a.upcomingLeaves?.[0]?.dates?.from ? new Date(a.upcomingLeaves[0].dates.from).getTime() : Infinity;
          const bDate = b.upcomingLeaves?.[0]?.dates?.from ? new Date(b.upcomingLeaves[0].dates.from).getTime() : Infinity;
          return (aDate - bDate) * sortOrder;
        });
        break;
      case 'name':
      default:
        results.sort((a, b) => {
          const an = `${a.employee.lastName || ''} ${a.employee.firstName || ''}`.toLowerCase();
          const bn = `${b.employee.lastName || ''} ${b.employee.firstName || ''}`.toLowerCase();
          if (an === bn) return 0;
          return an > bn ? sortOrder : -sortOrder;
        });
        break;
    }

    return results;
  }

  /**
   * REQ-021: Manager approves a leave request
   * 
   * Validates:
   * - Leave request exists and is pending
   * - Manager is assigned as the approver for current step
   * - Updates approval flow and advances to next step (HR) or finalizes
   */
  async managerApproveRequest(
    requestId: string,
    managerId: string,
    comments?: string,
    irregularPatternFlag?: boolean,
  ): Promise<LeaveRequestDocument> {
    const leaveRequest = await this.leaveRequestModel.findById(requestId);
    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${requestId} not found`);
    }

    // Validate request is still pending
    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve a leave request that is ${leaveRequest.status}`,
      );
    }

    // Find the manager's approval step
    const managerStepIndex = leaveRequest.approvalFlow.findIndex(
      (step) =>
        step.role === 'direct_manager' &&
        step.status === 'pending' &&
        step.decidedBy?.toString() === managerId,
    );

    if (managerStepIndex === -1) {
      throw new ForbiddenException(
        'You are not authorized to approve this leave request or it has already been processed',
      );
    }

    // Update the manager's approval step
    leaveRequest.approvalFlow[managerStepIndex].status = 'approved';
    leaveRequest.approvalFlow[managerStepIndex].decidedAt = new Date();

    // Set irregular pattern flag if manager flagged it
    if (irregularPatternFlag !== undefined) {
      leaveRequest.irregularPatternFlag = irregularPatternFlag;
    }

    // Manager approved - request stays PENDING until HR also approves
    // No status change here, HR will finalize

    const savedRequest = await leaveRequest.save();

    // Note: No notification here - REQ-024 only covers manager notifications for new assignments
    // HR will see pending requests via their review queue

    return savedRequest;
  }

  /**
   * REQ-022: Manager rejects a leave request
   * 
   * Validates:
   * - Leave request exists and is pending
   * - Manager is assigned as the approver for current step
   * - Updates approval flow and marks request as rejected
   */
  async managerRejectRequest(
    requestId: string,
    managerId: string,
    comments?: string,
    irregularPatternFlag?: boolean,
  ): Promise<LeaveRequestDocument> {
    const leaveRequest = await this.leaveRequestModel.findById(requestId);
    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${requestId} not found`);
    }

    // Validate request is still pending
    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject a leave request that is ${leaveRequest.status}`,
      );
    }

    // Find the manager's approval step
    const managerStepIndex = leaveRequest.approvalFlow.findIndex(
      (step) =>
        step.role === 'direct_manager' &&
        step.status === 'pending' &&
        step.decidedBy?.toString() === managerId,
    );

    if (managerStepIndex === -1) {
      throw new ForbiddenException(
        'You are not authorized to reject this leave request or it has already been processed',
      );
    }

    // Update the manager's approval step
    leaveRequest.approvalFlow[managerStepIndex].status = 'rejected';
    leaveRequest.approvalFlow[managerStepIndex].decidedAt = new Date();

    // Set irregular pattern flag if manager flagged it
    if (irregularPatternFlag !== undefined) {
      leaveRequest.irregularPatternFlag = irregularPatternFlag;
    }

    // Manager rejected - request stays PENDING until HR reviews and confirms rejection
    // HR will finalize the rejection
    
    // Restore pending balance when manager rejects
    const leaveType = await this.leaveTypeModel.findById(leaveRequest.leaveTypeId);
    if (leaveType?.deductible) {
      await this.entitlementModel.updateOne(
        {
          employeeId: leaveRequest.employeeId,
          leaveTypeId: leaveRequest.leaveTypeId,
        },
        {
          $inc: { pending: -leaveRequest.durationDays },
        },
      );
    }

    const savedRequest = await leaveRequest.save();

    // Note: No notification here - manager rejection is not final
    // HR will send the final rejection notification when they confirm the rejection
    // This ensures the employee only gets one rejection notification (the final one from HR)

    return savedRequest;
  }

  // ==================== HR ACTIONS (REQ-025, REQ-026) ====================

  /**
   * Get leave requests pending HR review
   * Pool system: Returns all requests where manager has approved, any HR can process
   * The HR user who processes it will be recorded in decidedBy
   */
  async getRequestsForHRReview(hrManagerId: string): Promise<LeaveRequestDocument[]> {
    // Note: hrManagerId parameter kept for potential future filtering (e.g., by department)
    // but currently all HR users see the same pool

    return this.leaveRequestModel
      .find({
        status: LeaveStatus.PENDING,
        'approvalFlow': {
          $elemMatch: {
            role: 'hr_manager',
            status: 'pending',
          },
        },
        // Manager must have already approved
        'approvalFlow.0.status': 'approved',
      })
      .populate('employeeId', 'firstName lastName employeeNumber primaryDepartmentId')
      .populate('leaveTypeId', 'code name')
      .populate('attachmentId')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get all leave requests that were rejected by manager but HR step is still pending
   * These can be overridden by HR Managers/Admins
   */
  async getRejectedRequestsForHR(): Promise<LeaveRequestDocument[]> {
    return this.leaveRequestModel
      .find({
        status: LeaveStatus.PENDING,
        'approvalFlow': {
          $elemMatch: {
            role: 'hr_manager',
            status: 'pending',
          },
        },
        // Manager must have rejected
        'approvalFlow.0.status': 'rejected',
      })
      .populate('employeeId', 'firstName lastName employeeNumber primaryDepartmentId')
      .populate('leaveTypeId', 'code name')
      .populate('attachmentId')
      .sort({ updatedAt: -1 })
      .exec();
  }

  /**
   * REQ-025: HR finalizes an approved leave request
   * 
   * Called after manager has approved. This is the final step.
   * Updates employee records and adjusts balances.
   */
  async hrFinalizeRequest(
    requestId: string,
    hrManagerId: string,
    comments?: string,
  ): Promise<LeaveRequestDocument> {
    const leaveRequest = await this.leaveRequestModel.findById(requestId);
    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${requestId} not found`);
    }

    // Validate request is still pending
    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Cannot finalize a leave request that is ${leaveRequest.status}`,
      );
    }

    // Check that manager has already approved
    const managerStep = leaveRequest.approvalFlow.find(
      (step) => step.role === 'direct_manager',
    );

    if (!managerStep || managerStep.status !== 'approved') {
      throw new BadRequestException(
        'Cannot finalize: Direct manager has not approved this request yet',
      );
    }

    // Find HR step (pool system - any HR can process)
    const hrStepIndex = leaveRequest.approvalFlow.findIndex(
      (step) =>
        step.role === 'hr_manager' &&
        step.status === 'pending',
    );

    if (hrStepIndex === -1) {
      throw new ForbiddenException(
        'You are not authorized to finalize this request or it has already been processed',
      );
    }

    // Update HR approval step
    leaveRequest.approvalFlow[hrStepIndex].status = 'approved';
    leaveRequest.approvalFlow[hrStepIndex].decidedBy = new Types.ObjectId(hrManagerId);
    leaveRequest.approvalFlow[hrStepIndex].decidedAt = new Date();

    // Finalize the request
    leaveRequest.status = LeaveStatus.APPROVED;

    // Update balances: deduct from remaining, clear pending, add to used
    const leaveType = await this.leaveTypeModel.findById(leaveRequest.leaveTypeId);
    if (leaveType?.deductible) {
      await this.entitlementModel.updateOne(
        {
          employeeId: leaveRequest.employeeId,
          leaveTypeId: leaveRequest.leaveTypeId,
        },
        {
          $inc: {
            remaining: -leaveRequest.durationDays,
            pending: -leaveRequest.durationDays,
            taken: leaveRequest.durationDays,
          },
        },
      );
    }

    const savedRequest = await leaveRequest.save();

    // REQ-030: Notify all stakeholders about finalization
    const employee = await this.employeeService.findById(leaveRequest.employeeId.toString());
    if (employee && leaveType) {
      // Get manager ID from approval flow
      const managerId = managerStep.decidedBy?.toString();
      
      // TODO: Get attendance coordinator ID (could be from department or system role)
      // For now, we'll just notify employee and manager
      
      await this.notificationService.notifyRequestFinalized(
        {
          employeeId: leaveRequest.employeeId.toString(),
          managerId: managerId,
          // attendanceCoordinatorId: attendanceCoordinatorId,
        },
        {
          employeeName: `${employee.firstName} ${employee.lastName}`,
          leaveType: leaveType.name,
          startDate: leaveRequest.dates.from.toISOString().split('T')[0],
          endDate: leaveRequest.dates.to.toISOString().split('T')[0],
          durationDays: leaveRequest.durationDays,
        },
      );
    }

    return savedRequest;
  }

  /**
   * HR rejects a leave request
   */
  async hrRejectRequest(
    requestId: string,
    hrManagerId: string,
    comments?: string,
  ): Promise<LeaveRequestDocument> {
    const leaveRequest = await this.leaveRequestModel.findById(requestId);
    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${requestId} not found`);
    }

    // Validate request is still pending
    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject a leave request that is ${leaveRequest.status}`,
      );
    }

    // Find HR step (pool system - any HR can process)
    const hrStepIndex = leaveRequest.approvalFlow.findIndex(
      (step) => step.role === 'hr_manager' && step.status === 'pending',
    );

    if (hrStepIndex === -1) {
      throw new BadRequestException(
        'This request has already been processed by HR',
      );
    }

    // Update HR rejection step - record who processed it
    leaveRequest.approvalFlow[hrStepIndex].status = 'rejected';
    leaveRequest.approvalFlow[hrStepIndex].decidedBy = new Types.ObjectId(hrManagerId);
    leaveRequest.approvalFlow[hrStepIndex].decidedAt = new Date();

    // Mark request as rejected
    leaveRequest.status = LeaveStatus.REJECTED;

    // Restore pending balance
    const leaveType = await this.leaveTypeModel.findById(leaveRequest.leaveTypeId);
    if (leaveType?.deductible) {
      await this.entitlementModel.updateOne(
        {
          employeeId: leaveRequest.employeeId,
          leaveTypeId: leaveRequest.leaveTypeId,
        },
        {
          $inc: { pending: -leaveRequest.durationDays },
        },
      );
    }

    const savedRequest = await leaveRequest.save();

    // REQ-019: Notify employee about HR rejection
    const employee = await this.employeeService.findById(leaveRequest.employeeId.toString());
    if (employee && leaveType) {
      await this.notificationService.notifyLeaveRequestRejected(
        leaveRequest.employeeId.toString(),
        {
          leaveType: leaveType.name,
          startDate: leaveRequest.dates.from.toISOString().split('T')[0],
          endDate: leaveRequest.dates.to.toISOString().split('T')[0],
          reason: comments,
        },
      );
    }

    return savedRequest;
  }

  /**
   * REQ-026: HR overrides a manager's decision
   * 
   * Can be used to:
   * - Approve a request that was rejected by manager
   * - Approve a request bypassing manager approval
   */
  async hrOverrideDecision(
    requestId: string,
    hrManagerId: string,
    action: 'approve' | 'reject',
    options?: {
      comments?: string;
    },
  ): Promise<LeaveRequestDocument> {
    const leaveRequest = await this.leaveRequestModel.findById(requestId);
    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${requestId} not found`);
    }

    // HR can override pending OR rejected requests
    if (![LeaveStatus.PENDING, LeaveStatus.REJECTED].includes(leaveRequest.status)) {
      throw new BadRequestException(
        `Cannot override a leave request that is ${leaveRequest.status}. Only pending or rejected requests can be overridden.`,
      );
    }

    const leaveType = await this.leaveTypeModel.findById(leaveRequest.leaveTypeId);

    if (action === 'approve') {
      // Always check balance - negative balance not allowed
      if (leaveType?.deductible) {
        const entitlement = await this.entitlementModel.findOne({
          employeeId: leaveRequest.employeeId,
          leaveTypeId: leaveRequest.leaveTypeId,
        });

        if (entitlement) {
          // remaining already represents available balance
          // For rejected requests, pending was already restored to remaining
          const availableBalance = entitlement.remaining;
          
          if (leaveRequest.durationDays > availableBalance) {
            throw new BadRequestException(
              `Insufficient leave balance. Available: ${availableBalance} days, Requested: ${leaveRequest.durationDays} days.`,
            );
          }
        }
      }

      // Update all approval steps as approved by HR override
      leaveRequest.approvalFlow.forEach((step, index) => {
        if (step.status === 'pending' || step.status === 'rejected') {
          leaveRequest.approvalFlow[index].status = 'approved';
          leaveRequest.approvalFlow[index].decidedBy = new Types.ObjectId(hrManagerId);
          leaveRequest.approvalFlow[index].decidedAt = new Date();
        }
      });

      // If request was previously rejected, we need to re-add to pending first
      if (leaveRequest.status === LeaveStatus.REJECTED && leaveType?.deductible) {
        // The pending was already cleared when rejected, now we finalize directly
        await this.entitlementModel.updateOne(
          {
            employeeId: leaveRequest.employeeId,
            leaveTypeId: leaveRequest.leaveTypeId,
          },
          {
            $inc: {
              remaining: -leaveRequest.durationDays,
              taken: leaveRequest.durationDays,
            },
          },
        );
      } else if (leaveType?.deductible) {
        // Normal case: move from pending to used
        await this.entitlementModel.updateOne(
          {
            employeeId: leaveRequest.employeeId,
            leaveTypeId: leaveRequest.leaveTypeId,
          },
          {
            $inc: {
              remaining: -leaveRequest.durationDays,
              pending: -leaveRequest.durationDays,
              taken: leaveRequest.durationDays,
            },
          },
        );
      }

      leaveRequest.status = LeaveStatus.APPROVED;
    } else {
      // Reject action
      leaveRequest.approvalFlow.forEach((step, index) => {
        if (step.status === 'pending') {
          leaveRequest.approvalFlow[index].status = 'rejected';
          leaveRequest.approvalFlow[index].decidedBy = new Types.ObjectId(hrManagerId);
          leaveRequest.approvalFlow[index].decidedAt = new Date();
        }
      });

      // Restore pending balance if still pending
      if (leaveRequest.status === LeaveStatus.PENDING && leaveType?.deductible) {
        await this.entitlementModel.updateOne(
          {
            employeeId: leaveRequest.employeeId,
            leaveTypeId: leaveRequest.leaveTypeId,
          },
          {
            $inc: { pending: -leaveRequest.durationDays },
          },
        );
      }

      leaveRequest.status = LeaveStatus.REJECTED;
    }

    const savedRequest = await leaveRequest.save();

    // REQ-019 & REQ-030: Notify employee about the override decision
    const employee = await this.employeeService.findById(leaveRequest.employeeId.toString());
    if (employee && leaveType) {
      if (action === 'approve') {
        // Finalized via override - notify all stakeholders
        const managerStep = leaveRequest.approvalFlow.find((step) => step.role === 'direct_manager');
        await this.notificationService.notifyRequestFinalized(
          {
            employeeId: leaveRequest.employeeId.toString(),
            managerId: managerStep?.decidedBy?.toString(),
          },
          {
            employeeName: `${employee.firstName} ${employee.lastName}`,
            leaveType: leaveType.name,
            startDate: leaveRequest.dates.from.toISOString().split('T')[0],
            endDate: leaveRequest.dates.to.toISOString().split('T')[0],
            durationDays: leaveRequest.durationDays,
          },
        );
      } else {
        // Rejected via override
        await this.notificationService.notifyLeaveRequestRejected(
          leaveRequest.employeeId.toString(),
          {
            leaveType: leaveType.name,
            startDate: leaveRequest.dates.from.toISOString().split('T')[0],
            endDate: leaveRequest.dates.to.toISOString().split('T')[0],
            reason: options?.comments,
          },
        );
      }
    }

    return savedRequest;
  }

  // ==================== BULK OPERATIONS (REQ-027) ====================

  /**
   * REQ-027: Bulk finalize (approve) multiple leave requests
   * 
   * Processes multiple requests at once, returning results for each.
   * Continues processing even if individual requests fail.
   */
  async bulkFinalizeRequests(
    requestIds: string[],
    hrManagerId: string,
    comments?: string,
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: { requestId: string; success: boolean; message?: string; error?: string }[];
  }> {
    const results: { requestId: string; success: boolean; message?: string; error?: string }[] = [];
    let successful = 0;
    let failed = 0;

    for (const requestId of requestIds) {
      try {
        await this.hrFinalizeRequest(requestId, hrManagerId, comments);
        results.push({
          requestId,
          success: true,
          message: 'Leave request finalized successfully',
        });
        successful++;
      } catch (error) {
        results.push({
          requestId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
        failed++;
      }
    }

    return {
      total: requestIds.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * REQ-027: Bulk reject multiple leave requests
   * 
   * Processes multiple requests at once, returning results for each.
   * Continues processing even if individual requests fail.
   */
  async bulkRejectRequests(
    requestIds: string[],
    hrManagerId: string,
    comments?: string,
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: { requestId: string; success: boolean; message?: string; error?: string }[];
  }> {
    const results: { requestId: string; success: boolean; message?: string; error?: string }[] = [];
    let successful = 0;
    let failed = 0;

    for (const requestId of requestIds) {
      try {
        await this.hrRejectRequest(requestId, hrManagerId, comments);
        results.push({
          requestId,
          success: true,
          message: 'Leave request rejected successfully',
        });
        successful++;
      } catch (error) {
        results.push({
          requestId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
        failed++;
      }
    }

    return {
      total: requestIds.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * REQ-027: Bulk override multiple leave requests
   * 
   * Processes multiple requests at once with the same action (approve/reject).
   * Continues processing even if individual requests fail.
   */
  async bulkOverrideRequests(
    requestIds: string[],
    hrManagerId: string,
    action: 'approve' | 'reject',
    options?: {
      comments?: string;
      allowNegativeBalance?: boolean;
    },
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: { requestId: string; success: boolean; message?: string; error?: string }[];
  }> {
    const results: { requestId: string; success: boolean; message?: string; error?: string }[] = [];
    let successful = 0;
    let failed = 0;

    for (const requestId of requestIds) {
      try {
        await this.hrOverrideDecision(requestId, hrManagerId, action, options);
        results.push({
          requestId,
          success: true,
          message: `Leave request ${action === 'approve' ? 'approved' : 'rejected'} via override`,
        });
        successful++;
      } catch (error) {
        results.push({
          requestId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
        failed++;
      }
    }

    return {
      total: requestIds.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Bulk confirm rejection of manager-rejected requests
   * 
   * Processes multiple manager-rejected requests at once.
   * Finalizes the rejection status for each request.
   */
  async bulkConfirmRejectRequests(
    requestIds: string[],
    hrManagerId: string,
    comments?: string,
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: { requestId: string; success: boolean; message?: string; error?: string }[];
  }> {
    const results: { requestId: string; success: boolean; message?: string; error?: string }[] = [];
    let successful = 0;
    let failed = 0;

    for (const requestId of requestIds) {
      try {
        await this.hrRejectRequest(requestId, hrManagerId, comments);
        results.push({
          requestId,
          success: true,
          message: 'Rejection confirmed successfully',
        });
        successful++;
      } catch (error) {
        results.push({
          requestId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
        failed++;
      }
    }

    return {
      total: requestIds.length,
      successful,
      failed,
      results,
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Check for overlapping approved/pending leaves
   */
  private async checkOverlappingLeaves(
    employeeId: string,
    fromDate: Date,
    toDate: Date,
    excludeRequestId?: string,
  ): Promise<LeaveRequestDocument[]> {
    const query: any = {
      employeeId: new Types.ObjectId(employeeId),
      status: {
        $in: [LeaveStatus.APPROVED, LeaveStatus.PENDING],
      },
      $or: [
        // New request starts within existing request
        {
          'dates.from': { $lte: fromDate },
          'dates.to': { $gte: fromDate },
        },
        // New request ends within existing request
        {
          'dates.from': { $lte: toDate },
          'dates.to': { $gte: toDate },
        },
        // New request encompasses existing request
        {
          'dates.from': { $gte: fromDate },
          'dates.to': { $lte: toDate },
        },
      ],
    };

    // Exclude current request when modifying
    if (excludeRequestId) {
      query._id = { $ne: new Types.ObjectId(excludeRequestId) };
    }

    return this.leaveRequestModel.find(query).exec();
  }

  /**
   * Build approval flow based on employee's reporting structure
   * 
   * REQ-020: Manager needs to review leave requests assigned to them
   * 
   * Flow:
   * 1. Employee has supervisorPositionId → the position they report to
   * 2. Manager has primaryPositionId → their own position
   * 3. Find employee where primaryPositionId == supervisorPositionId → that's the manager
   * 4. HR step uses pool system - any HR Manager/Admin can process (decidedBy set when they act)
   */
  private async buildApprovalFlow(employeeId: string, policy: any): Promise<{
    role: string;
    status: string;
    decidedBy?: Types.ObjectId;
    decidedAt?: Date;
  }[]> {
    const approvalFlow: {
      role: string;
      status: string;
      decidedBy?: Types.ObjectId;
      decidedAt?: Date;
    }[] = [];

    // Get approval workflow configuration from policy
    const approvalWorkflow = policy?.eligibility?.approvalWorkflow || {};
    const requiresSupervisorApproval = approvalWorkflow.requiresSupervisorApproval !== false; // default true
    const requiresHRApproval = approvalWorkflow.requiresHRApproval !== false; // default true

    // Get employee to find their supervisor position
    const employee = await this.employeeService.findById(employeeId);
    console.log('Employee:', employeeId, 'supervisorPositionId:', employee?.supervisorPositionId);

    // 1. Find Direct Manager (if supervisor approval is required)
    if (requiresSupervisorApproval) {
      let directManagerId: Types.ObjectId | undefined;

      if (employee?.supervisorPositionId) {
        // Find the employee whose primaryPositionId matches this supervisorPositionId
        const positionIdStr = employee.supervisorPositionId.toString();
        console.log('Looking for manager with primaryPositionId:', positionIdStr);
        
        const manager = await this.employeeService.findByPrimaryPositionId(positionIdStr);
        console.log('Found manager:', manager?._id, manager?.firstName, manager?.lastName);

        if (manager?._id) {
          directManagerId = manager._id as Types.ObjectId;
        }
      }

      approvalFlow.push({
        role: 'direct_manager',
        status: 'pending',
        decidedBy: directManagerId,
      });
    }

    // 2. HR Manager - not pre-assigned, any HR can pick it up from the pool (if HR approval is required)
    if (requiresHRApproval) {
      approvalFlow.push({
        role: 'hr_manager',
        status: 'pending',
        decidedBy: undefined, // Will be set when HR actually processes the request
      });
    }

    return approvalFlow;
  }


  /**
   * Check for irregular leave patterns (e.g., Friday-Monday pattern)
   */
  private checkIrregularPattern(fromDate: Date, toDate: Date): boolean {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Check Friday-Monday pattern (taking Friday and Monday off to get 4-day weekend)
    const fromDay = from.getDay();
    const toDay = to.getDay();

    // Friday is 5, Monday is 1
    if (fromDay === 5 && toDay === 1) {
      return true;
    }

    // Check Monday-Friday pattern (full week)
    if (fromDay === 1 && toDay === 5) {
      // This is normal, not irregular
      return false;
    }

    // Check if leave is adjacent to public holidays (would need calendar integration)
    // TODO: Integrate with Calendar service to check holidays

    return false;
  }

  /**
   * Calculate business days between two dates (excluding weekends)
   */
  calculateBusinessDays(fromDate: Date, toDate: Date): number {
    let count = 0;
    const current = new Date(fromDate);

    while (current <= toDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Calculate business days between two dates, excluding weekends AND holidays
   * This is used to determine how many days to deduct from leave balance
   * Holidays within the leave period are not deducted from the employee's balance
   */
  private calculateBusinessDaysExcludingHolidays(
    fromDate: Date,
    toDate: Date,
    holidays: Array<{ date: Date; reason: string }>,
  ): number {
    let count = 0;
    const current = new Date(fromDate);
    
    // Create a set of holiday dates for quick lookup (normalize to date string)
    const holidayDates = new Set(
      holidays.map(h => {
        const d = new Date(h.date);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split('T')[0];
      })
    );

    while (current <= toDate) {
      const dayOfWeek = current.getDay();
      const currentDateStr = current.toISOString().split('T')[0];
      
      // Count only if it's a weekday AND not a holiday
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(currentDateStr)) {
        count++;
      }
      
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  // ==================== REQ-039: MANUALLY FLAG IRREGULAR PATTERNS ====================

  /**
   * REQ-039: Manager flags an irregular pattern on an employee's leave request
   * 
   * As a direct manager, I want to be able to flag irregular leaving patterns 
   * in employees' leave history.
   */
  async flagIrregularPattern(
    requestId: string,
    managerId: string,
    flagged: boolean,
    reason?: string,
  ): Promise<LeaveRequestDocument> {
    const leaveRequest = await this.leaveRequestModel.findById(requestId);
    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${requestId} not found`);
    }

    // Verify manager has authority (is direct manager of the employee)
    const employee = await this.employeeService.findById(leaveRequest.employeeId.toString());
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check if manager is the supervisor
    if (employee.supervisorPositionId) {
      const manager = await this.employeeService.findById(managerId);
      if (!manager?.primaryPositionId || 
          manager.primaryPositionId.toString() !== employee.supervisorPositionId.toString()) {
        throw new ForbiddenException('You are not authorized to flag this employee\'s leave requests');
      }
    }

    leaveRequest.irregularPatternFlag = flagged;
    const savedRequest = await leaveRequest.save();

    // Notify HR if flagged
    if (flagged) {
      const leaveType = await this.leaveTypeModel.findById(leaveRequest.leaveTypeId);
      await this.notificationService.sendNotification({
        recipientId: 'hr_manager', // Will be resolved by notification service
        type: 'irregular_pattern_flagged',
        title: 'Irregular Leave Pattern Flagged',
        message: `Manager flagged irregular pattern for ${employee.firstName} ${employee.lastName}. Leave type: ${leaveType?.name || 'Unknown'}. ${reason ? `Reason: ${reason}` : ''}`,
        data: {
          leaveRequestId: requestId,
          employeeId: leaveRequest.employeeId.toString(),
          reason,
        },
      });
    }

    return savedRequest;
  }

  /**
   * Get all leave requests flagged as irregular for a team or employee
   */
  async getFlaggedIrregularRequests(
    managerId: string,
    filters?: {
      employeeId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<LeaveRequestDocument[]> {
    // Get manager's team members
    const manager = await this.employeeService.findById(managerId);
    if (!manager?.primaryPositionId) {
      return [];
    }

    const employeeModel = this.employeeService['employeeModel'];
    const teamQuery: any = {
      isActive: true,
      supervisorPositionId: manager.primaryPositionId,
    };

    const teamMembers = await employeeModel.find(teamQuery).select('_id').exec();
    const teamMemberIds = teamMembers.map((m: any) => m._id);

    const query: any = {
      irregularPatternFlag: true,
      employeeId: { $in: teamMemberIds },
    };

    if (filters?.employeeId) {
      query.employeeId = new Types.ObjectId(filters.employeeId);
    }

    if (filters?.startDate || filters?.endDate) {
      query['dates.from'] = {};
      if (filters.startDate) query['dates.from'].$gte = filters.startDate;
      if (filters.endDate) query['dates.from'].$lte = filters.endDate;
    }

    return this.leaveRequestModel
      .find(query)
      .populate('employeeId', 'firstName lastName employeeNumber')
      .populate('leaveTypeId', 'code name')
      .sort({ 'dates.from': -1 })
      .exec();
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// leave-role-management.service.ts
// ═══════════════════════════════════════════════════════════════════════════


/**
 * User Story 13: HR Admin Manage Leave Roles & Permissions
 * 
 * As an HR Admin, I want to manage user roles and permissions related to leave 
 * (e.g., who can request, approve, or view leave) so that access is controlled and secure.
 * 
 * Uses existing organizational structure and security roles.
 */

// Leave-specific permissions
export enum LeavePermission {
  // Request permissions
  REQUEST_OWN_LEAVE = 'request_own_leave',
  REQUEST_ON_BEHALF = 'request_on_behalf',
  
  // Approval permissions
  APPROVE_TEAM_LEAVE = 'approve_team_leave',
  APPROVE_DEPARTMENT_LEAVE = 'approve_department_leave',
  APPROVE_ALL_LEAVE = 'approve_all_leave',
  REJECT_LEAVE = 'reject_leave',
  
  // View permissions
  VIEW_OWN_LEAVE = 'view_own_leave',
  VIEW_TEAM_LEAVE = 'view_team_leave',
  VIEW_DEPARTMENT_LEAVE = 'view_department_leave',
  VIEW_ALL_LEAVE = 'view_all_leave',
  VIEW_LEAVE_REPORTS = 'view_leave_reports',
  
  // Management permissions
  MANAGE_LEAVE_TYPES = 'manage_leave_types',
  MANAGE_LEAVE_POLICIES = 'manage_leave_policies',
  MANAGE_ENTITLEMENTS = 'manage_entitlements',
  MANAGE_CALENDAR = 'manage_calendar',
  ADJUST_BALANCES = 'adjust_balances',
  
  // Admin permissions
  MANAGE_LEAVE_ROLES = 'manage_leave_roles',
  AUDIT_LEAVE_ACTIONS = 'audit_leave_actions',
}

// Role-permission mapping
export interface LeaveRolePermissions {
  role: Role;
  permissions: LeavePermission[];
  description: string;
  canDelegate: boolean;
  maxApprovalAmount?: number; // Max days this role can approve
}

// User leave role assignment
export interface UserLeaveRole {
  userId: string;
  role: Role;
  assignedBy: string;
  assignedAt: Date;
  scope?: {
    type: 'department' | 'team' | 'organization';
    entityId?: string;
  };
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;
}

// Default role-permission mappings
const DEFAULT_ROLE_PERMISSIONS: LeaveRolePermissions[] = [
  {
    role: Role.DEPARTMENT_EMPLOYEE,
    permissions: [
      LeavePermission.REQUEST_OWN_LEAVE,
      LeavePermission.VIEW_OWN_LEAVE,
    ],
    description: 'Basic employee - can request and view own leave',
    canDelegate: false,
  },
  {
    role: Role.DEPARTMENT_HEAD,
    permissions: [
      LeavePermission.REQUEST_OWN_LEAVE,
      LeavePermission.VIEW_OWN_LEAVE,
      LeavePermission.VIEW_TEAM_LEAVE,
      LeavePermission.VIEW_DEPARTMENT_LEAVE,
      LeavePermission.APPROVE_TEAM_LEAVE,
      LeavePermission.APPROVE_DEPARTMENT_LEAVE,
      LeavePermission.REJECT_LEAVE,
    ],
    description: 'Department head - can approve department leave requests',
    canDelegate: true,
    maxApprovalAmount: 30,
  },
  {
    role: Role.HR_EMPLOYEE,
    permissions: [
      LeavePermission.REQUEST_OWN_LEAVE,
      LeavePermission.VIEW_OWN_LEAVE,
      LeavePermission.VIEW_ALL_LEAVE,
      LeavePermission.VIEW_LEAVE_REPORTS,
    ],
    description: 'HR Employee - can view all leave for reporting',
    canDelegate: false,
  },
  {
    role: Role.HR_MANAGER,
    permissions: [
      LeavePermission.REQUEST_OWN_LEAVE,
      LeavePermission.REQUEST_ON_BEHALF,
      LeavePermission.VIEW_OWN_LEAVE,
      LeavePermission.VIEW_ALL_LEAVE,
      LeavePermission.VIEW_LEAVE_REPORTS,
      LeavePermission.APPROVE_ALL_LEAVE,
      LeavePermission.REJECT_LEAVE,
      LeavePermission.MANAGE_ENTITLEMENTS,
    ],
    description: 'HR Manager - can approve all leave and manage entitlements',
    canDelegate: true,
    maxApprovalAmount: 60,
  },
  {
    role: Role.HR_ADMIN,
    permissions: Object.values(LeavePermission), // All permissions
    description: 'HR Admin - full access to all leave management functions',
    canDelegate: true,
  },
  {
    role: Role.SYSTEM_ADMIN,
    permissions: [
      LeavePermission.VIEW_ALL_LEAVE,
      LeavePermission.VIEW_LEAVE_REPORTS,
      LeavePermission.MANAGE_LEAVE_ROLES,
      LeavePermission.AUDIT_LEAVE_ACTIONS,
    ],
    description: 'System Admin - can manage roles and audit leave actions',
    canDelegate: true,
  },
];

@Injectable()
export class LeaveRoleManagementService {
  // In-memory storage for role configurations (in production, use database)
  private rolePermissions: Map<Role, LeaveRolePermissions> = new Map();
  private userRoleAssignments: Map<string, UserLeaveRole[]> = new Map();

  constructor() {
    // Initialize with default role permissions
    this.initializeDefaultRoles();
  }

  private initializeDefaultRoles(): void {
    DEFAULT_ROLE_PERMISSIONS.forEach((rp) => {
      this.rolePermissions.set(rp.role, rp);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // ROLE PERMISSION MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  getAllRolePermissions(): LeaveRolePermissions[] {
    return Array.from(this.rolePermissions.values());
  }

  getRolePermissions(role: Role): LeaveRolePermissions | null {
    return this.rolePermissions.get(role) || null;
  }

  updateRolePermissions(
    role: Role,
    permissions: LeavePermission[],
    options?: {
      description?: string;
      canDelegate?: boolean;
      maxApprovalAmount?: number;
    },
  ): LeaveRolePermissions {
    const existing = this.rolePermissions.get(role);
    
    const updated: LeaveRolePermissions = {
      role,
      permissions,
      description: options?.description || existing?.description || `Custom permissions for ${role}`,
      canDelegate: options?.canDelegate ?? existing?.canDelegate ?? false,
      maxApprovalAmount: options?.maxApprovalAmount ?? existing?.maxApprovalAmount,
    };

    this.rolePermissions.set(role, updated);
    return updated;
  }

  addPermissionToRole(role: Role, permission: LeavePermission): LeaveRolePermissions {
    const existing = this.rolePermissions.get(role);
    if (!existing) {
      throw new NotFoundException(`Role ${role} not found`);
    }

    if (!existing.permissions.includes(permission)) {
      existing.permissions.push(permission);
    }

    this.rolePermissions.set(role, existing);
    return existing;
  }

  removePermissionFromRole(role: Role, permission: LeavePermission): LeaveRolePermissions {
    const existing = this.rolePermissions.get(role);
    if (!existing) {
      throw new NotFoundException(`Role ${role} not found`);
    }

    existing.permissions = existing.permissions.filter((p) => p !== permission);
    this.rolePermissions.set(role, existing);
    return existing;
  }

  // ─────────────────────────────────────────────────────────────
  // USER ROLE ASSIGNMENT
  // ─────────────────────────────────────────────────────────────

  assignLeaveRoleToUser(
    userId: string,
    role: Role,
    assignedBy: string,
    options?: {
      scope?: {
        type: 'department' | 'team' | 'organization';
        entityId?: string;
      };
      validFrom?: Date;
      validUntil?: Date;
    },
  ): UserLeaveRole {
    const assignment: UserLeaveRole = {
      userId,
      role,
      assignedBy,
      assignedAt: new Date(),
      scope: options?.scope,
      validFrom: options?.validFrom,
      validUntil: options?.validUntil,
      isActive: true,
    };

    const userRoles = this.userRoleAssignments.get(userId) || [];
    
    // Check if role already assigned
    const existingIndex = userRoles.findIndex(
      (r) => r.role === role && r.scope?.entityId === options?.scope?.entityId,
    );

    if (existingIndex >= 0) {
      userRoles[existingIndex] = assignment;
    } else {
      userRoles.push(assignment);
    }

    this.userRoleAssignments.set(userId, userRoles);
    return assignment;
  }

  revokeLeaveRoleFromUser(
    userId: string,
    role: Role,
    scopeEntityId?: string,
  ): { revoked: boolean; message: string } {
    const userRoles = this.userRoleAssignments.get(userId);
    if (!userRoles) {
      throw new NotFoundException(`No roles found for user ${userId}`);
    }

    const roleIndex = userRoles.findIndex(
      (r) => r.role === role && r.scope?.entityId === scopeEntityId,
    );

    if (roleIndex < 0) {
      throw new NotFoundException(`Role ${role} not assigned to user ${userId}`);
    }

    userRoles[roleIndex].isActive = false;
    this.userRoleAssignments.set(userId, userRoles);

    return { revoked: true, message: `Role ${role} revoked from user ${userId}` };
  }

  getUserLeaveRoles(userId: string): UserLeaveRole[] {
    return (this.userRoleAssignments.get(userId) || []).filter((r) => r.isActive);
  }

  // ─────────────────────────────────────────────────────────────
  // PERMISSION CHECKING
  // ─────────────────────────────────────────────────────────────

  checkUserPermission(userId: string, permission: LeavePermission): {
    hasPermission: boolean;
    grantedBy: Role[];
  } {
    const userRoles = this.getUserLeaveRoles(userId);
    const grantedBy: Role[] = [];

    for (const userRole of userRoles) {
      // Check validity period
      const now = new Date();
      if (userRole.validFrom && now < userRole.validFrom) continue;
      if (userRole.validUntil && now > userRole.validUntil) continue;

      const rolePerms = this.rolePermissions.get(userRole.role);
      if (rolePerms?.permissions.includes(permission)) {
        grantedBy.push(userRole.role);
      }
    }

    return {
      hasPermission: grantedBy.length > 0,
      grantedBy,
    };
  }

  getUserEffectivePermissions(userId: string): {
    userId: string;
    permissions: LeavePermission[];
    roles: Role[];
  } {
    const userRoles = this.getUserLeaveRoles(userId);
    const permissionSet = new Set<LeavePermission>();
    const roles: Role[] = [];

    for (const userRole of userRoles) {
      // Check validity period
      const now = new Date();
      if (userRole.validFrom && now < userRole.validFrom) continue;
      if (userRole.validUntil && now > userRole.validUntil) continue;

      roles.push(userRole.role);
      const rolePerms = this.rolePermissions.get(userRole.role);
      rolePerms?.permissions.forEach((p) => permissionSet.add(p));
    }

    return {
      userId,
      permissions: Array.from(permissionSet),
      roles,
    };
  }

  getUserEffectivePermissionsWithRole(userId: string, baseRole?: string): {
    userId: string;
    permissions: LeavePermission[];
    roles: Role[];
  } {
    const permissionSet = new Set<LeavePermission>();
    const roles: Role[] = [];

    // Add base role permissions from user's role property
    if (baseRole) {
      const normalizedRole = this.normalizeRoleName(baseRole);
      if (normalizedRole) {
        roles.push(normalizedRole);
        const baseRolePerms = this.rolePermissions.get(normalizedRole);
        baseRolePerms?.permissions.forEach((p) => permissionSet.add(p));
      }
    }

    // Add assigned role permissions
    const userRoles = this.getUserLeaveRoles(userId);
    for (const userRole of userRoles) {
      const now = new Date();
      if (userRole.validFrom && now < userRole.validFrom) continue;
      if (userRole.validUntil && now > userRole.validUntil) continue;

      if (!roles.includes(userRole.role)) {
        roles.push(userRole.role);
      }
      const rolePerms = this.rolePermissions.get(userRole.role);
      rolePerms?.permissions.forEach((p) => permissionSet.add(p));
    }

    return {
      userId,
      permissions: Array.from(permissionSet),
      roles,
    };
  }

  // Helper to normalize role names from different formats
  private normalizeRoleName(roleName: string): Role | null {
    const roleMap: { [key: string]: Role } = {
      'department employee': Role.DEPARTMENT_EMPLOYEE,
      'department head': Role.DEPARTMENT_HEAD,
      'hr employee': Role.HR_EMPLOYEE,
      'hr manager': Role.HR_MANAGER,
      'hr admin': Role.HR_ADMIN,
      'system admin': Role.SYSTEM_ADMIN,
    };
    return roleMap[roleName.toLowerCase()] || null;
  }

  // ─────────────────────────────────────────────────────────────
  // APPROVAL CHAIN MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  getApprovalChain(departmentId?: string): {
    levels: Array<{
      level: number;
      roles: Role[];
      maxApprovalDays?: number;
    }>;
  } {
    // Default approval chain
    return {
      levels: [
        {
          level: 1,
          roles: [Role.DEPARTMENT_HEAD],
          maxApprovalDays: 5,
        },
        {
          level: 2,
          roles: [Role.HR_MANAGER],
          maxApprovalDays: 30,
        },
        {
          level: 3,
          roles: [Role.HR_ADMIN],
          maxApprovalDays: undefined, // No limit
        },
      ],
    };
  }

  getApproversForRequest(
    requestedDays: number,
    departmentId?: string,
  ): {
    eligibleRoles: Role[];
    minimumLevel: number;
  } {
    const chain = this.getApprovalChain(departmentId);
    const eligibleRoles: Role[] = [];
    let minimumLevel = 1;

    for (const level of chain.levels) {
      if (!level.maxApprovalDays || requestedDays <= level.maxApprovalDays) {
        eligibleRoles.push(...level.roles);
        break;
      }
      minimumLevel = level.level + 1;
    }

    // If no level found, use highest level
    if (eligibleRoles.length === 0) {
      const highestLevel = chain.levels[chain.levels.length - 1];
      eligibleRoles.push(...highestLevel.roles);
      minimumLevel = highestLevel.level;
    }

    return { eligibleRoles, minimumLevel };
  }

  // ─────────────────────────────────────────────────────────────
  // DELEGATION
  // ─────────────────────────────────────────────────────────────

  delegateApprovalAuthority(
    fromUserId: string,
    toUserId: string,
    options: {
      validFrom: Date;
      validUntil: Date;
      scope?: {
        type: 'department' | 'team' | 'organization';
        entityId?: string;
      };
    },
  ): {
    delegated: boolean;
    delegation: UserLeaveRole;
  } {
    const fromUserRoles = this.getUserLeaveRoles(fromUserId);
    
    // Find roles that can delegate
    const delegatableRoles = fromUserRoles.filter((ur) => {
      const rolePerms = this.rolePermissions.get(ur.role);
      return rolePerms?.canDelegate;
    });

    if (delegatableRoles.length === 0) {
      throw new BadRequestException(`User ${fromUserId} has no delegatable roles`);
    }

    // Delegate the first delegatable role
    const roleToDelegate = delegatableRoles[0].role;
    const delegation = this.assignLeaveRoleToUser(toUserId, roleToDelegate, fromUserId, {
      scope: options.scope,
      validFrom: options.validFrom,
      validUntil: options.validUntil,
    });

    return {
      delegated: true,
      delegation,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // AVAILABLE ROLES & PERMISSIONS
  // ─────────────────────────────────────────────────────────────

  getAvailableRoles(): { roles: Role[]; descriptions: Record<string, string> } {
    const descriptions: Record<string, string> = {};
    this.rolePermissions.forEach((rp, role) => {
      descriptions[role] = rp.description;
    });

    return {
      roles: Array.from(this.rolePermissions.keys()),
      descriptions,
    };
  }

  getAvailablePermissions(): {
    permissions: LeavePermission[];
    categories: Record<string, LeavePermission[]>;
  } {
    return {
      permissions: Object.values(LeavePermission),
      categories: {
        request: [
          LeavePermission.REQUEST_OWN_LEAVE,
          LeavePermission.REQUEST_ON_BEHALF,
        ],
        approval: [
          LeavePermission.APPROVE_TEAM_LEAVE,
          LeavePermission.APPROVE_DEPARTMENT_LEAVE,
          LeavePermission.APPROVE_ALL_LEAVE,
          LeavePermission.REJECT_LEAVE,
        ],
        view: [
          LeavePermission.VIEW_OWN_LEAVE,
          LeavePermission.VIEW_TEAM_LEAVE,
          LeavePermission.VIEW_DEPARTMENT_LEAVE,
          LeavePermission.VIEW_ALL_LEAVE,
          LeavePermission.VIEW_LEAVE_REPORTS,
        ],
        management: [
          LeavePermission.MANAGE_LEAVE_TYPES,
          LeavePermission.MANAGE_LEAVE_POLICIES,
          LeavePermission.MANAGE_ENTITLEMENTS,
          LeavePermission.MANAGE_CALENDAR,
          LeavePermission.ADJUST_BALANCES,
        ],
        admin: [
          LeavePermission.MANAGE_LEAVE_ROLES,
          LeavePermission.AUDIT_LEAVE_ACTIONS,
        ],
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // RESET TO DEFAULTS
  // ─────────────────────────────────────────────────────────────

  resetRolePermissionsToDefault(role?: Role): { reset: boolean; roles: Role[] } {
    const rolesReset: Role[] = [];

    if (role) {
      const defaultRole = DEFAULT_ROLE_PERMISSIONS.find((rp) => rp.role === role);
      if (defaultRole) {
        this.rolePermissions.set(role, { ...defaultRole });
        rolesReset.push(role);
      }
    } else {
      DEFAULT_ROLE_PERMISSIONS.forEach((rp) => {
        this.rolePermissions.set(rp.role, { ...rp });
        rolesReset.push(rp.role);
      });
    }

    return { reset: true, roles: rolesReset };
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// leave-type.service.ts
// ═══════════════════════════════════════════════════════════════════════════


/**
 * Leave Type Service
 * 
 * User Story: As an HR Admin, I want to create and manage different leave types
 * (e.g., Annual leave, Sick leave, Accidental leave, Compensation Leave, 
 * Mission Leave, Marriage Leave, etc.) so that employees can request 
 * appropriate leave categories.
 */
@Injectable()
export class LeaveTypeService {
  constructor(
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(LeaveCategory.name) private leaveCategoryModel: Model<LeaveCategoryDocument>,
    @InjectModel(LeavePolicy.name) private leavePolicyModel: Model<LeavePolicyDocument>,
  ) {}

  // ==================== LEAVE CATEGORY MANAGEMENT ====================

  /**
   * Create a new leave category
   */
  async createCategory(createCategoryDto: CreateLeaveCategoryDto): Promise<LeaveCategoryDocument> {
    // Check if category with same name already exists
    const existing = await this.leaveCategoryModel.findOne({
      name: { $regex: new RegExp(`^${createCategoryDto.name}$`, 'i') },
    });
    if (existing) {
      throw new BadRequestException(
        `Leave category with name "${createCategoryDto.name}" already exists`,
      );
    }

    const category = new this.leaveCategoryModel(createCategoryDto);
    return category.save();
  }

  /**
   * Get all leave categories
   */
  async getAllCategories(): Promise<LeaveCategoryDocument[]> {
    return this.leaveCategoryModel.find().sort({ name: 1 }).exec();
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId: string): Promise<LeaveCategoryDocument> {
    const category = await this.leaveCategoryModel.findById(categoryId).exec();
    if (!category) {
      throw new NotFoundException(`Leave category with ID ${categoryId} not found`);
    }
    return category;
  }

  /**
   * Update category
   */
  async updateCategory(
    categoryId: string,
    updateData: Partial<CreateLeaveCategoryDto>,
  ): Promise<LeaveCategoryDocument> {
    const category = await this.leaveCategoryModel.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Leave category with ID ${categoryId} not found`);
    }

    // Check for duplicate name if updating name
    if (updateData.name && updateData.name !== category.name) {
      const existing = await this.leaveCategoryModel.findOne({
        name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
        _id: { $ne: categoryId },
      });
      if (existing) {
        throw new BadRequestException(
          `Leave category with name "${updateData.name}" already exists`,
        );
      }
    }

    Object.assign(category, updateData);
    return category.save();
  }

  /**
   * Delete category
   */
  async deleteCategory(categoryId: string): Promise<{ message: string }> {
    // Check if any leave types use this category
    const typesUsingCategory = await this.leaveTypeModel.countDocuments({
      categoryId: new Types.ObjectId(categoryId),
    });
    if (typesUsingCategory > 0) {
      throw new BadRequestException(
        `Cannot delete category. ${typesUsingCategory} leave type(s) are using this category.`,
      );
    }

    const result = await this.leaveCategoryModel.findByIdAndDelete(categoryId);
    if (!result) {
      throw new NotFoundException(`Leave category with ID ${categoryId} not found`);
    }
    return { message: 'Leave category deleted successfully' };
  }

  // ==================== LEAVE TYPE MANAGEMENT ====================

  /**
   * Create a new leave type
   * Supports: Annual leave, Sick leave, Accidental leave, Compensation Leave,
   * Mission Leave, Marriage Leave, etc.
   */
  async createLeaveType(createLeaveTypeDto: CreateLeaveTypeDto): Promise<LeaveTypeDocument> {
    // Validate category exists
    const category = await this.leaveCategoryModel.findById(createLeaveTypeDto.categoryId);
    if (!category) {
      throw new NotFoundException(
        `Leave category with ID ${createLeaveTypeDto.categoryId} not found`,
      );
    }

    // Check if leave type with same code already exists
    const existingByCode = await this.leaveTypeModel.findOne({
      code: { $regex: new RegExp(`^${createLeaveTypeDto.code}$`, 'i') },
    });
    if (existingByCode) {
      throw new BadRequestException(
        `Leave type with code "${createLeaveTypeDto.code}" already exists`,
      );
    }

    // Check if leave type with same name already exists
    const existingByName = await this.leaveTypeModel.findOne({
      name: { $regex: new RegExp(`^${createLeaveTypeDto.name}$`, 'i') },
    });
    if (existingByName) {
      throw new BadRequestException(
        `Leave type with name "${createLeaveTypeDto.name}" already exists`,
      );
    }

    const leaveType = new this.leaveTypeModel({
      ...createLeaveTypeDto,
      categoryId: new Types.ObjectId(createLeaveTypeDto.categoryId),
    });
    return leaveType.save();
  }

  /**
   * Get all leave types
   */
  async getAllLeaveTypes(): Promise<LeaveTypeDocument[]> {
    return this.leaveTypeModel
      .find()
      .populate('categoryId', 'name description')
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Get leave types by category
   */
  async getLeaveTypesByCategory(categoryId: string): Promise<LeaveTypeDocument[]> {
    // Validate category exists
    const category = await this.leaveCategoryModel.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Leave category with ID ${categoryId} not found`);
    }

    return this.leaveTypeModel
      .find({ categoryId: new Types.ObjectId(categoryId) })
      .populate('categoryId', 'name description')
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Get leave type by ID
   */
  async getLeaveTypeById(typeId: string): Promise<LeaveTypeDocument> {
    const leaveType = await this.leaveTypeModel
      .findById(typeId)
      .populate('categoryId', 'name description')
      .exec();
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${typeId} not found`);
    }
    return leaveType;
  }

  /**
   * Get leave type by code
   */
  async getLeaveTypeByCode(code: string): Promise<LeaveTypeDocument> {
    const leaveType = await this.leaveTypeModel
      .findOne({ code: { $regex: new RegExp(`^${code}$`, 'i') } })
      .populate('categoryId', 'name description')
      .exec();
    if (!leaveType) {
      throw new NotFoundException(`Leave type with code "${code}" not found`);
    }
    return leaveType;
  }

  /**
   * Update leave type
   */
  async updateLeaveType(
    typeId: string,
    updateLeaveTypeDto: UpdateLeaveTypeDto,
  ): Promise<LeaveTypeDocument> {
    const leaveType = await this.leaveTypeModel.findById(typeId);
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${typeId} not found`);
    }

    // Validate category if updating
    if (updateLeaveTypeDto.categoryId) {
      const category = await this.leaveCategoryModel.findById(updateLeaveTypeDto.categoryId);
      if (!category) {
        throw new NotFoundException(
          `Leave category with ID ${updateLeaveTypeDto.categoryId} not found`,
        );
      }
    }

    // Check for duplicate code if updating
    if (updateLeaveTypeDto.code && updateLeaveTypeDto.code !== leaveType.code) {
      const existingByCode = await this.leaveTypeModel.findOne({
        code: { $regex: new RegExp(`^${updateLeaveTypeDto.code}$`, 'i') },
        _id: { $ne: typeId },
      });
      if (existingByCode) {
        throw new BadRequestException(
          `Leave type with code "${updateLeaveTypeDto.code}" already exists`,
        );
      }
    }

    // Check for duplicate name if updating
    if (updateLeaveTypeDto.name && updateLeaveTypeDto.name !== leaveType.name) {
      const existingByName = await this.leaveTypeModel.findOne({
        name: { $regex: new RegExp(`^${updateLeaveTypeDto.name}$`, 'i') },
        _id: { $ne: typeId },
      });
      if (existingByName) {
        throw new BadRequestException(
          `Leave type with name "${updateLeaveTypeDto.name}" already exists`,
        );
      }
    }

    Object.assign(leaveType, updateLeaveTypeDto);
    if (updateLeaveTypeDto.categoryId) {
      leaveType.categoryId = new Types.ObjectId(updateLeaveTypeDto.categoryId);
    }
    return leaveType.save();
  }

  /**
   * Delete leave type
   */
  async deleteLeaveType(typeId: string): Promise<{ message: string }> {
    // Check if any policies use this leave type
    const policiesUsingType = await this.leavePolicyModel.countDocuments({
      leaveTypeId: new Types.ObjectId(typeId),
    });
    if (policiesUsingType > 0) {
      throw new BadRequestException(
        `Cannot delete leave type. ${policiesUsingType} policy(ies) are using this leave type.`,
      );
    }

    const result = await this.leaveTypeModel.findByIdAndDelete(typeId);
    if (!result) {
      throw new NotFoundException(`Leave type with ID ${typeId} not found`);
    }
    return { message: 'Leave type deleted successfully' };
  }

  /**
   * Get leave types summary (for dashboard/init)
   */
  async getLeaveTypesSummary(): Promise<{
    totalCategories: number;
    totalTypes: number;
    categories: { id: string; name: string; typesCount: number }[];
  }> {
    const categories = await this.leaveCategoryModel.find().lean();
    const categorySummary = await Promise.all(
      categories.map(async (cat) => ({
        id: cat._id.toString(),
        name: cat.name,
        typesCount: await this.leaveTypeModel.countDocuments({
          categoryId: cat._id,
        }),
      })),
    );

    return {
      totalCategories: categories.length,
      totalTypes: await this.leaveTypeModel.countDocuments(),
      categories: categorySummary,
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// leave-year-config.service.ts
// ═══════════════════════════════════════════════════════════════════════════


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


// ═══════════════════════════════════════════════════════════════════════════
// notification.service.ts
// ═══════════════════════════════════════════════════════════════════════════


/**
 * Notification Types for Leave Management
 * 
 * REQ-019: Employee notifications (status changes)
 * REQ-024: Manager notifications (assignment)
 * REQ-030: Finalization notifications (all stakeholders)
 */


/**
 * Notification Service for Leave Management
 * 
 * Uses the NotificationLog schema from time-management to persist notifications.
 * Service and controller are in the leaves module to avoid merge conflicts.
 * 
 * REQ-019: Employee receives notifications on approval, rejection, return, modification
 * REQ-024: Manager receives notifications when requests are assigned or overdue
 * REQ-030: All stakeholders notified when request is finalized
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(NotificationLog.name) private notificationModel: Model<NotificationLogDocument>,
  ) {}

  /**
   * Create and save a notification
   */
  async send(
    recipientId: string,
    type: LeaveNotificationType | string,
    message: string,
  ): Promise<NotificationLogDocument> {
    const notification = new this.notificationModel({
      to: new Types.ObjectId(recipientId),
      type,
      message,
    });

    const saved = await notification.save();
    this.logger.log(`[NOTIFICATION] ${type} sent to ${recipientId}: ${message}`);
    
    return saved;
  }

  /**
   * Send multiple notifications at once
   */
  async sendBatch(
    notifications: { recipientId: string; type: LeaveNotificationType | string; message: string }[],
  ): Promise<NotificationLogDocument[]> {
    const docs = notifications.map(n => ({
      to: new Types.ObjectId(n.recipientId),
      type: n.type,
      message: n.message,
    }));

    const saved = await this.notificationModel.insertMany(docs);
    this.logger.log(`[BATCH NOTIFICATION] Sent ${saved.length} notifications`);
    
    return saved;
  }

  /**
   * Get notifications for a user
   */
  async getNotificationsForUser(
    userId: string,
    options?: { limit?: number; skip?: number },
  ): Promise<NotificationLogDocument[]> {
    return this.notificationModel
      .find({ to: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50)
      .exec();
  }

  /**
   * Get notification count for a user
   */
  async getNotificationCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({ to: new Types.ObjectId(userId) });
  }

  /**
   * Generic notification sender with structured data
   * Used for custom notification types like irregular pattern flagging
   */
  async sendNotification(params: {
    recipientId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
  }): Promise<NotificationLogDocument> {
    // For special recipient types like 'hr_manager', we'd need to resolve the actual ID
    // For now, log it and skip if it's a placeholder
    if (params.recipientId === 'hr_manager') {
      this.logger.log(`[NOTIFICATION] HR Manager notification (not sent - needs resolution): ${params.message}`);
      // In a real implementation, you'd resolve the HR manager ID here
      // For now, we'll just log it
      return null as any;
    }

    const notification = new this.notificationModel({
      to: new Types.ObjectId(params.recipientId),
      type: params.type,
      message: `[${params.title}] ${params.message}`,
    });

    const saved = await notification.save();
    this.logger.log(`[NOTIFICATION] ${params.type} sent to ${params.recipientId}: ${params.title}`);
    
    return saved;
  }

  // ==================== REQ-019: EMPLOYEE STATUS NOTIFICATIONS ====================

  /**
   * REQ-019: Notify employee that their leave request was approved
   */
  async notifyLeaveRequestApproved(
    employeeId: string,
    details: { leaveType: string; startDate: string; endDate: string; durationDays: number },
  ): Promise<NotificationLogDocument> {
    const message = `Your ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} (${details.durationDays} days) has been approved.`;
    return this.send(employeeId, LeaveNotificationType.LEAVE_REQUEST_APPROVED, message);
  }

  /**
   * REQ-019: Notify employee that their leave request was rejected
   */
  async notifyLeaveRequestRejected(
    employeeId: string,
    details: { leaveType: string; startDate: string; endDate: string; reason?: string },
  ): Promise<NotificationLogDocument> {
    const message = `Your ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} has been rejected.${details.reason ? ` Reason: ${details.reason}` : ''}`;
    return this.send(employeeId, LeaveNotificationType.LEAVE_REQUEST_REJECTED, message);
  }

  /**
   * REQ-019: Notify employee that their leave request was returned for correction
   */
  async notifyLeaveRequestReturned(
    employeeId: string,
    details: { leaveType: string; startDate: string; endDate: string; reason: string },
  ): Promise<NotificationLogDocument> {
    const message = `Your ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} has been returned for correction. Reason: ${details.reason}`;
    return this.send(employeeId, LeaveNotificationType.LEAVE_REQUEST_RETURNED, message);
  }

  /**
   * REQ-019: Notify employee that their leave request was modified
   */
  async notifyLeaveRequestModified(
    employeeId: string,
    details: { leaveType: string; changes: string },
  ): Promise<NotificationLogDocument> {
    const message = `Your ${details.leaveType} leave request has been modified. Changes: ${details.changes}`;
    return this.send(employeeId, LeaveNotificationType.LEAVE_REQUEST_MODIFIED, message);
  }

  // ==================== REQ-024: MANAGER ASSIGNMENT NOTIFICATIONS ====================

  /**
   * REQ-024: Notify manager that a new leave request is assigned to them
   */
  async notifyManagerRequestAssigned(
    managerId: string,
    details: { employeeName: string; leaveType: string; startDate: string; endDate: string },
  ): Promise<NotificationLogDocument> {
    const message = `A new ${details.leaveType} leave request from ${details.employeeName} for ${details.startDate} to ${details.endDate} has been assigned to you for review.`;
    return this.send(managerId, LeaveNotificationType.LEAVE_REQUEST_ASSIGNED, message);
  }

  /**
   * REQ-024: Notify manager/escalate when request is overdue (pending > 48 hrs)
   */
  async notifyRequestOverdue(
    managerId: string,
    details: { employeeName: string; leaveType: string; startDate: string; endDate: string; hoursPending: number },
  ): Promise<NotificationLogDocument> {
    const message = `URGENT: Leave request from ${details.employeeName} (${details.leaveType} for ${details.startDate} to ${details.endDate}) has been pending for ${details.hoursPending} hours and requires immediate action.`;
    return this.send(managerId, LeaveNotificationType.LEAVE_REQUEST_OVERDUE, message);
  }

  // ==================== REQ-030: FINALIZATION NOTIFICATIONS ====================

  /**
   * REQ-030: Notify all stakeholders when a leave request is finalized
   * 
   * Sends notifications to:
   * - Employee (owner of the request)
   * - Employee's Manager
   * - Attendance Coordinator (if provided)
   */
  async notifyRequestFinalized(
    stakeholders: {
      employeeId: string;
      managerId?: string;
      attendanceCoordinatorId?: string;
    },
    details: {
      employeeName: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      durationDays: number;
    },
  ): Promise<NotificationLogDocument[]> {
    const notifications: { recipientId: string; type: LeaveNotificationType; message: string }[] = [];

    // Notify employee
    notifications.push({
      recipientId: stakeholders.employeeId,
      type: LeaveNotificationType.LEAVE_REQUEST_FINALIZED,
      message: `Your ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} (${details.durationDays} days) has been finalized and approved.`,
    });

    // Notify manager
    if (stakeholders.managerId) {
      notifications.push({
        recipientId: stakeholders.managerId,
        type: LeaveNotificationType.LEAVE_REQUEST_FINALIZED,
        message: `${details.employeeName}'s ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} (${details.durationDays} days) has been finalized.`,
      });
    }

    // Notify attendance coordinator
    if (stakeholders.attendanceCoordinatorId) {
      notifications.push({
        recipientId: stakeholders.attendanceCoordinatorId,
        type: LeaveNotificationType.LEAVE_REQUEST_FINALIZED,
        message: `${details.employeeName}'s ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} (${details.durationDays} days) has been finalized. Please update attendance records.`,
      });
    }

    return this.sendBatch(notifications);
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// payroll-sync.service.ts
// ═══════════════════════════════════════════════════════════════════════════


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


// ═══════════════════════════════════════════════════════════════════════════
// personalized-entitlement.service.ts
// ═══════════════════════════════════════════════════════════════════════════


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
      console.log(`Employee ${employee._id} (${isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
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


// ═══════════════════════════════════════════════════════════════════════════
// special-absence.service.ts
// ═══════════════════════════════════════════════════════════════════════════


export enum SpecialAbsenceCode {
  BEREAVEMENT = 'BEREAVEMENT',
  JURY_DUTY = 'JURY_DUTY',
  MILITARY = 'MILITARY',
  MISSION = 'MISSION',
  TRAINING = 'TRAINING',
  STUDY = 'STUDY',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER',
}

export interface SpecialAbsenceRule {
  code: SpecialAbsenceCode | string;
  maxDaysPerYear?: number;
  maxDaysPerOccurrence?: number;
  requiresDocumentation: boolean;
  documentationType?: string;
  isPaid: boolean;
  payPercentage?: number;
  advanceNoticeRequired: boolean;
  advanceNoticeDays?: number;
  autoApprove: boolean;
  approvalLevels?: string[];
  allowExtension: boolean;
  extensionMaxDays?: number;
  notes?: string;
}

@Injectable()
export class SpecialAbsenceService {
  constructor(
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(LeavePolicy.name) private leavePolicyModel: Model<LeavePolicyDocument>,
    @InjectModel(LeaveCategory.name) private leaveCategoryModel: Model<LeaveCategoryDocument>,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // CREATE SPECIAL ABSENCE / MISSION TYPE
  // ─────────────────────────────────────────────────────────────

  // Helper to map documentationType to valid AttachmentType enum value
  private mapToAttachmentType(documentationType?: string): AttachmentType | undefined {
    if (!documentationType) return undefined;
    
    // If it's already a valid AttachmentType value, use it
    const validTypes = Object.values(AttachmentType);
    if (validTypes.includes(documentationType as AttachmentType)) {
      return documentationType as AttachmentType;
    }
    
    // Map common documentation types to AttachmentType.DOCUMENT
    const documentTypes = [
      'COURT_SUMMONS', 'DEATH_CERTIFICATE', 'MILITARY_ORDERS', 
      'MISSION_ORDER', 'TRAINING_REGISTRATION', 'CERTIFICATE',
      'PROOF', 'OFFICIAL_DOCUMENT'
    ];
    if (documentTypes.includes(documentationType.toUpperCase())) {
      return AttachmentType.DOCUMENT;
    }
    
    // Medical-related types
    if (documentationType.toUpperCase().includes('MEDICAL') || 
        documentationType.toUpperCase().includes('DOCTOR')) {
      return AttachmentType.MEDICAL;
    }
    
    // Default to OTHER
    return AttachmentType.OTHER;
  }

  async createSpecialAbsenceType(data: {
    code: string;
    name: string;
    categoryId: string;
    description?: string;
    rule: SpecialAbsenceRule;
  }): Promise<{ leaveType: LeaveTypeDocument; policy: LeavePolicyDocument }> {
    // Validate category
    const category = await this.leaveCategoryModel.findById(data.categoryId).exec();
    if (!category) throw new NotFoundException(`Category ${data.categoryId} not found`);

    // Map documentationType to valid AttachmentType
    const attachmentType = this.mapToAttachmentType(data.rule.documentationType);

    // Create the leave type
    const leaveType = new this.leaveTypeModel({
      code: data.code,
      name: data.name,
      categoryId: data.categoryId,
      description: data.description,
      paid: data.rule.isPaid,
      deductible: false, // Special absences typically don't deduct from regular balance
      requiresAttachment: data.rule.requiresDocumentation,
      attachmentType: attachmentType,
      maxDurationDays: data.rule.maxDaysPerOccurrence,
    });
    const savedLeaveType = await leaveType.save();

    // Create the associated policy with special rules
    const policy = new this.leavePolicyModel({
      leaveTypeId: savedLeaveType._id,
      accrualMethod: 'yearly', // Use yearly for special absences (represents yearly allocation)
      monthlyRate: 0,
      yearlyRate: data.rule.maxDaysPerYear ?? 0,
      carryForwardAllowed: false,
      maxCarryForward: 0,
      minNoticeDays: data.rule.advanceNoticeDays ?? 0,
      maxConsecutiveDays: data.rule.maxDaysPerOccurrence,
      eligibility: {
        specialAbsenceRule: data.rule,
      },
    });
    const savedPolicy = await policy.save();

    return { leaveType: savedLeaveType, policy: savedPolicy };
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE SPECIAL ABSENCE RULE ON POLICY
  // ─────────────────────────────────────────────────────────────

  async updateSpecialAbsenceRule(
    leaveTypeId: string,
    rule: Partial<SpecialAbsenceRule>,
  ): Promise<LeavePolicyDocument> {
    const policy = await this.leavePolicyModel.findOne({ leaveTypeId }).exec();
    if (!policy) throw new NotFoundException(`Policy for leave type ${leaveTypeId} not found`);

    const existingRule = policy.eligibility?.specialAbsenceRule || {};
    policy.eligibility = {
      ...policy.eligibility,
      specialAbsenceRule: { ...existingRule, ...rule },
    };

    // Sync certain fields
    if (rule.maxDaysPerYear !== undefined) {
      policy.yearlyRate = rule.maxDaysPerYear;
    }
    if (rule.maxDaysPerOccurrence !== undefined) {
      policy.maxConsecutiveDays = rule.maxDaysPerOccurrence;
    }
    if (rule.advanceNoticeDays !== undefined) {
      policy.minNoticeDays = rule.advanceNoticeDays;
    }

    return policy.save();
  }

  // ─────────────────────────────────────────────────────────────
  // GET SPECIAL ABSENCE TYPES
  // ─────────────────────────────────────────────────────────────

  async getAllSpecialAbsenceTypes(): Promise<
    { leaveType: LeaveTypeDocument; rule: SpecialAbsenceRule | null }[]
  > {
    // Find leave types that are not deductible (typically special absences)
    const leaveTypes = await this.leaveTypeModel
      .find({ deductible: false })
      .populate('categoryId')
      .exec();

    const results: { leaveType: LeaveTypeDocument; rule: SpecialAbsenceRule | null }[] = [];

    for (const lt of leaveTypes) {
      const policy = await this.leavePolicyModel.findOne({ leaveTypeId: lt._id }).exec();
      results.push({
        leaveType: lt,
        rule: policy?.eligibility?.specialAbsenceRule || null,
      });
    }

    return results;
  }

  async getSpecialAbsenceRuleByLeaveType(leaveTypeId: string): Promise<{
    leaveType: LeaveTypeDocument;
    rule: SpecialAbsenceRule | null;
  }> {
    const leaveType = await this.leaveTypeModel.findById(leaveTypeId).exec();
    if (!leaveType) throw new NotFoundException(`Leave type ${leaveTypeId} not found`);

    const policy = await this.leavePolicyModel.findOne({ leaveTypeId }).exec();

    return {
      leaveType,
      rule: policy?.eligibility?.specialAbsenceRule || null,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // PREDEFINED SPECIAL ABSENCE TEMPLATES
  // ─────────────────────────────────────────────────────────────

  getSpecialAbsenceTemplates(): { code: string; name: string; defaultRule: SpecialAbsenceRule }[] {
    return [
      {
        code: SpecialAbsenceCode.BEREAVEMENT,
        name: 'Bereavement Leave',
        defaultRule: {
          code: SpecialAbsenceCode.BEREAVEMENT,
          maxDaysPerYear: 5,
          maxDaysPerOccurrence: 5,
          requiresDocumentation: true,
          documentationType: AttachmentType.DOCUMENT,
          isPaid: true,
          payPercentage: 100,
          advanceNoticeRequired: false,
          autoApprove: false,
          approvalLevels: ['MANAGER'],
          allowExtension: true,
          extensionMaxDays: 2,
          notes: 'For immediate family members (requires death certificate)',
        },
      },
      {
        code: SpecialAbsenceCode.JURY_DUTY,
        name: 'Jury Duty',
        defaultRule: {
          code: SpecialAbsenceCode.JURY_DUTY,
          maxDaysPerYear: 30,
          maxDaysPerOccurrence: 30,
          requiresDocumentation: true,
          documentationType: AttachmentType.DOCUMENT,
          isPaid: true,
          payPercentage: 100,
          advanceNoticeRequired: true,
          advanceNoticeDays: 7,
          autoApprove: true,
          allowExtension: true,
          extensionMaxDays: 30,
          notes: 'Legal obligation (requires court summons)',
        },
      },
      {
        code: SpecialAbsenceCode.MILITARY,
        name: 'Military Leave',
        defaultRule: {
          code: SpecialAbsenceCode.MILITARY,
          maxDaysPerYear: 15,
          requiresDocumentation: true,
          documentationType: AttachmentType.DOCUMENT,
          isPaid: true,
          payPercentage: 100,
          advanceNoticeRequired: true,
          advanceNoticeDays: 30,
          autoApprove: true,
          allowExtension: true,
          notes: 'Reserve/National Guard duty (requires military orders)',
        },
      },
      {
        code: SpecialAbsenceCode.MISSION,
        name: 'Work Mission / Business Travel',
        defaultRule: {
          code: SpecialAbsenceCode.MISSION,
          requiresDocumentation: true,
          documentationType: AttachmentType.DOCUMENT,
          isPaid: true,
          payPercentage: 100,
          advanceNoticeRequired: true,
          advanceNoticeDays: 3,
          autoApprove: false,
          approvalLevels: ['MANAGER', 'HR'],
          allowExtension: true,
          notes: 'Official work mission or travel (requires mission order)',
        },
      },
      {
        code: SpecialAbsenceCode.TRAINING,
        name: 'Training Leave',
        defaultRule: {
          code: SpecialAbsenceCode.TRAINING,
          maxDaysPerYear: 10,
          requiresDocumentation: true,
          documentationType: AttachmentType.DOCUMENT,
          isPaid: true,
          payPercentage: 100,
          advanceNoticeRequired: true,
          advanceNoticeDays: 14,
          autoApprove: false,
          approvalLevels: ['MANAGER', 'HR'],
          allowExtension: false,
          notes: 'Professional development training (requires training registration)',
        },
      },
      {
        code: SpecialAbsenceCode.EMERGENCY,
        name: 'Emergency Leave',
        defaultRule: {
          code: SpecialAbsenceCode.EMERGENCY,
          maxDaysPerYear: 3,
          maxDaysPerOccurrence: 1,
          requiresDocumentation: false,
          isPaid: true,
          payPercentage: 100,
          advanceNoticeRequired: false,
          autoApprove: false,
          approvalLevels: ['MANAGER'],
          allowExtension: false,
          notes: 'Unforeseen personal emergency',
        },
      },
    ];
  }

  // ─────────────────────────────────────────────────────────────
  // CREATE FROM TEMPLATE
  // ─────────────────────────────────────────────────────────────

  async createFromTemplate(
    templateCode: SpecialAbsenceCode,
    categoryId: string,
    customizations?: Partial<SpecialAbsenceRule>,
  ): Promise<{ leaveType: LeaveTypeDocument; policy: LeavePolicyDocument }> {
    const templates = this.getSpecialAbsenceTemplates();
    const template = templates.find((t) => t.code === templateCode);
    if (!template) throw new BadRequestException(`Template ${templateCode} not found`);

    const rule: SpecialAbsenceRule = { ...template.defaultRule, ...customizations };

    return this.createSpecialAbsenceType({
      code: template.code,
      name: template.name,
      categoryId,
      description: rule.notes,
      rule,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // DELETE SPECIAL ABSENCE TYPE
  // ─────────────────────────────────────────────────────────────

  async deleteSpecialAbsenceType(leaveTypeId: string): Promise<{ deleted: boolean }> {
    const leaveType = await this.leaveTypeModel.findById(leaveTypeId).exec();
    if (!leaveType) throw new NotFoundException(`Leave type ${leaveTypeId} not found`);

    await this.leavePolicyModel.deleteMany({ leaveTypeId }).exec();
    await this.leaveTypeModel.findByIdAndDelete(leaveTypeId).exec();

    return { deleted: true };
  }
}

export enum LeaveNotificationType {
  // REQ-019: Employee status notifications
  LEAVE_REQUEST_APPROVED = 'LEAVE_REQUEST_APPROVED',
  LEAVE_REQUEST_REJECTED = 'LEAVE_REQUEST_REJECTED',
  LEAVE_REQUEST_RETURNED = 'LEAVE_REQUEST_RETURNED',       // Returned for correction
  LEAVE_REQUEST_MODIFIED = 'LEAVE_REQUEST_MODIFIED',
  
  // REQ-024: Manager assignment notifications
  LEAVE_REQUEST_ASSIGNED = 'LEAVE_REQUEST_ASSIGNED',       // New request assigned to manager
  LEAVE_REQUEST_OVERDUE = 'LEAVE_REQUEST_OVERDUE',         // Escalation after 48 hrs
  
  // REQ-030: Finalization notifications (to all stakeholders)
  LEAVE_REQUEST_FINALIZED = 'LEAVE_REQUEST_FINALIZED',
}


