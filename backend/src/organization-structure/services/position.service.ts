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

@Injectable()
export class PositionService {
  constructor(
    @InjectModel(Position.name) private positionModel: Model<any>,
    @InjectModel(StructureChangeLog.name) private changeLogModel: Model<any>,
    @InjectModel(PositionAssignment.name) private assignmentModel: Model<any>,
    @InjectModel(payGrade.name) private payGradeModel: Model<any>,
  ) {}

  // Resolve payGrade by grade string only (no payGradeId)
  private async resolvePayGrade(dto: CreatePositionDto | UpdatePositionDto) {
    if (!dto.payGrade) return null;

    // cast to any to satisfy TS about the returned shape
    const pg = (await this.payGradeModel.findOne({ grade: dto.payGrade }).lean().exec()) as any;
    if (!pg || pg.status !== ConfigStatus.APPROVED) {
      throw new BadRequestException('payGrade (grade string) not found or not approved');
    }
    return pg;
  }

  async create(dto: CreatePositionDto, actorId?: string) {
    const resolvedPG = (await this.resolvePayGrade(dto)) as any;

    if (!resolvedPG) {
      throw new BadRequestException('You must provide payGrade (grade string).');
    }

    const existing = (await this.positionModel.findOne({ code: dto.code }).lean().exec()) as any;
    if (existing) throw new BadRequestException('Position code already exists');

    const toCreate: any = {
      ...dto,
      // keep payGrade string on the position (model expects string)
      payGrade: resolvedPG.grade,
      // snapshot for immediate salary access
      payGradeSnapshot: {
        grade: resolvedPG.grade,
        baseSalary: resolvedPG.baseSalary,
        grossSalary: resolvedPG.grossSalary,
      },
    };

    const created = (await this.positionModel.create(toCreate)) as any;
    const afterSnapshot = typeof created?.toObject === 'function' ? created.toObject() : created;

    await this.changeLogModel.create({
      _id: new Types.ObjectId(),
      action: 'CREATED',
      entityType: 'Position',
      entityId: created._id,
      performedByEmployeeId: actorId ? new Types.ObjectId(actorId) : undefined,
      afterSnapshot,
      summary: `Position ${created.code} created (payGrade=${(resolvedPG as any).grade})`,
    } as any);

    return created;
  }

  async findAll(filters: any = {}) {
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

    // If payGrade string provided, resolve and update snapshot and the payGrade string
    if (dto.payGrade) {
      const resolved = (await this.resolvePayGrade(dto)) as any;
      if (!resolved) {
        throw new BadRequestException('payGrade not found or not approved');
      }

      dto.payGrade = resolved.grade;
      (dto as any).payGradeSnapshot = {
        grade: resolved.grade,
        baseSalary: resolved.baseSalary,
        grossSalary: resolved.grossSalary,
      };
    }

    const updated = (await this.positionModel.findByIdAndUpdate(id, dto as any, { new: true }).exec()) as any;
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

    // Check if active assignments exist
    const activeAssignment = (await this.assignmentModel
      .findOne({ positionId: id, endDate: { $exists: false } })
      .lean()
      .exec()) as any;

    if (activeAssignment) {
      throw new BadRequestException('Position cannot be deleted because an employee is assigned to it');
    }

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
}
