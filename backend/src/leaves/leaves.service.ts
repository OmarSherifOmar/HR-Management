import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeavePolicy, LeavePolicyDocument } from './models/leave-policy.schema';
import { LeaveType, LeaveTypeDocument } from './models/leave-type.schema';
import { LeaveCategory, LeaveCategoryDocument } from './models/leave-category.schema';
import { Calendar, CalendarDocument } from './models/calendar.schema';
import {
  CreateLeavePolicyDto,
  UpdateLeavePolicyDto,
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
  CreateLeaveCategoryDto,
  UpdateLeaveCategoryDto,
  CreateHolidayDto,
  UpdateHolidayDto,
} from './dto/leave-config.dto';

@Injectable()
export class LeavesService {
  constructor(
    @InjectModel(LeavePolicy.name)
    private readonly leavePolicyModel: Model<LeavePolicyDocument>,
    @InjectModel(LeaveType.name)
    private readonly leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(LeaveCategory.name)
    private readonly leaveCategoryModel: Model<LeaveCategoryDocument>,
    @InjectModel(Calendar.name)
    private readonly calendarModel: Model<CalendarDocument>,
  ) {}

  // Leave Policy Configuration
  async createLeavePolicy(dto: CreateLeavePolicyDto): Promise<LeavePolicyDocument> {
    const policy = new this.leavePolicyModel(dto);
    return policy.save();
  }

  async getAllLeavePolicies(): Promise<any[]> {
    return this.leavePolicyModel.find().populate('leaveTypeId').lean();
  }

  async getLeavePolicyById(id: string): Promise<any | null> {
    return this.leavePolicyModel.findById(id).populate('leaveTypeId').lean();
  }

  async updateLeavePolicy(
    id: string,
    dto: UpdateLeavePolicyDto,
  ): Promise<any | null> {
    return this.leavePolicyModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('leaveTypeId')
      .lean();
  }

  async deleteLeavePolicy(id: string): Promise<void> {
    await this.leavePolicyModel.findByIdAndDelete(id);
  }

  // Leave Types Management
  async createLeaveType(dto: CreateLeaveTypeDto): Promise<LeaveTypeDocument> {
    const leaveType = new this.leaveTypeModel(dto);
    return leaveType.save();
  }

  async getAllLeaveTypes(): Promise<any[]> {
    return this.leaveTypeModel.find().populate('categoryId').lean();
  }

  async getLeaveTypeById(id: string): Promise<any | null> {
    return this.leaveTypeModel.findById(id).populate('categoryId').lean();
  }

  async updateLeaveType(
    id: string,
    dto: UpdateLeaveTypeDto,
  ): Promise<any | null> {
    return this.leaveTypeModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('categoryId')
      .lean();
  }

  async deleteLeaveType(id: string): Promise<void> {
    await this.leaveTypeModel.findByIdAndDelete(id);
  }

  // Leave Categories Management
  async createLeaveCategory(dto: CreateLeaveCategoryDto): Promise<LeaveCategoryDocument> {
    const category = new this.leaveCategoryModel(dto);
    return category.save();
  }

  async getAllLeaveCategories(): Promise<any[]> {
    return this.leaveCategoryModel.find().lean();
  }

  async getLeaveCategoryById(id: string): Promise<any | null> {
    return this.leaveCategoryModel.findById(id).lean();
  }

  async updateLeaveCategory(
    id: string,
    dto: UpdateLeaveCategoryDto,
  ): Promise<any | null> {
    return this.leaveCategoryModel
      .findByIdAndUpdate(id, dto, { new: true })
      .lean();
  }

  async deleteLeaveCategory(id: string): Promise<void> {
    await this.leaveCategoryModel.findByIdAndDelete(id);
  }

  // Holiday Calendar Management
  async createHoliday(dto: CreateHolidayDto): Promise<CalendarDocument> {
    const holiday = new this.calendarModel(dto);
    return holiday.save();
  }

  async getAllHolidays(): Promise<any[]> {
    return this.calendarModel.find().lean();
  }

  async getHolidayById(id: string): Promise<any | null> {
    return this.calendarModel.findById(id).lean();
  }

  async updateHoliday(
    id: string,
    dto: UpdateHolidayDto,
  ): Promise<any | null> {
    return this.calendarModel
      .findByIdAndUpdate(id, dto, { new: true })
      .lean();
  }

  async deleteHoliday(id: string): Promise<void> {
    await this.calendarModel.findByIdAndDelete(id);
  }
}
