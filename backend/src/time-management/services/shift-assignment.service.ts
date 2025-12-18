// shift-assignment.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ShiftAssignment, ShiftAssignmentDocument } from '../models/shift-assignment.schema';
import { ShiftAssignmentStatus } from '../models/enums/index';
import { CreateShiftAssignmentDto } from '../dtos/shift-assignment/create-shift-assignment.dto';
import { BulkAssignByDepartmentDto } from '../dtos/shift-assignment/bulk-assign-by-department.dto';
import { BulkAssignByPositionDto } from '../dtos/shift-assignment/bulk-assign-by-position.dto';
import { UpdateShiftAssignmentStatusDto } from '../dtos/shift-assignment/update-shift-assignment-status.dto';
import { UpdateShiftAssignmentDto } from '../dtos/shift-assignment/update-shift-assignment.dto';
import { RenewShiftAssignmentDto } from '../dtos/shift-assignment/renew-shift-assignment.dto';

// Import other services you might need (adjust paths as needed)
// import { EmployeeService } from '../../employee/services/employee.service';
// import { PositionService } from '../../position/services/position.service';

/**
 * Shift Assignment Service
 * Implements FR-TM-01: Shift Assignment Management
 * 
 * Functional Requirements:
 * - FR-TM-01: Assign shifts individually, by department, or by position
 * - FR-TM-04: Support shift expiry notifications
 * 
 * Business Rules:
 * - BR-TM-01: Role & Permission Control (enforced via controller guards)
 * - BR-TM-02: Shift Assignment Validity (status management, term-based)
 * - BR-TM-03: Multiple shift types support
 * - BR-TM-04: Shift naming conventions support
 * - BR-TM-05: Assignment by Department, Position, or Individual
 */
@Injectable()
export class ShiftAssignmentService {
  // BR-TM-01: Roles allowed to approve/reject assignments
  private readonly APPROVER_ROLES = ['SYSTEM_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'LINE_MANAGER'];
  
  // BR-TM-02: Valid status transitions (working within existing PENDING, APPROVED, CANCELLED, EXPIRED)
  // Note: Using PENDING as "Entered/Submitted", treating schema constraints
  private readonly STATUS_TRANSITIONS: Record<ShiftAssignmentStatus, ShiftAssignmentStatus[]> = {
    [ShiftAssignmentStatus.PENDING]: [
      ShiftAssignmentStatus.APPROVED,
      ShiftAssignmentStatus.CANCELLED,
    ],
    [ShiftAssignmentStatus.APPROVED]: [
      ShiftAssignmentStatus.CANCELLED,
      ShiftAssignmentStatus.EXPIRED,
    ],
    [ShiftAssignmentStatus.CANCELLED]: [], // Terminal state
    [ShiftAssignmentStatus.EXPIRED]: [], // Terminal state
  };

  constructor(
    @InjectModel(ShiftAssignment.name) private shiftAssignmentModel: Model<ShiftAssignmentDocument>,
    // Uncomment when you have these services
    // @Inject(forwardRef(() => EmployeeService)) private employeeService: EmployeeService,
    // @Inject(forwardRef(() => PositionService)) private positionService: PositionService,
  ) {}

  // Get active shift assignment for employee at given date 
  async getEmployeeActiveShift(employeeId: string | Types.ObjectId, date: Date = new Date()) {
    const emp = typeof employeeId === 'string' ? new Types.ObjectId(employeeId) : employeeId;
    const today = date;
    return this.shiftAssignmentModel.findOne({
      employeeId: emp,
      startDate: { $lte: today },
      $or: [{ endDate: { $exists: false } }, { endDate: { $gte: today } }],
      status: { $in: ['APPROVED', 'PENDING'] },
    });
  }

  // Get shift assignments within a date range (used by attendance/leaves integration)
  async getAssignmentsInRange(startDate: Date, endDate: Date, employeeId?: string) {
    const query: any = {
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
      ],
    };

    if (employeeId) {
      query.employeeId = new Types.ObjectId(employeeId);
    }

    return this.shiftAssignmentModel.find(query).lean();
  }

