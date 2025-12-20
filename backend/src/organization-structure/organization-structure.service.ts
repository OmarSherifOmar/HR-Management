import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Department } from './models/department.schema';
import { Position } from './models/position.schema';
import { StructureChangeRequest } from './models/structure-change-request.schema';
import { StructureApproval } from './models/structure-approval.schema';
import { StructureChangeLog } from './models/structure-change-log.schema';
import { PositionAssignment } from './models/position-assignment.schema';
import { CreateDepartmentDto } from './dtos/create-department.dto';
import { UpdateDepartmentDto } from './dtos/update-department.dto';
import { CreatePositionDto } from './dtos/create-position.dto';
import { UpdatePositionDto } from './dtos/update-position.dto';
import { CreateChangeRequestDto } from './dtos/create-change-request.dto';
import { NotificationLog } from '../time-management/./models/notification-log.schema';
import { EmployeeProfile } from '../employee-profile/models/employee-profile.schema';
import { payGrade } from '../payroll-configuration/models/payGrades.schema';
import { ConfigStatus } from '../payroll-configuration/./enums/payroll-configuration-enums';

// ============================================================================
// DEPARTMENT SERVICE
// ============================================================================
@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name) private deptModel: Model<any>,
    @InjectModel(StructureChangeLog.name) private changeLogModel: Model<any>,
    @InjectModel(PositionAssignment.name) private assignmentModel: Model<any>,
  ) {}

  async create(createDto: CreateDepartmentDto, actorId?: string) {
    const existing = (await this.deptModel.findOne({ code: createDto.code }).lean().exec()) as any;
    if (existing) throw new BadRequestException('Department code already exists');

    const toCreate: any = { ...createDto };
    if (createDto.headPositionId) {
      toCreate.headPositionId = new Types.ObjectId(createDto.headPositionId);
    }

    const created = (await this.deptModel.create(toCreate)) as any;
    const afterSnapshot = typeof created?.toObject === 'function' ? created.toObject() : created;

    await this.changeLogModel.create({
      _id: new Types.ObjectId(),
      action: 'CREATED',
      entityType: 'Department',
      entityId: created._id,
      performedByEmployeeId: actorId ? new Types.ObjectId(actorId) : undefined,
      afterSnapshot,
      summary: `Department ${afterSnapshot?.code ?? created.code ?? '<unknown>'} created`,
    } as any);
    return created;
  }

  async findAll(activeOnly?: boolean) {
    const filter: any = {};
    if (activeOnly === true) {
      filter.isActive = true;
    } else if (activeOnly === false) {
      filter.isActive = false;
    }
    // If activeOnly is undefined, no filter is applied - returns all departments
    return (await this.deptModel.find(filter).lean().exec()) as any;
  }

  async findById(id: string) {
    const d = (await this.deptModel.findById(id).exec()) as any;
    if (!d) throw new NotFoundException('Department not found');
    return d;
  }

  async update(id: string, dto: UpdateDepartmentDto, actorId?: string) {
    const before = (await this.deptModel.findById(id).lean().exec()) as any;
    if (!before) throw new NotFoundException('Department not found');

    const updateData: any = { ...dto };
    if (dto.headPositionId) {
      updateData.headPositionId = new Types.ObjectId(dto.headPositionId);
    }

    const updated = (await this.deptModel.findByIdAndUpdate(id, updateData, { new: true }).exec()) as any;
    const afterSnapshot = typeof updated?.toObject === 'function' ? updated.toObject() : updated;

    await this.changeLogModel.create({
      _id: new Types.ObjectId(),
      action: 'UPDATED',
      entityType: 'Department',
      entityId: updated._id,
      performedByEmployeeId: actorId ? new Types.ObjectId(actorId) : undefined,
      beforeSnapshot: before,
      afterSnapshot,
      summary: `Department ${before?.code ?? String(id)} updated`,
    } as any);
    return updated;
  }

  async FindActivePoistions(id: string) {
    const assignments = (await this.assignmentModel
      .find({ departmentId: id, endDate: { $exists: false } })
      .lean()
      .exec()) as any[];
    return { activeAssignmentsCount: assignments.length, assignmentsSample: assignments.slice(0, 10) };
  }

  async deactivate(id: string, actorId?: string) {
    const before = (await this.deptModel.findById(id).lean().exec()) as any;
    if (!before) throw new NotFoundException('Department not found');

    const assignments = (await this.assignmentModel
      .find({ departmentId: id, endDate: { $exists: false } })
      .lean()
      .exec()) as any[];
    if (assignments.length > 0) {
      throw new BadRequestException('Department has active assignments; cannot deactivate without reassigning employees.');
    }

    const updated = (await this.deptModel.findByIdAndUpdate(id, { isActive: false, closedAt: new Date() }, { new: true }).exec()) as any;
    const afterSnapshot = typeof updated?.toObject === 'function' ? updated.toObject() : updated;

    await this.changeLogModel.create({
      _id: new Types.ObjectId(),
      action: 'DEACTIVATED',
      entityType: 'Department',
      entityId: updated._id,
      performedByEmployeeId: actorId ? new Types.ObjectId(actorId) : undefined,
      beforeSnapshot: before,
      afterSnapshot,
      summary: `Department ${before?.code ?? String(id)} deactivated`,
    } as any);
    return updated;
  }

  async delete(id: string, actorId?: string) {
    const before = (await this.deptModel.findById(id).lean().exec()) as any;
    if (!before) throw new NotFoundException('Department not found');

    const assignments = (await this.assignmentModel
      .find({ departmentId: id, endDate: { $exists: false } })
      .lean()
      .exec()) as any[];
    if (assignments.length > 0) {
      throw new BadRequestException('Department has active assignments; cannot delete without reassigning employees.');
    }

    await this.deptModel.findByIdAndDelete(id).exec();

    await this.changeLogModel.create({
      _id: new Types.ObjectId(),
      action: 'DEACTIVATED',
      entityType: 'Department',
      entityId: new Types.ObjectId(id),
      performedByEmployeeId: actorId ? new Types.ObjectId(actorId) : undefined,
      beforeSnapshot: before,
      summary: `Department ${before?.code ?? String(id)} permanently deleted`,
    } as any);

    return { message: `Department ${before?.code ?? id} has been permanently deleted` };
  }
}

