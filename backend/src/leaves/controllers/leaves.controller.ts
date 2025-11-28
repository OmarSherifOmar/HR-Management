import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LeavesService } from '../services/leaves.service';
import {
  CreateLeavePolicyDto,
  UpdateLeavePolicyDto,
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
  CreateLeaveCategoryDto,
  UpdateLeaveCategoryDto,
  CreateHolidayDto,
  UpdateHolidayDto,
} from '../dto/leave-config.dto';

@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  // User Story 1: Initiate leave configuration process
   @Post('config/policies')
  createLeavePolicy(@Body() dto: CreateLeavePolicyDto) {
    return this.leavesService.createLeavePolicy(dto);
  }

  @Get('config/policies')
  getAllLeavePolicies() {
    return this.leavesService.getAllLeavePolicies();
  }

  @Get('config/policies/:id')
  getLeavePolicyById(@Param('id') id: string) {
    return this.leavesService.getLeavePolicyById(id);
  }

  @Patch('config/policies/:id')
  updateLeavePolicy(
    @Param('id') id: string,
    @Body() dto: UpdateLeavePolicyDto,
  ) {
    return this.leavesService.updateLeavePolicy(id, dto);
  }

  @Delete('config/policies/:id')
  deleteLeavePolicy(@Param('id') id: string) {
    return this.leavesService.deleteLeavePolicy(id);
  }

  // Leave Types Management
  @Post('config/types')
  createLeaveType(@Body() dto: CreateLeaveTypeDto) {
    return this.leavesService.createLeaveType(dto);
  }

  @Get('config/types')
  getAllLeaveTypes() {
    return this.leavesService.getAllLeaveTypes();
  }

  @Get('config/types/:id')
  getLeaveTypeById(@Param('id') id: string) {
    return this.leavesService.getLeaveTypeById(id);
  }

  @Patch('config/types/:id')
  updateLeaveType(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveTypeDto,
  ) {
    return this.leavesService.updateLeaveType(id, dto);
  }

  @Delete('config/types/:id')
  deleteLeaveType(@Param('id') id: string) {
    return this.leavesService.deleteLeaveType(id);
  }

  // Leave Categories Management
  @Post('config/categories')
  createLeaveCategory(@Body() dto: CreateLeaveCategoryDto) {
    return this.leavesService.createLeaveCategory(dto);
  }

  @Get('config/categories')
  getAllLeaveCategories() {
    return this.leavesService.getAllLeaveCategories();
  }

  @Get('config/categories/:id')
  getLeaveCategoryById(@Param('id') id: string) {
    return this.leavesService.getLeaveCategoryById(id);
  }

  @Patch('config/categories/:id')
  updateLeaveCategory(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveCategoryDto,
  ) {
    return this.leavesService.updateLeaveCategory(id, dto);
  }

  @Delete('config/categories/:id')
  deleteLeaveCategory(@Param('id') id: string) {
    return this.leavesService.deleteLeaveCategory(id);
  }

  // Holiday Calendar Management
  @Post('config/holidays')
  createHoliday(@Body() dto: CreateHolidayDto) {
    return this.leavesService.createHoliday(dto);
  }

  @Get('config/holidays')
  getAllHolidays() {
    return this.leavesService.getAllHolidays();
  }

  @Get('config/holidays/:id')
  getHolidayById(@Param('id') id: string) {
    return this.leavesService.getHolidayById(id);
  }

  @Patch('config/holidays/:id')
  updateHoliday(
    @Param('id') id: string,
    @Body() dto: UpdateHolidayDto,
  ) {
    return this.leavesService.updateHoliday(id, dto);
  }

  @Delete('config/holidays/:id')
  deleteHoliday(@Param('id') id: string) {
    return this.leavesService.deleteHoliday(id);
  }
}
