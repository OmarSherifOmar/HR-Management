import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeaveRequest, LeaveRequestDocument } from '../models/leave-request.schema';
import { LeaveEntitlement, LeaveEntitlementDocument } from '../models/leave-entitlement.schema';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';
import { LeavePolicy, LeavePolicyDocument } from '../models/leave-policy.schema';
import { Attachment, AttachmentDocument } from '../models/attachment.schema';
import { CreateLeaveRequestDto } from '../dto/leave-request/create-leave-request.dto';
import { UpdateLeaveRequestDto } from '../dto/leave-request/update-leave-request.dto';
import { LeaveStatus } from '../enums/leave-status.enum';
import { EmployeeService } from '../../employee-profile/employee-profile.service';
import { SystemRole } from '../../employee-profile/enums/employee-profile.enums';
import { LeavesNotificationService } from './leaves-notification.service';
import { CalendarService } from './calendar.service';

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

    // 5. Check if dates fall within blocked periods
    const blockedDates = await this.calendarService.getBlockedDatesInRange(fromDate, toDate);
    if (blockedDates.length > 0) {
      const blockedDatesList = blockedDates.map(bd => 
        `${bd.date.toLocaleDateString()} (${bd.reason})`
      ).join(', ');
      throw new BadRequestException(
        `Cannot submit leave request for blocked dates: ${blockedDatesList}`,
      );
    }

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

    // 8. Calculate duration in business days
    const durationDays = this.calculateBusinessDays(fromDate, toDate);
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

      // Check if dates fall within blocked periods
      const blockedDates = await this.calendarService.getBlockedDatesInRange(fromDate, toDate);
      if (blockedDates.length > 0) {
        const blockedDatesList = blockedDates.map(bd => 
          `${bd.date.toLocaleDateString()} (${bd.reason})`
        ).join(', ');
        throw new BadRequestException(
          `Cannot modify leave request to include blocked dates: ${blockedDatesList}`,
        );
      }

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

      // Recalculate duration based on new dates
      newDuration = this.calculateBusinessDays(fromDate, toDate);
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

    // Build employee query: team members who have supervisorPositionId == manager.primaryPositionId
    const employeeModel = this.employeeService['employeeModel'];
    const teamQuery: any = { isActive: true };
    if (manager.primaryPositionId) {
      teamQuery.supervisorPositionId = manager.primaryPositionId;
    }
    if (filters?.departmentId) {
      teamQuery.primaryDepartmentId = new Types.ObjectId(filters.departmentId);
    }

    const teamMembers = await employeeModel
      .find(teamQuery)
      .select('_id firstName lastName employeeNumber primaryDepartmentId')
      .exec();

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

    // Mark the entire request as rejected
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

    // REQ-019: Notify employee about rejection
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
        status: LeaveStatus.REJECTED,
        'approvalFlow': {
          $elemMatch: {
            role: 'hr_manager',
            status: 'pending',
          },
        },
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
   * - Allow negative balance (with allowNegativeBalance flag)
   */
  async hrOverrideDecision(
    requestId: string,
    hrManagerId: string,
    action: 'approve' | 'reject',
    options?: {
      comments?: string;
      allowNegativeBalance?: boolean;
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
      // Check balance unless HR explicitly allows negative
      if (leaveType?.deductible && !options?.allowNegativeBalance) {
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
              `Insufficient leave balance. Available: ${availableBalance} days, Requested: ${leaveRequest.durationDays} days. ` +
              `Set allowNegativeBalance=true to override.`,
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
