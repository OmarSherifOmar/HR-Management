import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Department } from '../models/department.schema';
import { StructureChangeLog } from '../models/structure-change-log.schema';
import { PositionAssignment } from '../models/position-assignment.schema';
import { CreateDepartmentDto } from '../dtos/create-department.dto';
import { UpdateDepartmentDto } from '../dtos/update-department.dto';

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

    const created = (await this.deptModel.create(createDto as any)) as any;
    const afterSnapshot = typeof created?.toObject === 'function' ? created.toObject() : created;

    await this.changeLogModel.create({
      action: 'CREATE',
      entityType: 'Department',
      entityId: created._id,
      performedByEmployeeId: actorId ? new Types.ObjectId(actorId) : undefined,
      afterSnapshot,
      summary: `Department ${afterSnapshot?.code ?? created.code ?? '<unknown>'} created`,
    } as any);
    return created;
  }

  async findAll(activeOnly = true) {
    const filter: any = {};
    if (activeOnly) filter.isActive = true;
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

    const updated = (await this.deptModel.findByIdAndUpdate(id, dto, { new: true }).exec()) as any;
    const afterSnapshot = typeof updated?.toObject === 'function' ? updated.toObject() : updated;

    await this.changeLogModel.create({
      action: 'UPDATE',
      entityType: 'Department',
      entityId: updated._id,
      performedByEmployeeId: actorId ? new Types.ObjectId(actorId) : undefined,
      beforeSnapshot: before,
      afterSnapshot,
      summary: `Department ${before?.code ?? String(id)} updated`,
    } as any);
    return updated;
  }

  // Pre-deactivate check: returns related active assignments/positions
  async FindActive(id: string) {
    const assignments = (await this.assignmentModel
      .find({ departmentId: id, endDate: { $exists: false } })
      .lean()
      .exec()) as any[];
    return { activeAssignmentsCount: assignments.length, assignmentsSample: assignments.slice(0, 10) };
  }

  async deactivate(id: string, actorId?: string) {
    const before = (await this.deptModel.findById(id).lean().exec()) as any;
    if (!before) throw new NotFoundException('Department not found');

    // check if active assignments exist
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
      action: 'DEACTIVATE',
      entityType: 'Department',
      entityId: updated._id,
      performedByEmployeeId: actorId ? new Types.ObjectId(actorId) : undefined,
      beforeSnapshot: before,
      afterSnapshot,
      summary: `Department ${before?.code ?? String(id)} deactivated`,
    } as any);
    return updated;
  }
}