// ============================================================================
// POSITION SERVICE
// ============================================================================
@Injectable()
export class PositionService {
  constructor(
    @InjectModel(Position.name) private positionModel: Model<any>,
    @InjectModel(StructureChangeLog.name) private changeLogModel: Model<any>,
    @InjectModel(PositionAssignment.name) private assignmentModel: Model<any>,
    @InjectModel(payGrade.name) private payGradeModel: Model<any>,
    @InjectModel(EmployeeProfile.name) private employeeModel: Model<any>,
  ) {}

  private async validatePayGrade(payGradeId?: string) {
    if (!payGradeId) return null;

    const pg = (await this.payGradeModel.findById(payGradeId).lean().exec()) as any;
    if (!pg || pg.status !== ConfigStatus.APPROVED) {
      throw new BadRequestException('PayGrade not found or not approved');
    }
    return pg;
  }

  async create(dto: CreatePositionDto, actorId?: string) {
    const existing = (await this.positionModel.findOne({ code: dto.code }).lean().exec()) as any;
    if (existing) throw new BadRequestException('Position code already exists');

    // Validate payGradeId if provided
    if (dto.payGradeId) {
      await this.validatePayGrade(dto.payGradeId);
    }

    const toCreate: any = {
      ...dto,
      departmentId: new Types.ObjectId(dto.departmentId),
      reportsToPositionId: dto.reportsToPositionId 
        ? new Types.ObjectId(dto.reportsToPositionId) 
        : undefined,
      payGradeId: dto.payGradeId ? new Types.ObjectId(dto.payGradeId) : undefined,
    };

    const created = (await this.positionModel.create(toCreate)) as any;
    console.log('✓ Created position with payGradeId:', created.payGradeId);
    const afterSnapshot = typeof created?.toObject === 'function' ? created.toObject() : created;

    await this.changeLogModel.create({
      _id: new Types.ObjectId(),
      action: 'CREATED',
      entityType: 'Position',
      entityId: created._id,
      performedByEmployeeId: actorId ? new Types.ObjectId(actorId) : undefined,
      afterSnapshot,
      summary: `Position ${created.code} created${dto.payGradeId ? ` (payGradeId=${dto.payGradeId})` : ''}`,
    } as any);

    return created;
  }

  async findAll(filters: any = {}) {
    // filters will have isActive key only if explicitly filtering
    // If no isActive in filters, return all positions (both active and inactive)
    return this.positionModel.find(filters).lean().exec();
  }

  async findById(id: string) {
    const p = await this.positionModel.findById(id).exec();
    if (!p) throw new NotFoundException('Position not found');
    return p;
  }

