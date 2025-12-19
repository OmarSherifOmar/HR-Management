import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Position } from '../models/position.schema';
import { StructureChangeLog } from '../models/structure-change-log.schema';
import { PositionAssignment } from '../models/position-assignment.schema';
import { CreatePositionDto } from '../dtos/create-position.dto';
import { UpdatePositionDto } from '../dtos/update-position.dto';
import { payGrade } from '../../payroll-configuration/./models/payGrades.schema';
import { ConfigStatus } from '../../payroll-configuration/./enums/payroll-configuration-enums';
import { EmployeeProfile } from '../../employee-profile/models/employee-profile.schema';

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
