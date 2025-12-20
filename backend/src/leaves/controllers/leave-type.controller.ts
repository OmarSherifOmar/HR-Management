import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LeaveTypeService } from '../services/leave-type.service';
import { CreateLeaveTypeDto } from '../dto/leave-type/create-leave-type.dto';
import { UpdateLeaveTypeDto } from '../dto/leave-type/update-leave-type.dto';
import { CreateLeaveCategoryDto } from '../dto/leave-category/create-leave-category.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { authorizationGuard } from '../../auth/guards/authorization.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

/**
 * Leave Type Controller
 * 
 * User Story: As an HR Admin, I want to create and manage different leave types
 * (e.g., Annual leave, Sick leave, Accidental leave, Compensation Leave, 
 * Mission Leave, Marriage Leave, etc.) so that employees can request 
 * appropriate leave categories.
 * 
 * Input: None (internal system management)
 */
@Controller('leaves/types')
@UseGuards(AuthGuard, authorizationGuard)
export class LeaveTypeController {
  constructor(private readonly leaveTypeService: LeaveTypeService) {}

//Leave Category Endpoints 
  /**
   * Create a new leave category
   * POST /leaves/types/categories
   */
  @Post('categories')
  @Roles(Role.HR_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createCategory(@Body() createCategoryDto: CreateLeaveCategoryDto) {
    return this.leaveTypeService.createCategory(createCategoryDto);
  }

  /**
   * Get all leave categories
   * GET /leaves/types/categories
   */
  @Get('categories')
  @Roles(Role.HR_ADMIN)
  async getAllCategories() {
    return this.leaveTypeService.getAllCategories();
  }

  /**
   * Get category by ID
   * GET /leaves/types/categories/:id
   */
  @Get('categories/:id')
  @Roles(Role.HR_ADMIN)
  async getCategoryById(@Param('id') categoryId: string) {
    return this.leaveTypeService.getCategoryById(categoryId);
  }

  /**
   * Update category
   * PUT /leaves/types/categories/:id
   */
  @Put('categories/:id')
  @Roles(Role.HR_ADMIN)
  async updateCategory(
    @Param('id') categoryId: string,
    @Body() updateData: Partial<CreateLeaveCategoryDto>,
  ) {
    return this.leaveTypeService.updateCategory(categoryId, updateData);
  }

  /**
   * Delete category
   * DELETE /leaves/types/categories/:id
   */
  @Delete('categories/:id')
  @Roles(Role.HR_ADMIN)
  async deleteCategory(@Param('id') categoryId: string) {
    return this.leaveTypeService.deleteCategory(categoryId);
  }

  //Leave Type Endpoints

  /**
   * Create a new leave type
   * POST /leaves/types
   * 
   * Supports creating: Annual leave, Sick leave, Accidental leave,
   * Compensation Leave, Mission Leave, Marriage Leave, etc.
   */
  @Post()
  @Roles(Role.HR_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createLeaveType(@Body() createLeaveTypeDto: CreateLeaveTypeDto) {
    return this.leaveTypeService.createLeaveType(createLeaveTypeDto);
  }

  /**
   * Get all leave types
   * GET /leaves/types
   */
  @Get()
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.DEPARTMENT_HEAD)
  async getAllLeaveTypes() {
    return this.leaveTypeService.getAllLeaveTypes();
  }

  /**
   * Get leave types summary (for dashboard)
   * GET /leaves/types/summary
   */
  @Get('summary')
  @Roles(Role.HR_ADMIN)
  async getLeaveTypesSummary() {
    return this.leaveTypeService.getLeaveTypesSummary();
  }

  /**
   * Get leave types by category
   * GET /leaves/types/by-category/:categoryId
   */
  @Get('by-category/:categoryId')
  @Roles(Role.HR_ADMIN)
  async getLeaveTypesByCategory(@Param('categoryId') categoryId: string) {
    return this.leaveTypeService.getLeaveTypesByCategory(categoryId);
  }

  /**
   * Get leave type by code
   * GET /leaves/types/code/:code
   */
  @Get('code/:code')
  @Roles(Role.HR_ADMIN)
  async getLeaveTypeByCode(@Param('code') code: string) {
    return this.leaveTypeService.getLeaveTypeByCode(code);
  }

  /**
   * Get leave type by ID
   * GET /leaves/types/:id
   */
  @Get(':id')
  @Roles(Role.HR_ADMIN)
  async getLeaveTypeById(@Param('id') typeId: string) {
    return this.leaveTypeService.getLeaveTypeById(typeId);
  }

  /**
   * Update leave type
   * PUT /leaves/types/:id
   */
  @Put(':id')
  @Roles(Role.HR_ADMIN)
  async updateLeaveType(
    @Param('id') typeId: string,
    @Body() updateLeaveTypeDto: UpdateLeaveTypeDto,
  ) {
    return this.leaveTypeService.updateLeaveType(typeId, updateLeaveTypeDto);
  }

  /**
   * Delete leave type
   * DELETE /leaves/types/:id
   */
  @Delete(':id')
  @Roles(Role.HR_ADMIN)
  async deleteLeaveType(@Param('id') typeId: string) {
    return this.leaveTypeService.deleteLeaveType(typeId);
  }
}