  async update(id: string, dto: UpdatePositionDto, actorId?: string) {
    const before = (await this.positionModel.findById(id).lean().exec()) as any;
    if (!before) throw new NotFoundException('Position not found');

    // Validate payGradeId if provided
    if (dto.payGradeId) {
      await this.validatePayGrade(dto.payGradeId);
    }

    let updateData: any = { ...dto };
    
    if (dto.payGradeId) {
      updateData.payGradeId = new Types.ObjectId(dto.payGradeId);
    }
    
    if (dto.departmentId) {
      updateData.departmentId = new Types.ObjectId(dto.departmentId);
    }
    if (dto.reportsToPositionId) {
      updateData.reportsToPositionId = new Types.ObjectId(dto.reportsToPositionId);
    }

    const updated = (await this.positionModel.findByIdAndUpdate(id, updateData, { new: true }).exec()) as any;
    const afterSnapshot = typeof updated?.toObject === 'function' ? updated.toObject() : updated;

    await this.changeLogModel.create({
      _id: new Types.ObjectId(),
      action: 'UPDATED',
      entityType: 'Position',
      entityId: updated._id,
      performedByEmployeeId: actorId ? new Types.ObjectId(actorId) : undefined,
      beforeSnapshot: before,
      afterSnapshot,
      summary: `Position ${before.code} updated`,
    } as any);

    return updated;
  }

  async deactivate(id: string, actorId?: string) {
    const before = (await this.positionModel.findById(id).lean().exec()) as any;
    if (!before) throw new NotFoundException('Position not found');

    const activeAssignment = (await this.assignmentModel
      .findOne({ positionId: id, endDate: { $exists: false } })
      .lean()
      .exec()) as any;

    if (activeAssignment) {
      throw new BadRequestException('Position cannot be deactivated because an employee is assigned to it');
    }

    const updated = (await this.positionModel.findByIdAndUpdate(
      id,
      { isActive: false, closedAt: new Date() },
      { new: true },
    ).exec()) as any;

    const afterSnapshot = typeof updated?.toObject === 'function' ? updated.toObject() : updated;

    await this.changeLogModel.create({
      _id: new Types.ObjectId(),
      action: 'DEACTIVATED',
      entityType: 'Position',
      entityId: updated._id,
      performedByEmployeeId: actorId ? new Types.ObjectId(actorId) : undefined,
      beforeSnapshot: before,
      afterSnapshot,
      summary: `Position ${before.code} deactivated`,
    } as any);

    return updated;
  }

  async delete(id: string, actorId?: string) {
    const before = (await this.positionModel.findById(id).lean().exec()) as any;
    if (!before) throw new NotFoundException('Position not found');

    // Check for active assignments (BR 12, BR 37)
    const activeAssignment = (await this.assignmentModel
      .findOne({ positionId: id, endDate: { $exists: false } })
      .lean()
      .exec()) as any;

    if (activeAssignment) {
      throw new BadRequestException('Position cannot be deleted because an employee is assigned to it');
    }

    // Check for historical assignments (BR 12, BR 37 - positions with historical assignments can only be "delimited")
    const historicalAssignments = (await this.assignmentModel
      .findOne({ positionId: id, endDate: { $exists: true } })
      .lean()
      .exec()) as any;

    if (historicalAssignments) {
      throw new BadRequestException(
        'Position has historical assignments and can only be deactivated, not permanently deleted'
      );
    }

    // No assignments at all - safe to delete
    await this.positionModel.findByIdAndDelete(id).exec();

    await this.changeLogModel.create({
      _id: new Types.ObjectId(),
      action: 'DEACTIVATED',
      entityType: 'Position',
      entityId: new Types.ObjectId(id),
      performedByEmployeeId: actorId ? new Types.ObjectId(actorId) : undefined,
      beforeSnapshot: before,
      summary: `Position ${before.code} permanently deleted`,
    } as any);

    return { message: `Position ${before.code} has been permanently deleted` };
  }

