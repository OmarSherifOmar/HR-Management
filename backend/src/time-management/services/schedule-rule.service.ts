import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScheduleRule, ScheduleRuleDocument } from '../models/schedule-rule.schema';
import { CreateScheduleRuleDto } from '../dtos/schedule-rule/create-schedule-rule.dto';
import { UpdateScheduleRuleDto } from '../dtos/schedule-rule/update-schedule-rule.dto';

/**
 * Schedule Rule Service
 * Implements FR-TM-03: Custom Scheduling Rules
 * 
 * Business Rules:
 * - BR-TM-04: Support multiple shift names (Fixed Core Hours, Flex-Time, Rotational, Split, Custom Weekly Patterns, Overtime)
 * - BR-TM-10: Define flexible and custom scheduling rules
 * 
 * Examples of patterns:
 * - "flex-in-out" - Flexible start/end times
 * - "4on-3off" - 4 days on, 3 days off
 * - "rotational-weekly" - Weekly rotation
 * - "compressed-week" - Compressed work week
 * - "custom-pattern:MTWRF" - Monday to Friday
 */
@Injectable()
export class ScheduleRuleService {
  constructor(
    @InjectModel(ScheduleRule.name) private scheduleRuleModel: Model<ScheduleRuleDocument>,
  ) {}

  // ==================== CREATE OPERATIONS ====================

  /**
   * FR-TM-03: Create custom scheduling rule
   * Validates pattern format
   */
  async create(createScheduleRuleDto: CreateScheduleRuleDto): Promise<ScheduleRuleDocument> {
    // Validate pattern is not empty or just whitespace
    if (!createScheduleRuleDto.pattern || createScheduleRuleDto.pattern.trim() === '') {
      throw new BadRequestException('Pattern cannot be empty');
    }

    // Check for duplicate name
    const existing = await this.scheduleRuleModel.findOne({
      name: createScheduleRuleDto.name,
    });

    if (existing) {
      throw new BadRequestException(`Schedule rule with name "${createScheduleRuleDto.name}" already exists`);
    }

    const scheduleRule = new this.scheduleRuleModel(createScheduleRuleDto);
    return scheduleRule.save();
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Find all schedule rules with optional filters
   */
  async findAll(filters: any = {}): Promise<ScheduleRuleDocument[]> {
    const query = this.scheduleRuleModel.find();

    if (filters.active !== undefined) {
      query.where('active').equals(filters.active);
    }

    if (filters.pattern) {
      query.where('pattern').regex(new RegExp(filters.pattern, 'i'));
    }

    return query.sort({ name: 1 }).exec();
  }

  /**
   * Find schedule rule by ID
   */
  async findById(id: string): Promise<ScheduleRuleDocument> {
    const scheduleRule = await this.scheduleRuleModel.findById(id).exec();

    if (!scheduleRule) {
      throw new NotFoundException(`Schedule rule with ID ${id} not found`);
    }

    return scheduleRule;
  }

  /**
   * Find active schedule rules only
   */
  async findActive(): Promise<ScheduleRuleDocument[]> {
    return this.scheduleRuleModel
      .find({ active: true })
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Find schedule rule by name
   */
  async findByName(name: string): Promise<ScheduleRuleDocument | null> {
    return this.scheduleRuleModel.findOne({ name }).exec();
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * FR-TM-03: Update schedule rule
   */
  async update(id: string, updateScheduleRuleDto: UpdateScheduleRuleDto): Promise<ScheduleRuleDocument> {
    const scheduleRule = await this.scheduleRuleModel.findById(id);
    if (!scheduleRule) {
      throw new NotFoundException(`Schedule rule with ID ${id} not found`);
    }

    // Validate pattern if being updated
    if (updateScheduleRuleDto.pattern !== undefined) {
      if (!updateScheduleRuleDto.pattern || updateScheduleRuleDto.pattern.trim() === '') {
        throw new BadRequestException('Pattern cannot be empty');
      }
    }

    // Check for duplicate name if name is being updated
    if (updateScheduleRuleDto.name && updateScheduleRuleDto.name !== scheduleRule.name) {
      const existing = await this.scheduleRuleModel.findOne({
        name: updateScheduleRuleDto.name,
        _id: { $ne: id },
      });

      if (existing) {
        throw new BadRequestException(`Schedule rule with name "${updateScheduleRuleDto.name}" already exists`);
      }
    }

    const updated = await this.scheduleRuleModel
      .findByIdAndUpdate(id, updateScheduleRuleDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Schedule rule with ID ${id} not found`);
    }

    return updated;
  }

  /**
   * Soft delete (deactivate) schedule rule
   */
  async softDelete(id: string): Promise<ScheduleRuleDocument> {
    const scheduleRule = await this.scheduleRuleModel.findById(id);
    if (!scheduleRule) {
      throw new NotFoundException(`Schedule rule with ID ${id} not found`);
    }

    scheduleRule.active = false;
    return scheduleRule.save();
  }

  // ==================== DELETE OPERATIONS ====================

  /**
   * Hard delete schedule rule
   */
  async delete(id: string): Promise<ScheduleRuleDocument> {
    const scheduleRule = await this.scheduleRuleModel.findByIdAndDelete(id);
    if (!scheduleRule) {
      throw new NotFoundException(`Schedule rule with ID ${id} not found`);
    }
    return scheduleRule;
  }
}
