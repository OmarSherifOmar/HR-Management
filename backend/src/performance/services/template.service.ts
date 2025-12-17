import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppraisalTemplate } from '../models/appraisal-template.schema';
import { AppraisalCycle } from '../models/appraisal-cycle.schema';
import { AppraisalCycleStatus } from '../enums/performance.enums';
import { CreateTemplateDto, UpdateTemplateDto } from '../dtos/create-template.dto';
import { NotificationLog } from '../../time-management/models/notification-log.schema';

@Injectable()
export class TemplateService {
  constructor(
    @InjectModel(AppraisalTemplate.name) private templateModel: Model<any>,
    @InjectModel(AppraisalCycle.name) private cycleModel: Model<any>,
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

  async create(dto: CreateTemplateDto, actorId?: string) {
    try {
      const existing = await this.templateModel.findOne({ name: dto.name }).lean().exec() as any;
      if (existing) throw new BadRequestException('Template with this name already exists');

      const toCreate: any = {
        name: dto.name,
        description: dto.description,
        templateType: dto.templateType,
        ratingScale: dto.ratingScale,
        criteria: dto.criteria || [],
        instructions: dto.instructions,
        applicableDepartmentIds: this.validateObjectIds('applicableDepartmentIds', dto.applicableDepartmentIds),
        applicablePositionIds: this.validateObjectIds('applicablePositionIds', dto.applicablePositionIds),
        isActive: true,
      };

      const created = await this.templateModel.create(toCreate);
      console.log('Template created successfully:', created._id);

      if (actorId) {
        try {
          await this.notificationModel.create({
            to: new Types.ObjectId(actorId),
            type: 'TEMPLATE_CREATED',
            message: `Appraisal template "${dto.name}" created`,
          } as any);
        } catch (notifErr) {
          console.warn('Failed to create notification:', notifErr);
          // Don't throw, just warn
        }
      }

      return created;
    } catch (error) {
      console.error('Template creation failed:', error);
      throw error;
    }
  }

  async findAll(filters: any = {}) {
    const query: any = {};
    if (filters.templateType) query.templateType = filters.templateType;
    if (filters.isActive !== undefined) query.isActive = filters.isActive === 'true' || filters.isActive === true;
    if (filters.departmentId) {
      if (!Types.ObjectId.isValid(filters.departmentId)) throw new BadRequestException('filters.departmentId is not a valid ObjectId');
      query.applicableDepartmentIds = new Types.ObjectId(filters.departmentId);
    }
    return this.templateModel.find(query).lean().exec();
  }

  async findById(id: string) {
    const template = await this.templateModel.findById(id).lean().exec();
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async update(id: string, dto: UpdateTemplateDto, actorId?: string) {
    const before = await this.templateModel.findById(id).lean().exec() as any;
    if (!before) throw new NotFoundException('Template not found');

    const updateData: any = { ...dto };
    if (dto.applicableDepartmentIds) {
      updateData.applicableDepartmentIds = this.validateObjectIds('applicableDepartmentIds', dto.applicableDepartmentIds);
    }
    if (dto.applicablePositionIds) {
      updateData.applicablePositionIds = this.validateObjectIds('applicablePositionIds', dto.applicablePositionIds);
    }

    const updated = await this.templateModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

    if (actorId) {
      await this.notificationModel.create({
        to: new Types.ObjectId(actorId),
        type: 'TEMPLATE_UPDATED',
        message: `Appraisal template "${before.name}" updated`,
      } as any);
    }

    return updated;
  }

  async deactivate(id: string, actorId?: string) {
    const template = await this.templateModel.findById(id).lean().exec() as any;
    if (!template) throw new NotFoundException('Template not found');

    const activeCycle = await this.cycleModel.findOne({
      'templateAssignments.templateId': new Types.ObjectId(id),
      status: { $in: [AppraisalCycleStatus.PLANNED, AppraisalCycleStatus.ACTIVE] },
    }).lean().exec();

    if (activeCycle) {
      throw new BadRequestException('Cannot deactivate template used in active/planned cycles');
    }

    const updated = await this.templateModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec();

    if (actorId) {
      await this.notificationModel.create({
        to: new Types.ObjectId(actorId),
        type: 'TEMPLATE_DEACTIVATED',
        message: `Appraisal template "${template.name}" deactivated`,
      } as any);
    }

    return updated;
  }
}