  /**
   * Assign an employee to a position
   * Creates a PositionAssignment record and updates employee profile with position/department/supervisor info
   */
  async assignEmployeeToPosition(
    employeeProfileId: string | Types.ObjectId,
    positionId: string | Types.ObjectId,
    departmentId: string | Types.ObjectId,
    startDate: Date,
    changeRequestId?: string | Types.ObjectId,
    reason?: string,
    supervisorPositionId?: string | Types.ObjectId,
    endDate?: Date,
    payGrade?: string,
  ) {
    // Validate position exists
    const position = (await this.positionModel.findById(positionId).lean().exec()) as any;
    if (!position) {
      throw new NotFoundException('Position not found');
    }

    // Validate employee exists
    const employee = await this.employeeModel.findById(employeeProfileId).lean().exec();
    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    // Check for existing active assignments to this position
    const existingAssignment = (await this.assignmentModel
      .findOne({
        employeeProfileId: new Types.ObjectId(employeeProfileId),
        positionId: new Types.ObjectId(positionId),
        endDate: { $exists: false },
      })
      .lean()
      .exec()) as any;

    if (existingAssignment) {
      throw new BadRequestException(
        'Employee is already assigned to this position with an active assignment',
      );
    }

    // Create the assignment record
    const assignmentData: any = {
      _id: new Types.ObjectId(),
      employeeProfileId: new Types.ObjectId(employeeProfileId),
      positionId: new Types.ObjectId(positionId),
      departmentId: new Types.ObjectId(departmentId),
      startDate,
      reason: reason || 'Position assignment via change request',
    };

    console.log('assignEmployeeToPosition called with endDate:', endDate, 'Type:', typeof endDate);

    if (endDate) {
      console.log('Adding endDate to assignment:', endDate);
      assignmentData.endDate = endDate;
    } else {
      console.log('endDate is falsy, not adding to assignment');
    }

    if (changeRequestId) {
      assignmentData.changeRequestId = new Types.ObjectId(changeRequestId);
    }

    console.log('Final assignmentData:', assignmentData);
    const assignment = await this.assignmentModel.create(assignmentData);

    // Update employee profile with new position, department, and supervisor info
    const updateData: any = {
      primaryPositionId: new Types.ObjectId(positionId),
      primaryDepartmentId: new Types.ObjectId(departmentId),
    };

    if (supervisorPositionId) {
      updateData.supervisorPositionId = new Types.ObjectId(supervisorPositionId);
    }

    // Set payGradeId from position or parameter (BR 10 requirement)
    const payGradeIdToUse = payGrade || position.payGradeId;
    if (payGradeIdToUse) {
      console.log('✓ Setting payGradeId on employee:', payGradeIdToUse);
      updateData.payGradeId = new Types.ObjectId(payGradeIdToUse);
    } else {
      console.warn('No payGradeId provided or found on position');
    }

    console.log('Updating employee with updateData:', updateData);
    const updatedEmployee = await this.employeeModel.findByIdAndUpdate(employeeProfileId, updateData, { new: true }).exec();
    console.log('Updated employee:', updatedEmployee);

    return assignment;
  }

  /**
   * End an employee's assignment to a position
   * Updates the PositionAssignment record with an endDate
   */
  async endEmployeeAssignment(
    employeeProfileId: string | Types.ObjectId,
    positionId: string | Types.ObjectId,
    endDate: Date = new Date(),
  ) {
    const assignment = await this.assignmentModel.findOneAndUpdate(
      {
        employeeProfileId: new Types.ObjectId(employeeProfileId),
        positionId: new Types.ObjectId(positionId),
        endDate: { $exists: false },
      },
      { endDate },
      { new: true },
    );

    if (!assignment) {
      throw new NotFoundException('Active assignment not found for this employee and position');
    }

    return assignment;
  }
}

// ============================================================================
// CHANGE REQUEST SERVICE
// ============================================================================
@Injectable()
export class ChangeRequestService {
  constructor(
    @InjectModel(StructureChangeRequest.name) private requestModel: Model<any>,
    @InjectModel(StructureApproval.name) private approvalModel: Model<any>,
    @InjectModel(StructureChangeLog.name) private changeLogModel: Model<any>,
    @InjectModel(PositionAssignment.name) private assignmentModel: Model<any>,
    @InjectModel(Department.name) private deptModel: Model<any>,
    @InjectModel(Position.name) private posModel: Model<any>,
    @InjectModel(NotificationLog.name) private notificationModel: Model<any>,
    @InjectModel(EmployeeProfile.name) private employeeModel: Model<any>,
    @InjectModel(payGrade.name) private payGradeModel: Model<any>,
    private readonly positionService: PositionService,
  ) {}

  private async findRequest(requestId: string) {
    try {
      const req = await this.requestModel.findOne({ _id: new Types.ObjectId(requestId) }).exec();
      if (req) return req;
    } catch (e) {}
    const req = await this.requestModel.findOne({ _id: requestId }).exec();
    return req;
  }

