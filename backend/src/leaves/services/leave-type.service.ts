import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';
import { LeaveCategory, LeaveCategoryDocument } from '../models/leave-category.schema';
import { LeavePolicy, LeavePolicyDocument } from '../models/leave-policy.schema';
import { CreateLeaveTypeDto } from '../dto/leave-type/create-leave-type.dto';
import { UpdateLeaveTypeDto } from '../dto/leave-type/update-leave-type.dto';
import { CreateLeaveCategoryDto } from '../dto/leave-category/create-leave-category.dto';

/**
 * Leave Type Service
 * 
 * User Story: As an HR Admin, I want to create and manage different leave types
 * (e.g., Annual leave, Sick leave, Accidental leave, Compensation Leave, 
 * Mission Leave, Marriage Leave, etc.) so that employees can request 
 * appropriate leave categories.
 */
@Injectable()
export class LeaveTypeService {
  constructor(
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(LeaveCategory.name) private leaveCategoryModel: Model<LeaveCategoryDocument>,
    @InjectModel(LeavePolicy.name) private leavePolicyModel: Model<LeavePolicyDocument>,
  ) {}

  // ==================== LEAVE CATEGORY MANAGEMENT ====================

  /**
   * Create a new leave category
   */
  async createCategory(createCategoryDto: CreateLeaveCategoryDto): Promise<LeaveCategoryDocument> {
    // Check if category with same name already exists
    const existing = await this.leaveCategoryModel.findOne({
      name: { $regex: new RegExp(`^${createCategoryDto.name}$`, 'i') },
    });
    if (existing) {
      throw new BadRequestException(
        `Leave category with name "${createCategoryDto.name}" already exists`,
      );
    }

    const category = new this.leaveCategoryModel(createCategoryDto);
    return category.save();
  }

  /**
   * Get all leave categories
   */
  async getAllCategories(): Promise<LeaveCategoryDocument[]> {
    return this.leaveCategoryModel.find().sort({ name: 1 }).exec();
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId: string): Promise<LeaveCategoryDocument> {
    const category = await this.leaveCategoryModel.findById(categoryId).exec();
    if (!category) {
      throw new NotFoundException(`Leave category with ID ${categoryId} not found`);
    }
    return category;
  }