  // ==================== CREATE OPERATIONS ====================

  /**
   * FR-TM-01 & BR-TM-05: Create individual shift assignment
   * Assigns shift to a single employee
   */
  async create(createDto: CreateShiftAssignmentDto, createdByUserId?: string): Promise<ShiftAssignmentDocument> {
    // BR-TM-05: Validate assignment dimensions
    this.validateAssignmentDimensions(createDto);
    
    // BR-TM-02: Validate date range for term-based assignment
    this.validateDateRange(createDto.startDate, createDto.endDate);
    
    // BR-TM-02: Check for overlapping assignments (prevent double-booking)
    if (createDto.employeeId) {
      await this.checkOverlappingAssignments(
        createDto.employeeId,
        createDto.startDate,
        createDto.endDate
      );
    }
    
    // Convert date strings to Date objects
    const assignmentData = {
      ...createDto,
      startDate: new Date(createDto.startDate),
      endDate: createDto.endDate ? new Date(createDto.endDate) : null,
      status: createDto.status || ShiftAssignmentStatus.PENDING, // Default to PENDING (acts as "Entered")
    };
    
    const assignment = new this.shiftAssignmentModel(assignmentData);
    return assignment.save();
  }

  /**
   * FR-TM-01 & BR-TM-05: Bulk assign shifts by department
   * Creates shift assignments for all employees in a department
   */
  async bulkAssignByDepartment(
    bulkDto: BulkAssignByDepartmentDto,
    createdByUserId?: string
  ): Promise<ShiftAssignmentDocument[]> {
    // Validate date range
    this.validateDateRange(bulkDto.startDate, bulkDto.endDate);
    
    // TODO: When EmployeeService is available, implement as follows:
    /*
    const employees = await this.employeeService.findByDepartment(bulkDto.departmentId);
    
    if (employees.length === 0) {
      throw new NotFoundException(`No employees found in department ${bulkDto.departmentId}`);
    }
    
    const assignments = await Promise.all(
      employees.map(async (employee) => {
        try {
          // Check for overlaps
          await this.checkOverlappingAssignments(
            employee._id.toString(),
            bulkDto.startDate,
            bulkDto.endDate
          );
          
          return {
            employeeId: employee._id,
            departmentId: bulkDto.departmentId,
            shiftId: bulkDto.shiftId,
            startDate: new Date(bulkDto.startDate),
            endDate: bulkDto.endDate ? new Date(bulkDto.endDate) : null,
            status: ShiftAssignmentStatus.PENDING,
          };
        } catch (error) {
          // Log overlap conflicts but continue with other employees
          console.warn(`Skipping employee ${employee._id}: ${error.message}`);
          return null;
        }
      })
    );
    
    const validAssignments = assignments.filter(a => a !== null);
    
    if (validAssignments.length === 0) {
      throw new BadRequestException('No valid assignments could be created (all employees have conflicts)');
    }
    
    return this.shiftAssignmentModel.insertMany(validAssignments);
    */
    
    // For now, create a single department-level assignment as placeholder
    const departmentAssignment = new this.shiftAssignmentModel({
      departmentId: bulkDto.departmentId,
      shiftId: bulkDto.shiftId,
      startDate: new Date(bulkDto.startDate),
      endDate: bulkDto.endDate ? new Date(bulkDto.endDate) : null,
      status: ShiftAssignmentStatus.PENDING,
    });
    
    return [await departmentAssignment.save()];
  }

