import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppraisalCycle } from '../models/appraisal-cycle.schema';
import { AppraisalAssignment } from '../models/appraisal-assignment.schema';
import { AppraisalCycleStatus } from '../enums/performance.enums';
import { CreateCycleDto, UpdateCycleDto } from '../dtos/create-cycle.dto';
import { NotificationLog } from '../../time-management/models/notification-log.schema';

@Injectable()
export class CycleService {
  constructor(
    @InjectModel(AppraisalCycle.name) private cycleModel: Model<any>,
    @InjectModel(AppraisalAssignment.name) private assignmentModel: Model<any>,
    @InjectModel(NotificationLog.name) private notificationModel: Model<any>,
  ) {}

  private validateObjectIds(fieldName: string, ids?: string[]) {
    if (!ids || ids.length === 0) return [];
    const invalid = ids.filter(id => !Types.ObjectId.isValid(id));
    if (invalid.length) {
      throw new BadRequestException(`${fieldName} contains invalid ObjectIds: ${invalid.join(', ')}`);
    }
    return ids.map(id => new Types.ObjectId(id));
  }

  async create(dto: CreateCycleDto, actorId?: string) {
    const existing = await this.cycleModel.findOne({ name: dto.name }).lean().exec() as any;
    if (existing) throw new BadRequestException('Cycle with this name already exists');

    const templateAssignments = (dto.templateAssignments || []).map((ta: any) => ({
      templateId: !ta.templateId || !Types.ObjectId.isValid(ta.templateId) ? undefined : new Types.ObjectId(ta.templateId),
      departmentIds: this.validateObjectIds('templateAssignments.departmentIds', ta.departmentIds),
    }));

    const toCreate: any = {
      _id: new Types.ObjectId(),
      name: dto.name,
      description: dto.description,
      cycleType: dto.cycleType,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      managerDueDate: dto.managerDueDate ? new Date(dto.managerDueDate) : undefined,
      employeeAcknowledgementDueDate: dto.employeeAcknowledgementDueDate ? new Date(dto.employeeAcknowledgementDueDate) : undefined,
      templateAssignments,
      status: AppraisalCycleStatus.PLANNED,
    };

    const created = await this.cycleModel.create(toCreate);

    if (actorId) {
      await this.notificationModel.create({
        to: new Types.ObjectId(actorId),
        type: 'CYCLE_CREATED',
        message: `Appraisal cycle "${dto.name}" created (${dto.startDate} - ${dto.endDate})`,
      } as any);
    }

    return created;
  }

  async findAll(filters: any = {}) {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.cycleType) query.cycleType = filters.cycleType;
    return this.cycleModel.find(query).sort({ startDate: -1 }).lean().exec();
  }

  async findById(id: string) {
    const cycle = await this.cycleModel.findById(id).lean().exec();
    if (!cycle) throw new NotFoundException('Cycle not found');
    return cycle;
  }

  async update(id: string, dto: UpdateCycleDto, actorId?: string) {
    const before = await this.cycleModel.findById(id).lean().exec() as any;
    if (!before) throw new NotFoundException('Cycle not found');

    if (before.status === AppraisalCycleStatus.CLOSED || before.status === AppraisalCycleStatus.ARCHIVED) {
      throw new BadRequestException('Cannot update closed/archived cycles');
    }

    const updateData: any = { ...dto };
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);
    if (dto.managerDueDate) updateData.managerDueDate = new Date(dto.managerDueDate);
    if (dto.employeeAcknowledgementDueDate) updateData.employeeAcknowledgementDueDate = new Date(dto.employeeAcknowledgementDueDate);
    if (dto.templateAssignments) {
      updateData.templateAssignments = dto.templateAssignments.map((ta: any) => ({
        templateId: !ta.templateId || !Types.ObjectId.isValid(ta.templateId) ? undefined : new Types.ObjectId(ta.templateId),
        departmentIds: this.validateObjectIds('templateAssignments.departmentIds', ta.departmentIds),
      }));
    }

    const updated = await this.cycleModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

    if (actorId) {
      await this.notificationModel.create({
        to: new Types.ObjectId(actorId),
        type: 'CYCLE_UPDATED',
        message: `Appraisal cycle "${before.name}" updated`,
      } as any);
    }

    return updated;
  }

  async activate(id: string, actorId?: string) {
    const cycle = await this.cycleModel.findById(id).exec();
    if (!cycle) throw new NotFoundException('Cycle not found');

    if ((cycle as any).status !== AppraisalCycleStatus.PLANNED) {
      throw new BadRequestException('Only PLANNED cycles can be activated');
    }

    (cycle as any).status = AppraisalCycleStatus.ACTIVE;
    await cycle.save();

    // Notify all assigned managers (BR 11)
    const assignments = await this.assignmentModel.find({ cycleId: new Types.ObjectId(id) }).lean().exec() as any[];
    const managerIds = [...new Set(assignments.map(a => a.managerProfileId?.toString()))];

    for (const managerId of managerIds) {
      await this.notificationModel.create({
        to: new Types.ObjectId(managerId),
        type: 'CYCLE_ACTIVATED',
        message: `Appraisal cycle "${(cycle as any).name}" is now active. Please complete assigned appraisals.`,
      } as any);
    }

    return cycle;
  }

  async close(id: string, actorId?: string) {
    const cycle = await this.cycleModel.findById(id).exec();
    if (!cycle) throw new NotFoundException('Cycle not found');

    if ((cycle as any).status !== AppraisalCycleStatus.ACTIVE) {
      throw new BadRequestException('Only ACTIVE cycles can be closed');
    }

    (cycle as any).status = AppraisalCycleStatus.CLOSED;
    (cycle as any).closedAt = new Date();
    await cycle.save();

    if (actorId) {
      await this.notificationModel.create({
        to: new Types.ObjectId(actorId),
        type: 'CYCLE_CLOSED',
        message: `Appraisal cycle "${(cycle as any).name}" has been closed`,
      } as any);
    }

    return cycle;
  }
}