  /**
   * Update category
   */
  async updateCategory(
    categoryId: string,
    updateData: Partial<CreateLeaveCategoryDto>,
  ): Promise<LeaveCategoryDocument> {
    const category = await this.leaveCategoryModel.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Leave category with ID ${categoryId} not found`);
    }

    // Check for duplicate name if updating name
    if (updateData.name && updateData.name !== category.name) {
      const existing = await this.leaveCategoryModel.findOne({
        name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
        _id: { $ne: categoryId },
      });
      if (existing) {
        throw new BadRequestException(
          `Leave category with name "${updateData.name}" already exists`,
        );
      }
    }

    Object.assign(category, updateData);
    return category.save();
  }

  /**
   * Delete category
   */
  async deleteCategory(categoryId: string): Promise<{ message: string }> {
    // Check if any leave types use this category
    const typesUsingCategory = await this.leaveTypeModel.countDocuments({
      categoryId: new Types.ObjectId(categoryId),
    });
    if (typesUsingCategory > 0) {
      throw new BadRequestException(
        `Cannot delete category. ${typesUsingCategory} leave type(s) are using this category.`,
      );
    }

    const result = await this.leaveCategoryModel.findByIdAndDelete(categoryId);
    if (!result) {
      throw new NotFoundException(`Leave category with ID ${categoryId} not found`);
    }
    return { message: 'Leave category deleted successfully' };
  }

  // ==================== LEAVE TYPE MANAGEMENT ====================

  /**
   * Create a new leave type
   * Supports: Annual leave, Sick leave, Accidental leave, Compensation Leave,
   * Mission Leave, Marriage Leave, etc.
   */
  async createLeaveType(createLeaveTypeDto: CreateLeaveTypeDto): Promise<LeaveTypeDocument> {
    // Validate category exists
    const category = await this.leaveCategoryModel.findById(createLeaveTypeDto.categoryId);
    if (!category) {
      throw new NotFoundException(
        `Leave category with ID ${createLeaveTypeDto.categoryId} not found`,
      );
    }

    // Check if leave type with same code already exists
    const existingByCode = await this.leaveTypeModel.findOne({
      code: { $regex: new RegExp(`^${createLeaveTypeDto.code}$`, 'i') },
    });
    if (existingByCode) {
      throw new BadRequestException(
        `Leave type with code "${createLeaveTypeDto.code}" already exists`,
      );
    }

    // Check if leave type with same name already exists
    const existingByName = await this.leaveTypeModel.findOne({
      name: { $regex: new RegExp(`^${createLeaveTypeDto.name}$`, 'i') },
    });
    if (existingByName) {
      throw new BadRequestException(
        `Leave type with name "${createLeaveTypeDto.name}" already exists`,
      );
    }

    const leaveType = new this.leaveTypeModel({
      ...createLeaveTypeDto,
      categoryId: new Types.ObjectId(createLeaveTypeDto.categoryId),
    });
    return leaveType.save();
  }

  /**
   * Get all leave types
   */
  async getAllLeaveTypes(): Promise<LeaveTypeDocument[]> {
    return this.leaveTypeModel
      .find()
      .populate('categoryId', 'name description')
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Get leave types by category
   */
  async getLeaveTypesByCategory(categoryId: string): Promise<LeaveTypeDocument[]> {
    // Validate category exists
    const category = await this.leaveCategoryModel.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Leave category with ID ${categoryId} not found`);
    }

    return this.leaveTypeModel
      .find({ categoryId: new Types.ObjectId(categoryId) })
      .populate('categoryId', 'name description')
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Get leave type by ID
   */
  async getLeaveTypeById(typeId: string): Promise<LeaveTypeDocument> {
    const leaveType = await this.leaveTypeModel
      .findById(typeId)
      .populate('categoryId', 'name description')
      .exec();
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${typeId} not found`);
    }
    return leaveType;
  }

  /**
   * Get leave type by code
   */
  async getLeaveTypeByCode(code: string): Promise<LeaveTypeDocument> {
    const leaveType = await this.leaveTypeModel
      .findOne({ code: { $regex: new RegExp(`^${code}$`, 'i') } })
      .populate('categoryId', 'name description')
      .exec();
    if (!leaveType) {
      throw new NotFoundException(`Leave type with code "${code}" not found`);
    }
    return leaveType;
  }

  /**
   * Update leave type
   */
  async updateLeaveType(
    typeId: string,
    updateLeaveTypeDto: UpdateLeaveTypeDto,
  ): Promise<LeaveTypeDocument> {
    const leaveType = await this.leaveTypeModel.findById(typeId);
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${typeId} not found`);
    }

    // Validate category if updating
    if (updateLeaveTypeDto.categoryId) {
      const category = await this.leaveCategoryModel.findById(updateLeaveTypeDto.categoryId);
      if (!category) {
        throw new NotFoundException(
          `Leave category with ID ${updateLeaveTypeDto.categoryId} not found`,
        );
      }
    }

    // Check for duplicate code if updating
    if (updateLeaveTypeDto.code && updateLeaveTypeDto.code !== leaveType.code) {
      const existingByCode = await this.leaveTypeModel.findOne({
        code: { $regex: new RegExp(`^${updateLeaveTypeDto.code}$`, 'i') },
        _id: { $ne: typeId },
      });
      if (existingByCode) {
        throw new BadRequestException(
          `Leave type with code "${updateLeaveTypeDto.code}" already exists`,
        );
      }
    }

    // Check for duplicate name if updating
    if (updateLeaveTypeDto.name && updateLeaveTypeDto.name !== leaveType.name) {
      const existingByName = await this.leaveTypeModel.findOne({
        name: { $regex: new RegExp(`^${updateLeaveTypeDto.name}$`, 'i') },
        _id: { $ne: typeId },
      });
      if (existingByName) {
        throw new BadRequestException(
          `Leave type with name "${updateLeaveTypeDto.name}" already exists`,
        );
      }
    }

    Object.assign(leaveType, updateLeaveTypeDto);
    if (updateLeaveTypeDto.categoryId) {
      leaveType.categoryId = new Types.ObjectId(updateLeaveTypeDto.categoryId);
    }
    return leaveType.save();
  }

  /**
   * Delete leave type
   */
  async deleteLeaveType(typeId: string): Promise<{ message: string }> {
    // Check if any policies use this leave type
    const policiesUsingType = await this.leavePolicyModel.countDocuments({
      leaveTypeId: new Types.ObjectId(typeId),
    });
    if (policiesUsingType > 0) {
      throw new BadRequestException(
        `Cannot delete leave type. ${policiesUsingType} policy(ies) are using this leave type.`,
      );
    }

    const result = await this.leaveTypeModel.findByIdAndDelete(typeId);
    if (!result) {
      throw new NotFoundException(`Leave type with ID ${typeId} not found`);
    }
    return { message: 'Leave type deleted successfully' };
  }

  /**
   * Get leave types summary (for dashboard/init)
   */
  async getLeaveTypesSummary(): Promise<{
    totalCategories: number;
    totalTypes: number;
    categories: { id: string; name: string; typesCount: number }[];
  }> {
    const categories = await this.leaveCategoryModel.find().lean();
    const categorySummary = await Promise.all(
      categories.map(async (cat) => ({
        id: cat._id.toString(),
        name: cat.name,
        typesCount: await this.leaveTypeModel.countDocuments({
          categoryId: cat._id,
        }),
      })),
    );

    return {
      totalCategories: categories.length,
      totalTypes: await this.leaveTypeModel.countDocuments(),
      categories: categorySummary,
    };
  }
}