  /**
   * FR-TM-01 & BR-TM-05: Bulk assign shifts by position
   * Creates shift assignments for all employees in a position
   */
  async bulkAssignByPosition(
    bulkDto: BulkAssignByPositionDto,
    createdByUserId?: string
  ): Promise<ShiftAssignmentDocument[]> {
    // Validate date range
    this.validateDateRange(bulkDto.startDate, bulkDto.endDate);
    
    // TODO: Similar implementation to bulkAssignByDepartment when EmployeeService is available
    
    // For now, create a single position-level assignment as placeholder
    const positionAssignment = new this.shiftAssignmentModel({
      positionId: bulkDto.positionId,
      shiftId: bulkDto.shiftId,
      startDate: new Date(bulkDto.startDate),
      endDate: bulkDto.endDate ? new Date(bulkDto.endDate) : null,
      status: ShiftAssignmentStatus.PENDING,
    });
    
    return [await positionAssignment.save()];
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Find all shift assignments with optional filters
   */
  async findAll(filters: any = {}): Promise<ShiftAssignmentDocument[]> {
    const query = this.shiftAssignmentModel.find();
    
    // Apply filters
    if (filters.employeeId) {
      query.where('employeeId').equals(new Types.ObjectId(filters.employeeId));
    }
    
    if (filters.departmentId) {
      query.where('departmentId').equals(new Types.ObjectId(filters.departmentId));
    }
    
    if (filters.positionId) {
      query.where('positionId').equals(new Types.ObjectId(filters.positionId));
    }
    
    if (filters.status) {
      query.where('status').equals(filters.status);
    }
    
    if (filters.shiftId) {
      query.where('shiftId').equals(new Types.ObjectId(filters.shiftId));
    }
    
    if (filters.scheduleRuleId) {
      query.where('scheduleRuleId').equals(new Types.ObjectId(filters.scheduleRuleId));
    }
    
    // Date range filters
    if (filters.startDateFrom) {
      const startFrom = filters.startDateFrom instanceof Date 
        ? filters.startDateFrom 
        : new Date(filters.startDateFrom);
      query.where('startDate').gte(startFrom);
    }
    
    if (filters.startDateTo) {
      const startTo = filters.startDateTo instanceof Date 
        ? filters.startDateTo 
        : new Date(filters.startDateTo);
      query.where('startDate').lte(startTo);
    }
    
    if (filters.endDateFrom) {
      const endFrom = filters.endDateFrom instanceof Date 
        ? filters.endDateFrom 
        : new Date(filters.endDateFrom);
      query.where('endDate').gte(endFrom);
    }
    
    if (filters.endDateTo) {
      const endTo = filters.endDateTo instanceof Date 
        ? filters.endDateTo 
        : new Date(filters.endDateTo);
      query.where('endDate').lte(endTo);
    }
    
    return query
      .populate('employeeId', 'firstName lastName email')
      .populate('shiftId', 'name startTime endTime')
      .populate('departmentId', 'name code')
      .populate('positionId', 'title code')
      .populate('scheduleRuleId', 'name pattern')
      .sort({ startDate: 1, createdAt: -1 })
      .exec();
  }

  /**
   * Find shift assignment by ID
   */
  async findById(id: string): Promise<ShiftAssignmentDocument> {
    const assignment = await this.shiftAssignmentModel
      .findById(id)
      .populate('employeeId', 'firstName lastName email')
      .populate('shiftId', 'name startTime endTime')
      .populate('departmentId', 'name code')
      .populate('positionId', 'title code')
      .populate('scheduleRuleId', 'name pattern')
      .exec();
    
    if (!assignment) {
      throw new NotFoundException(`Shift assignment with ID ${id} not found`);
    }
    
    return assignment;
  }

  /**
   * FR-TM-04: Find assignments expiring soon (for notifications)
   * Returns assignments that will expire within specified days
   */
  async findExpiringSoon(days: number = 3): Promise<ShiftAssignmentDocument[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    
    return this.shiftAssignmentModel
      .find({
        endDate: { 
          $ne: null, // Not null (ongoing)
          $gte: now,  // Not already expired
          $lte: futureDate, // Expires within X days
        },
        status: ShiftAssignmentStatus.APPROVED, // Only approved assignments
      })
      .populate('employeeId', 'firstName lastName email')
      .populate('shiftId', 'name')
      .populate('departmentId', 'name')
      .populate('positionId', 'title')
      .exec();
  }

  /**
   * FR-TM-04: Auto-expire overdue assignments
   * Should be called by a scheduled job (cron) daily
   */
  async expireOverdueAssignments(): Promise<{ expiredCount: number; expiredIds: string[] }> {
    const now = new Date();
    
    const overdueAssignments = await this.shiftAssignmentModel.find({
      endDate: { $lt: now },
      status: ShiftAssignmentStatus.APPROVED,
    });
    
    const expiredIds: string[] = [];
    
    for (const assignment of overdueAssignments) {
      assignment.status = ShiftAssignmentStatus.EXPIRED;
      await assignment.save();
      expiredIds.push(assignment._id.toString());
    }
    
    return {
      expiredCount: expiredIds.length,
      expiredIds,
    };
  }

  /**
   * Get assignments by status (for workflow management)
   */
  async findByStatus(status: ShiftAssignmentStatus): Promise<ShiftAssignmentDocument[]> {
    return this.shiftAssignmentModel
      .find({ status })
      .populate('employeeId', 'firstName lastName email')
      .populate('shiftId', 'name')
      .populate('departmentId', 'name')
      .populate('positionId', 'title')
      .exec();
  }

  /**
   * BR-TM-01: Get pending approvals
   * For HR/Line Managers dashboard
   */
  async getPendingApprovals(): Promise<ShiftAssignmentDocument[]> {
    return this.findByStatus(ShiftAssignmentStatus.PENDING);
  }

  /**
   * Get active assignments (currently in effect)
   */
  async getActiveAssignments(filters: any = {}): Promise<ShiftAssignmentDocument[]> {
    const now = new Date();
    
    return this.shiftAssignmentModel
      .find({
        ...filters,
        status: ShiftAssignmentStatus.APPROVED,
        startDate: { $lte: now },
        $or: [
          { endDate: { $gte: now } },
          { endDate: null }, // Ongoing
        ],
      })
      .populate('employeeId', 'firstName lastName email')
      .populate('shiftId', 'name')
      .populate('departmentId', 'name')
      .populate('positionId', 'title')
      .exec();
  }

  /**
   * Get assignment history for an employee
   */
  async getEmployeeAssignmentHistory(employeeId: string): Promise<ShiftAssignmentDocument[]> {
    return this.shiftAssignmentModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .sort({ startDate: -1 })
      .populate('shiftId', 'name')
      .populate('departmentId', 'name')
      .populate('positionId', 'title')
      .exec();
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * BR-TM-01 & BR-TM-02: Update shift assignment status with validation
   * Enforces status transitions and role-based access control
   */
  async updateStatus(
    updateDto: UpdateShiftAssignmentStatusDto,
    userId?: string,
    userRole?: string
  ): Promise<ShiftAssignmentDocument> {
    const assignment = await this.shiftAssignmentModel.findById(updateDto.assignmentId);
    if (!assignment) {
      throw new NotFoundException(`Shift assignment with ID ${updateDto.assignmentId} not found`);
    }
    
    // BR-TM-02: Validate status transition
    this.validateStatusTransition(assignment.status, updateDto.status);
    
    // BR-TM-01: Check if user has permission to approve (for APPROVED status)
    if (updateDto.status === ShiftAssignmentStatus.APPROVED && userRole) {
      if (!this.APPROVER_ROLES.includes(userRole)) {
        throw new ForbiddenException(
          'Only System Admin, HR Admin, HR Manager, or Line Manager can approve shift assignments'
        );
      }
    }
    
    assignment.status = updateDto.status;
    
    return assignment.save();
  }

  /**
   * BR-TM-01: Approve assignment (convenience method)
   * Requires appropriate role
   */
  async approveAssignment(
    assignmentId: string,
    userId: string,
    userRole: string
  ): Promise<ShiftAssignmentDocument> {
    if (!this.APPROVER_ROLES.includes(userRole)) {
      throw new ForbiddenException(
        'Only System Admin, HR Admin, HR Manager, or Line Manager can approve assignments'
      );
    }
    
    return this.updateStatus(
      { assignmentId, status: ShiftAssignmentStatus.APPROVED },
      userId,
      userRole
    );
  }

  /**
   * Cancel assignment (can be done by admin or manager)
   */
  async cancelAssignment(assignmentId: string): Promise<ShiftAssignmentDocument> {
    return this.updateStatus({
      assignmentId,
      status: ShiftAssignmentStatus.CANCELLED,
    });
  }

  /**
   * FR-TM-01: Partial update with validation
   * BR-TM-02: Validates date ranges and prevents overlapping assignments
   * BR-TM-05: Ensures at least one assignment dimension is maintained
   */
  async partialUpdate(id: string, updateDto: UpdateShiftAssignmentDto): Promise<ShiftAssignmentDocument> {
    const assignment = await this.shiftAssignmentModel.findById(id);
    if (!assignment) {
      throw new NotFoundException(`Shift assignment with ID ${id} not found`);
    }
    
    // Prepare update data
    const updateData: any = {};
    
    // Only update fields that are provided in DTO
    if (updateDto.employeeId !== undefined) {
      updateData.employeeId = new Types.ObjectId(updateDto.employeeId);
    }
    
    if (updateDto.departmentId !== undefined) {
      updateData.departmentId = new Types.ObjectId(updateDto.departmentId);
    }
    
    if (updateDto.positionId !== undefined) {
      updateData.positionId = new Types.ObjectId(updateDto.positionId);
    }
    
    if (updateDto.shiftId !== undefined) {
      updateData.shiftId = new Types.ObjectId(updateDto.shiftId);
    }
    
    if (updateDto.scheduleRuleId !== undefined) {
      updateData.scheduleRuleId = new Types.ObjectId(updateDto.scheduleRuleId);
    }
    
    if (updateDto.startDate !== undefined) {
      updateData.startDate = new Date(updateDto.startDate);
    }
    
    if (updateDto.endDate !== undefined) {
      updateData.endDate = updateDto.endDate ? new Date(updateDto.endDate) : null;
    }
    
    if (updateDto.status !== undefined) {
      // Validate status transition
      this.validateStatusTransition(assignment.status, updateDto.status);
      updateData.status = updateDto.status;
    }
    
    // BR-TM-02: Validate date range if dates are being updated
    if (updateData.startDate || updateData.endDate !== undefined) {
      const startDate = updateData.startDate ?? assignment.startDate;
      const endDate = updateData.endDate !== undefined ? updateData.endDate : assignment.endDate;
      this.validateDateRange(startDate, endDate);
      
      // Check for overlapping assignments
      const employeeId = updateData.employeeId ?? assignment.employeeId;
      if (employeeId) {
        await this.checkOverlappingAssignments(employeeId.toString(), startDate, endDate);
      }
    }
    
    // Apply updates
    Object.assign(assignment, updateData);
    
    // BR-TM-05: Validate assignment dimensions after update
    this.validateAssignmentDimensions(assignment);
    
    return assignment.save();
  }

  /**
   * FR-TM-01: Full update with comprehensive validation
   * BR-TM-02: Validates date ranges and prevents overlapping assignments
   * BR-TM-05: Ensures at least one assignment dimension is provided
   */
  async update(id: string, updateDto: UpdateShiftAssignmentDto): Promise<ShiftAssignmentDocument> {
    const assignment = await this.shiftAssignmentModel.findById(id);
    if (!assignment) {
      throw new NotFoundException(`Shift assignment with ID ${id} not found`);
    }
    
    // Prepare complete update data (all fields required for PUT)
    const updateData = {
      employeeId: updateDto.employeeId ? new Types.ObjectId(updateDto.employeeId) : assignment.employeeId,
      departmentId: updateDto.departmentId ? new Types.ObjectId(updateDto.departmentId) : assignment.departmentId,
      positionId: updateDto.positionId ? new Types.ObjectId(updateDto.positionId) : assignment.positionId,
      shiftId: updateDto.shiftId ? new Types.ObjectId(updateDto.shiftId) : assignment.shiftId,
      scheduleRuleId: updateDto.scheduleRuleId ? new Types.ObjectId(updateDto.scheduleRuleId) : assignment.scheduleRuleId,
      startDate: updateDto.startDate ? new Date(updateDto.startDate) : assignment.startDate,
      endDate: updateDto.endDate !== undefined 
        ? (updateDto.endDate ? new Date(updateDto.endDate) : null) 
        : assignment.endDate,
      status: updateDto.status || assignment.status,
    };
    
    // BR-TM-02: Validate status transition if status is being changed
    if (updateDto.status && assignment.status !== updateDto.status) {
      this.validateStatusTransition(assignment.status, updateDto.status);
    }
    
    // BR-TM-05: Validate assignment dimensions
    this.validateAssignmentDimensions(updateData);
    
    // BR-TM-02: Validate date range
    this.validateDateRange(updateData.startDate, updateData.endDate);
    
    // BR-TM-02: Check for overlapping assignments
    if (updateData.employeeId) {
      await this.checkOverlappingAssignments(
        updateData.employeeId.toString(), 
        updateData.startDate, 
        updateData.endDate
      );
    }
    
    // Replace the entire document
    Object.assign(assignment, updateData);
    
    return assignment.save();
  }

  /**
   * FR-TM-01: Renew assignment (extend end date)
   * BR-TM-02: Validates date range and checks for overlapping assignments
   * Creates new assignment period and expires the old one
   */
  async renew(renewDto: RenewShiftAssignmentDto): Promise<ShiftAssignmentDocument> {
    const oldAssignment = await this.shiftAssignmentModel.findById(renewDto.assignmentId);
    if (!oldAssignment) {
      throw new NotFoundException(`Shift assignment with ID ${renewDto.assignmentId} not found`);
    }
    
    // Check if assignment can be renewed
    if (oldAssignment.status === ShiftAssignmentStatus.EXPIRED || 
        oldAssignment.status === ShiftAssignmentStatus.CANCELLED) {
      throw new BadRequestException(`Cannot renew assignment with status: ${oldAssignment.status}`);
    }
    
    const startDate = oldAssignment.endDate || new Date(); // Start when old one ends or now
    const newEndDate = new Date(renewDto.newEndDate);
    
    // BR-TM-02: Validate that new end date is after start date
    this.validateDateRange(startDate, newEndDate);
    
    // BR-TM-02: Check for overlapping assignments in the new period
    if (oldAssignment.employeeId) {
      await this.checkOverlappingAssignments(
        oldAssignment.employeeId.toString(),
        startDate,
        newEndDate
      );
    }
    
    // Create new assignment based on old one
    const newAssignment = new this.shiftAssignmentModel({
      employeeId: oldAssignment.employeeId,
      departmentId: oldAssignment.departmentId,
      positionId: oldAssignment.positionId,
      shiftId: oldAssignment.shiftId,
      scheduleRuleId: oldAssignment.scheduleRuleId,
      startDate,
      endDate: newEndDate,
      status: oldAssignment.status,
    });
    
    // Update old assignment status to EXPIRED
    oldAssignment.status = ShiftAssignmentStatus.EXPIRED;
    await oldAssignment.save();
    
    return newAssignment.save();
  }

  // ==================== DELETE OPERATIONS ====================

  /**
   * FR-TM-01: Hard delete shift assignment
   * Permanently removes the assignment from database
   */
  async delete(id: string): Promise<ShiftAssignmentDocument> {
    const assignment = await this.shiftAssignmentModel.findByIdAndDelete(id);
    if (!assignment) {
      throw new NotFoundException(`Shift assignment with ID ${id} not found`);
    }
    return assignment;
  }

  /**
   * BR-TM-02: Soft delete (change status to CANCELLED instead of hard delete)
   * Maintains audit trail by preserving cancelled assignments
   */
  async softDelete(id: string): Promise<ShiftAssignmentDocument> {
    const assignment = await this.shiftAssignmentModel.findById(id);
    if (!assignment) {
      throw new NotFoundException(`Shift assignment with ID ${id} not found`);
    }
    
    // Validate the cancellation is allowed from current status
    this.validateStatusTransition(assignment.status, ShiftAssignmentStatus.CANCELLED);
    
    assignment.status = ShiftAssignmentStatus.CANCELLED;
    return assignment.save();
  }

  // ==================== HELPER METHODS ====================

  /**
   * BR-TM-05: Validate that at least one assignment dimension is provided
   * Ensures shift is assigned to employee, department, or position
   */
  private validateAssignmentDimensions(data: any): void {
    const hasEmployee = data.employeeId && data.employeeId.toString().trim() !== '';
    const hasDepartment = data.departmentId && data.departmentId.toString().trim() !== '';
    const hasPosition = data.positionId && data.positionId.toString().trim() !== '';
    
    if (!hasEmployee && !hasDepartment && !hasPosition) {
      throw new BadRequestException(
        'BR-TM-05: At least one assignment dimension (employeeId, departmentId, or positionId) must be provided'
      );
    }
  }

  /**
   * BR-TM-02: Validate date range for term-based assignments
   * Ensures start date is before end date
   */
  private validateDateRange(startDate: Date | string, endDate?: Date | string | null): void {
    if (!endDate) return; // Ongoing assignments are valid
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      throw new BadRequestException(
        'BR-TM-02: Start date must be before end date for term-based assignments'
      );
    }
  }

  /**
   * BR-TM-02: Check for overlapping shift assignments
   * Prevents double-booking employees
   */
  private async checkOverlappingAssignments(
    employeeId: string,
    startDate: Date | string,
    endDate?: Date | string | null
  ): Promise<void> {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    const query: any = {
      employeeId: new Types.ObjectId(employeeId),
      status: { $in: [ShiftAssignmentStatus.PENDING, ShiftAssignmentStatus.APPROVED] },
      $or: [
        // New assignment starts during existing assignment
        {
          startDate: { $lte: start },
          $or: [
            { endDate: { $gte: start } },
            { endDate: null }, // Ongoing assignment
          ],
        },
        // New assignment ends during existing assignment
        end
          ? {
              startDate: { $lte: end },
              $or: [{ endDate: { $gte: end } }, { endDate: null }],
            }
          : null,
        // New assignment completely contains existing assignment
        end
          ? {
              startDate: { $gte: start },
              endDate: { $lte: end },
            }
          : null,
      ].filter(Boolean),
    };
    
    const overlapping = await this.shiftAssignmentModel.findOne(query);
    
    if (overlapping) {
      throw new BadRequestException(
        `Employee already has a shift assignment from ${overlapping.startDate.toISOString().split('T')[0]} to ${
          overlapping.endDate ? overlapping.endDate.toISOString().split('T')[0] : 'ongoing'
        }`
      );
    }
  }

  /**
   * BR-TM-02: Validate status transition (business rules)
   * Available statuses: PENDING, APPROVED, CANCELLED, EXPIRED
   */
  private validateStatusTransition(currentStatus: ShiftAssignmentStatus, newStatus: ShiftAssignmentStatus): void {
    const allowedTransitions = this.STATUS_TRANSITIONS[currentStatus] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `BR-TM-02: Invalid status transition from ${currentStatus} to ${newStatus}. ` +
          `Allowed transitions: ${allowedTransitions.join(', ') || 'None (terminal state)'}`
      );
    }
  }

  /**
   * Check if assignment is active (not expired or cancelled)
   */
  isAssignmentActive(assignment: ShiftAssignmentDocument): boolean {
    const now = new Date();
    const isNotExpired = !assignment.endDate || assignment.endDate >= now;
    const isActiveStatus = ![
      ShiftAssignmentStatus.EXPIRED, 
      ShiftAssignmentStatus.CANCELLED
    ].includes(assignment.status);
    
    return isNotExpired && isActiveStatus;
  }

  /**
   * Get assignments count by status
   */
  async getCountByStatus(): Promise<Record<ShiftAssignmentStatus, number>> {
    const result = await this.shiftAssignmentModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const counts: Record<ShiftAssignmentStatus, number> = {} as any;
    
    // Initialize all statuses with 0
    Object.values(ShiftAssignmentStatus).forEach(status => {
      counts[status] = 0;
    });
    
    // Fill with actual counts
    result.forEach(item => {
      counts[item._id] = item.count;
    });
    
    return counts;
  }
}