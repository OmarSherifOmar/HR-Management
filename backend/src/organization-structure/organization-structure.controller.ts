import { Controller, Post, Get, Delete, Param, Body, UseGuards, Req, Query, Patch } from '@nestjs/common';
import { Types } from 'mongoose';
import { DepartmentService } from './organization-structure.service';
import { PositionService } from './organization-structure.service';
import { ChangeRequestService } from './organization-structure.service';
import { CreateChangeRequestDto } from './dtos/create-change-request.dto';
import { CreateDepartmentDto } from './dtos/create-department.dto';
import { UpdateDepartmentDto } from './dtos/update-department.dto';
import { CreatePositionDto } from './dtos/create-position.dto';
import { UpdatePositionDto } from './dtos/update-position.dto';
import { AuthGuard } from '../auth/./guards/authentication.guard';
import { authorizationGuard } from '../auth/./guards/authorization.guard';
import { Roles, Role } from '../auth/./decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

// ============================================================================
// CHANGE REQUEST CONTROLLER
// ============================================================================
@UseGuards(AuthGuard)
@Controller('api/org/requests')
export class ChangeRequestController {
  constructor(private readonly changeRequestService: ChangeRequestService) {}

  @Post()
  @UseGuards(authorizationGuard)
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_EMPLOYEE, Role.DEPARTMENT_EMPLOYEE, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async create(@Body() dto: CreateChangeRequestDto, @Req() req) {
    return this.changeRequestService.create(dto, req.user?.sub);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @Req() req) {
    return this.changeRequestService.submit(id, req.user?.sub);
  }

  @Post(':id/approve')
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async approve(@Param('id') id: string, @Req() req, @Body('comments') comments: string) {
    return this.changeRequestService.approve(id, req.user?.sub, 'APPROVED', comments);
  }

  @Post(':id/reject')
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async reject(@Param('id') id: string, @Req() req, @Body('comments') comments: string) {
    return this.changeRequestService.reject(id, req.user?.sub, comments);
  }

  @Get('user/my-requests')
  @UseGuards(AuthGuard)
  async getUserRequests(@Req() req) {
    const userId = req.user?.sub || req.user?._id || req.user?.id || req.user?.employeeId;
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    return this.changeRequestService.getUserRequests(userId);
  }

  @Get('search-employees')
  @UseGuards(AuthGuard)
  async searchEmployees(@Query('employeeNumber') employeeNumber: string) {
    if (!employeeNumber || employeeNumber.trim().length === 0) {
      return [];
    }
    return this.changeRequestService.searchEmployeeByNumber(employeeNumber);
  }

  @Get('pay-grades')
  @UseGuards(AuthGuard)
  async getPayGrades() {
    return this.changeRequestService.getAllPayGrades();
  }

  @Get()
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async list() {
    return this.changeRequestService.list();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string) {
    return this.changeRequestService.findOne(id);
  }

  @Delete(':id/delete')
  @UseGuards(AuthGuard)
  async delete(@Param('id') id: string, @Req() req) {
    return this.changeRequestService.delete(id, req.user?.sub, false);
  }

  @Delete(':id/delete/admin')
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async deleteAdmin(@Param('id') id: string, @Req() req) {
    return this.changeRequestService.delete(id, req.user?.sub, true);
  }

  @Get('data/position-assignments')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN, Role.DEPARTMENT_HEAD)
  async getPositionAssignments() {
    return this.changeRequestService.getPositionAssignments();
  }

  @Get('data/structure-approvals')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async getStructureApprovals() {
    return this.changeRequestService.getStructureApprovals();
  }

  @Get('data/structure-change-logs')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN, Role.DEPARTMENT_HEAD)
  async getStructureChangeLogs() {
    return this.changeRequestService.getStructureChangeLogs();
  }
}

// ============================================================================
// DEPARTMENT CONTROLLER
// ============================================================================
@UseGuards(AuthGuard)
@Controller('api/org/departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post('/createDepartment')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async create(@Body() dto: CreateDepartmentDto, @Req() req) {
    return this.departmentService.create(dto, req.user?.employeeId);
  }

  @Get()
  @Public()
  async list(@Query('active') active = 'true') {
    const activeOnly = active === 'true';
    return this.departmentService.findAll(activeOnly);
  }

  @Get(':id')
  @Public()
  async get(@Param('id') id: string) {
    return this.departmentService.findById(id);
  }

  @Patch(':id')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @Req() req) {
    return this.departmentService.update(id, dto, req.user?.employeeId);
  }

  @Post(':id/activePositions')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async FindActivePoistions(@Param('id') id: string) {
    return this.departmentService.FindActivePoistions(id);
  }

  @Post(':id/deactivate')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async deactivate(@Param('id') id: string, @Req() req) {
    return this.departmentService.deactivate(id, req.user?.employeeId);
  }

  @Delete(':id')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async delete(@Param('id') id: string, @Req() req) {
    return this.departmentService.delete(id, req.user?.employeeId);
  }
}

// ============================================================================
// POSITION CONTROLLER
// ============================================================================
@UseGuards(AuthGuard)
@Controller('api/org/positions')
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Post('/create')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async create(@Body() dto: CreatePositionDto, @Req() req) {
    return this.positionService.create(dto, req.user?.employeeId);
  }

  @Get()
  @Public()
  async list(@Query('departmentId') departmentId?: string, @Query('active') active = 'true') {
    const filters: any = {};
    if (departmentId) {
      // departmentId can be stored as either string or ObjectId in MongoDB
      // Use $or to match both formats
      filters.$or = [
        { departmentId: departmentId }, // string match
        { departmentId: new Types.ObjectId(departmentId) }, // ObjectId match
      ];
    }
    if (active === 'true') {
      filters.isActive = true;
    }
    return this.positionService.findAll(filters);
  }

  @Get(':id')
  @Public()
  async get(@Param('id') id: string) {
    return this.positionService.findById(id);
  }

  @Patch(':id/update')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdatePositionDto, @Req() req) {
    return this.positionService.update(id, dto, req.user?.employeeId);
  }

  @Post(':id/deactivate')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async deactivate(@Param('id') id: string, @Req() req) {
    return this.positionService.deactivate(id, req.user?.employeeId);
  }

  @Delete(':id/delete')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async delete(@Param('id') id: string, @Req() req) {
    return this.positionService.delete(id, req.user?.employeeId);
  }
}

// ============================================================================
// ORGANIZATION STRUCTURE CONTROLLER (placeholder for main controller)
// ============================================================================
@Controller('organization-structure')
export class OrganizationStructureController {}