  async create(dto: CreateChangeRequestDto, requestedByEmployeeId: string) {
    const number = `REQ-${Date.now()}`;
    
    let detailsToStore = dto.details || '';
    if (dto.payload) {
      detailsToStore = JSON.stringify({
        userDetails: dto.details || '',
        payload: dto.payload,
      });
    }
    
    const created = await this.requestModel.create({
      _id: new Types.ObjectId(),
      requestNumber: number,
      requestedByEmployeeId: new Types.ObjectId(requestedByEmployeeId),
      requestType: dto.requestType,
      targetDepartmentId: dto.targetDepartmentId,
      targetPositionId: dto.targetPositionId,
      details: detailsToStore,
      reason: dto.reason,
      status: 'DRAFT',
    } as any);

    await this.changeLogModel.create({
      _id: new Types.ObjectId(),
      action: 'CREATED',
      entityType: 'StructureChangeRequest',
      entityId: created._id,
      performedByEmployeeId: new Types.ObjectId(requestedByEmployeeId),
      afterSnapshot: typeof created?.toObject === 'function' ? created.toObject() : created,
      summary: `Change request ${number} created by ${requestedByEmployeeId}`,
    } as any);

    try {
      await this.notificationModel.create({
        to: new Types.ObjectId(requestedByEmployeeId),
        type: 'CHANGE_REQUEST_CREATED',
        message: `Your change request ${number} has been created and is in DRAFT status.`,
      } as any);
    } catch (err) {
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'CREATED',
        entityType: 'StructureChangeRequest',
        entityId: created._id,
        performedByEmployeeId: new Types.ObjectId(requestedByEmployeeId),
        afterSnapshot: { error: String(err) },
        summary: `Failed to write notification log for request ${number}`,
      } as any);
    }

    const sysAdminId = process.env.SYSTEM_ADMIN_ID;
    if (sysAdminId) {
      try {
        await this.notificationModel.create({
          to: new Types.ObjectId(sysAdminId),
          type: 'CHANGE_REQUEST_REQUIRES_APPROVAL',
          message: `Change request ${number} created by ${requestedByEmployeeId}. Please review.`,
        } as any);
      } catch (err) {
        await this.changeLogModel.create({
          _id: new Types.ObjectId(),
          action: 'CREATED',
          entityType: 'StructureChangeRequest',
          entityId: created._id,
          performedByEmployeeId: new Types.ObjectId(requestedByEmployeeId),
          afterSnapshot: { error: String(err) },
          summary: `Failed to write system-admin notification for request ${number}`,
        } as any);
      }
    }

    return created;
  }

  async submit(requestId: string, submittedByEmployeeId: string) {
    const req = await this.findRequest(requestId);
    if (!req) throw new NotFoundException('Change request not found');
    if (req.status !== 'DRAFT') throw new BadRequestException('Only DRAFT requests can be submitted');

    req.status = 'SUBMITTED';
    req.submittedByEmployeeId = new Types.ObjectId(submittedByEmployeeId);
    req.submittedAt = new Date();
    await req.save();

    await this.changeLogModel.create({
      _id: new Types.ObjectId(),
      action: 'UPDATED',
      entityType: 'StructureChangeRequest',
      entityId: req._id,
      performedByEmployeeId: new Types.ObjectId(submittedByEmployeeId),
      afterSnapshot: typeof req?.toObject === 'function' ? req.toObject() : req,
      summary: `Change request ${req.requestNumber} submitted by ${submittedByEmployeeId}`,
    } as any);

    return req;
  }

  async approve(requestId: string, approverEmployeeId: string, decision = 'APPROVED', comments?: string) {
    const req = await this.findRequest(requestId);
    if (!req) throw new NotFoundException('Change request not found');
    if (req.status !== 'SUBMITTED') throw new BadRequestException('Only SUBMITTED requests can be approved');

    await this.approvalModel.create({
      _id: new Types.ObjectId(),
      changeRequestId: req._id,
      approverEmployeeId: new Types.ObjectId(approverEmployeeId),
      decision,
      comments,
      decidedAt: new Date(),
    } as any);

    const rt = String(req.requestType).toUpperCase();

    let payload: any = null;
    let userDetails = req.details || '';
    if (req.details) {
      try {
        const parsed = JSON.parse(req.details);
        if (parsed && typeof parsed === 'object' && 'payload' in parsed) {
          payload = parsed.payload;
          userDetails = parsed.userDetails || '';
        }
      } catch (e) {
        userDetails = req.details;
      }
    }

    const isDeptCreate = rt.includes('NEW') && rt.includes('DEPT') || rt === 'NEW_DEPARTMENT';
    const isDeptUpdate = rt.includes('UPDATE') && rt.includes('DEPT') || rt === 'UPDATE_DEPARTMENT';
    const isDeptDeactivate = (rt.includes('DEACTIVATE') || rt.includes('CLOSE')) && rt.includes('DEPT');
    const isPosCreate = rt.includes('NEW') && rt.includes('POS') || rt === 'NEW_POSITION';
    const isPosUpdate = rt.includes('UPDATE') && rt.includes('POS') || rt === 'UPDATE_POSITION';
    const isPosDeactivate = (rt.includes('DEACTIVATE') || rt.includes('CLOSE')) && rt.includes('POS') || rt === 'CLOSE_POSITION';

    if (isDeptCreate && !payload) {
      throw new BadRequestException('Payload with department data (code, name, description) is required for NEW_DEPARTMENT requests');
    }
    if (isDeptUpdate && (!req.targetDepartmentId || !payload)) {
      throw new BadRequestException('targetDepartmentId and payload are required for UPDATE_DEPARTMENT requests');
    }
    if (isDeptDeactivate && !req.targetDepartmentId) {
      throw new BadRequestException('targetDepartmentId is required for deactivating a department');
    }
    if (isPosCreate && !payload) {
      throw new BadRequestException('Payload with position data (title, departmentId, payGradeId) is required for NEW_POSITION requests');
    }
    if (isPosUpdate && (!req.targetPositionId || !payload)) {
      throw new BadRequestException('targetPositionId and payload are required for UPDATE_POSITION requests');
    }
    if (isPosDeactivate && !req.targetPositionId) {
      throw new BadRequestException('targetPositionId is required for CLOSE_POSITION requests');
    }

    if (isDeptCreate) {
      const deptData = { ...payload };
      if (payload.headPositionId) {
        deptData.headPositionId = new Types.ObjectId(payload.headPositionId);
      }
      const created = await this.deptModel.create(deptData);
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'CREATED',
        entityType: 'Department',
        entityId: created._id,
        afterSnapshot: typeof created.toObject === 'function' ? created.toObject() : created,
        summary: `Applied change-request ${req.requestNumber} (create dept)`,
      } as any);

    } else if (isDeptUpdate) {
      const before = (await this.deptModel.findById(req.targetDepartmentId).lean().exec()) as any;
      if (!before) throw new NotFoundException('Target department not found');
      const deptUpdateData = { ...payload };
      if (payload.headPositionId) {
        deptUpdateData.headPositionId = new Types.ObjectId(payload.headPositionId);
      }
      const updated = (await this.deptModel.findByIdAndUpdate(req.targetDepartmentId, deptUpdateData, { new: true }).exec()) as any;
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'UPDATED',
        entityType: 'Department',
        entityId: updated._id,
        beforeSnapshot: before,
        afterSnapshot: typeof updated.toObject === 'function' ? updated.toObject() : updated,
        summary: `Applied change-request ${req.requestNumber} (update dept)`,
      } as any);

    } else if (isDeptDeactivate) {
      const before = (await this.deptModel.findById(req.targetDepartmentId).lean().exec()) as any;
      if (!before) throw new NotFoundException('Target department not found');
      await this.deptModel.findByIdAndUpdate(req.targetDepartmentId, { isActive: false, closedAt: new Date() }).exec();
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'DEACTIVATED',
        entityType: 'Department',
        entityId: req.targetDepartmentId,
        beforeSnapshot: before,
        afterSnapshot: { ...before, isActive: false },
        summary: `Applied change-request ${req.requestNumber} (deactivate dept)`,
      } as any);

    } else if (isPosCreate) {
      // Use positionService.create() to properly resolve payGrade
      const created = await this.positionService.create(payload, approverEmployeeId);
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'CREATED',
        entityType: 'Position',
        entityId: created._id,
        afterSnapshot: typeof created.toObject === 'function' ? created.toObject() : created,
        summary: `Applied change-request ${req.requestNumber} (create position)`,
      } as any);

      // If payload contains employeeId and startDate, create position assignment
      if (payload.employeeId && payload.startDate) {
        try {
          const endDateValue = payload.endDate ? new Date(payload.endDate) : undefined;
          console.log('Creating assignment with:', {
            employeeId: payload.employeeId,
            positionId: created._id,
            departmentId: payload.departmentId,
            startDate: new Date(payload.startDate),
            changeRequestId: req._id,
            supervisorPositionId: payload.supervisorPositionId,
            endDate: endDateValue,
            endDateRaw: payload.endDate,
          });
          await this.positionService.assignEmployeeToPosition(
            payload.employeeId,
            created._id,
            payload.departmentId,
            new Date(payload.startDate),
            req._id,
            `Assigned via change request ${req.requestNumber}`,
            payload.supervisorPositionId,
            endDateValue,
            payload.payGradeId || created.payGradeId,
          );
        } catch (assignmentError) {
          console.error('Could not create position assignment:', assignmentError.message);
          console.error('Full error:', assignmentError);
          // Continue without failing - position was created successfully
        }
      }

    } else if (isPosUpdate) {
      const before = (await this.posModel.findById(req.targetPositionId).lean().exec()) as any;
      if (!before) throw new NotFoundException('Target position not found');
      const posUpdateData = { ...payload };
      if (payload.departmentId) {
        posUpdateData.departmentId = new Types.ObjectId(payload.departmentId);
      }
      if (payload.reportsToPositionId) {
        posUpdateData.reportsToPositionId = new Types.ObjectId(payload.reportsToPositionId);
      }
      const updated = (await this.posModel.findByIdAndUpdate(req.targetPositionId, posUpdateData, { new: true }).exec()) as any;
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'UPDATED',
        entityType: 'Position',
        entityId: updated._id,
        beforeSnapshot: before,
        afterSnapshot: typeof updated.toObject === 'function' ? updated.toObject() : updated,
        summary: `Applied change-request ${req.requestNumber} (update position)`,
      } as any);

      // If payload contains employeeId and startDate, handle employee reassignment
      if (payload.employeeId && payload.startDate) {
        try {
          // Find and end any active assignment for this position
          const oldAssignment = (await this.assignmentModel
            .findOne({
              positionId: new Types.ObjectId(req.targetPositionId),
              endDate: { $exists: false },
            })
            .exec()) as any;

          if (oldAssignment && oldAssignment.employeeProfileId) {
            // End the old assignment
            oldAssignment.endDate = new Date(payload.startDate);
            await oldAssignment.save();

            // Clear the old employee's position, department, supervisor, and payGrade
            await this.employeeModel.findByIdAndUpdate(
              oldAssignment.employeeProfileId,
              {
                $unset: {
                  primaryPositionId: 1,
                  primaryDepartmentId: 1,
                  supervisorPositionId: 1,
                  payGradeId: 1,
                },
              }
            ).exec();
          }

          // Now assign the new employee
          const endDateValue = payload.endDate ? new Date(payload.endDate) : undefined;
          console.log('Creating assignment with (UPDATE):', {
            employeeId: payload.employeeId,
            positionId: req.targetPositionId,
            departmentId: payload.departmentId || before.departmentId,
            startDate: new Date(payload.startDate),
            changeRequestId: req._id,
            supervisorPositionId: payload.supervisorPositionId,
            endDate: endDateValue,
            endDateRaw: payload.endDate,
          });
          await this.positionService.assignEmployeeToPosition(
            payload.employeeId,
            req.targetPositionId,
            payload.departmentId || before.departmentId,
            new Date(payload.startDate),
            req._id,
            `Assigned via change request ${req.requestNumber}`,
            payload.supervisorPositionId,
            endDateValue,
            payload.payGradeId || updated.payGradeId,
          );
        } catch (assignmentError) {
          console.error('Could not create position assignment:', assignmentError.message);
          console.error('Full error:', assignmentError);
          // Continue without failing - position was updated successfully
        }
      }

    } else if (isPosDeactivate) {
      const before = (await this.posModel.findById(req.targetPositionId).lean().exec()) as any;
      if (!before) throw new NotFoundException('Target position not found');

      const activeAssignment = (await this.posModel.db
        .collection('position_assignments')
        .findOne({ positionId: req.targetPositionId, endDate: { $exists: false } })) as any;

      if (activeAssignment) {
        throw new BadRequestException('Position cannot be deactivated because an employee is currently assigned to it (BR 12).');
      }

      const updated = (await this.posModel.findByIdAndUpdate(req.targetPositionId, { isActive: false, closedAt: new Date() }, { new: true }).exec()) as any;
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'DEACTIVATED',
        entityType: 'Position',
        entityId: updated._id,
        beforeSnapshot: before,
        afterSnapshot: typeof updated.toObject === 'function' ? updated.toObject() : updated,
        summary: `Applied change-request ${req.requestNumber} (deactivate position)`,
      } as any);

    } else {
      throw new BadRequestException(`Unsupported requestType: ${req.requestType}. Supported types: NEW_DEPARTMENT, UPDATE_DEPARTMENT, NEW_POSITION, UPDATE_POSITION, CLOSE_POSITION`);
    }

    req.status = 'APPROVED';
    await req.save();

    try {
      await this.notificationModel.create({
        to: req.requestedByEmployeeId,
        type: 'CHANGE_REQUEST_APPROVED',
        message: `Your change request ${req.requestNumber} was approved by ${approverEmployeeId}.`,
      } as any);
    } catch (err) {
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'UPDATED',
        entityType: 'StructureChangeRequest',
        entityId: req._id,
        performedByEmployeeId: new Types.ObjectId(approverEmployeeId),
        afterSnapshot: { error: String(err) },
        summary: `Failed to write approval notification for request ${req.requestNumber}`,
      } as any);
    }

    return req;
  }

  async reject(requestId: string, approverEmployeeId: string, comments?: string) {
    const req = await this.findRequest(requestId);
    if (!req) throw new NotFoundException('Change request not found');
    if (req.status !== 'SUBMITTED') throw new BadRequestException('Only SUBMITTED requests can be rejected');

    await this.approvalModel.create({
      _id: new Types.ObjectId(),
      changeRequestId: req._id,
      approverEmployeeId: new Types.ObjectId(approverEmployeeId),
      decision: 'REJECTED',
      comments,
      decidedAt: new Date(),
    } as any);

    req.status = 'REJECTED';
    await req.save();

    try {
      await this.notificationModel.create({
        to: req.requestedByEmployeeId,
        type: 'CHANGE_REQUEST_REJECTED',
        message: `Your change request ${req.requestNumber} was rejected by ${approverEmployeeId}.`,
      } as any);
    } catch (err) {
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'UPDATED',
        entityType: 'StructureChangeRequest',
        entityId: req._id,
        performedByEmployeeId: new Types.ObjectId(approverEmployeeId),
        afterSnapshot: { error: String(err) },
        summary: `Failed to write rejection notification for request ${req.requestNumber}`,
      } as any);
    }

    return req;
  }

  async list(filters: any = {}) {
    return this.requestModel.find(filters).lean().exec();
  }

  async getUserRequests(employeeId: string, filters: any = {}) {
    const employeeObjectId = new Types.ObjectId(employeeId);
    const query = {
      $or: [
        { requestedByEmployeeId: employeeObjectId },
        { submittedByEmployeeId: employeeObjectId },
      ],
      ...filters,
    };
    return this.requestModel.find(query).sort({ createdAt: -1 }).lean().exec();
  }

  async delete(requestId: string, deletedByEmployeeId: string, isAdmin: boolean = false) {
    const req = await this.findRequest(requestId);
    if (!req) throw new NotFoundException('Change request not found');

    // Only DRAFT and SUBMITTED requests can be deleted
    if (req.status !== 'DRAFT' && req.status !== 'SUBMITTED') {
      throw new BadRequestException('Only DRAFT or SUBMITTED requests can be deleted');
    }

    const userObjectId = new Types.ObjectId(deletedByEmployeeId);
    
    // If not admin, user can only delete their own requests
    if (!isAdmin && !req.requestedByEmployeeId.equals(userObjectId)) {
      throw new ForbiddenException('You can only delete your own requests');
    }

    await this.requestModel.deleteOne({ _id: req._id }).exec();
    return { message: 'Change request deleted successfully' };
  }

  async findOne(requestId: string) {
    const req = await this.findRequest(requestId);
    if (!req) throw new NotFoundException('Change request not found');
    return req;
  }

  async getPositionAssignments(limit = 50, skip = 0) {
    const assignments = await this.assignmentModel
      .find()
      .populate('employeeProfileId', 'firstName lastName email')
      .populate('positionId', 'title code')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
    return assignments;
  }

  async getStructureApprovals(limit = 50, skip = 0) {
    const approvals = await this.approvalModel
      .find()
      .populate('changeRequestId', 'requestNumber status requestType')
      .populate('approverEmployeeId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
    return approvals;
  }

  async getStructureChangeLogs(limit = 50, skip = 0) {
    const logs = await this.changeLogModel
      .find()
      .populate('performedByEmployeeId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
    return logs;
  }

  async searchEmployeeByNumber(employeeNumber: string) {
    const employees = await this.employeeModel
      .find({
        $or: [
          { employeeNumber: { $regex: employeeNumber, $options: 'i' } },
          { firstName: { $regex: employeeNumber, $options: 'i' } },
          { lastName: { $regex: employeeNumber, $options: 'i' } },
        ],
      })
      .select('_id employeeNumber firstName lastName workEmail primaryPositionId primaryDepartmentId')
      .limit(10)
      .exec();
    return employees;
  }

  async getAllPayGrades() {
    return this.payGradeModel.find().exec();
  }
}