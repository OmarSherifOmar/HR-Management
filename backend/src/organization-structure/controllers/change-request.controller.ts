import { Controller, Post, Get, Delete, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ChangeRequestService } from '../services/change-request.service';
import { CreateChangeRequestDto } from '../dtos/create-change-request.dto';
import { AuthGuard } from '../../auth/./guards/authentication.guard';
import { authorizationGuard } from '../../auth/./guards/authorization.guard';
import { Roles, Role } from '../../auth/./decorators/roles.decorator';

@UseGuards(AuthGuard)
@Controller('api/org/requests')
export class ChangeRequestController {
  constructor(private readonly svc: ChangeRequestService) {}

  @Post()
  @UseGuards(authorizationGuard)
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_EMPLOYEE, Role.DEPARTMENT_EMPLOYEE, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async create(@Body() dto: CreateChangeRequestDto, @Req() req) {
    return this.svc.create(dto, req.user?.sub);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @Req() req) {
    return this.svc.submit(id, req.user?.sub);
  }

  @Post(':id/approve')
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async approve(@Param('id') id: string, @Req() req, @Body('comments') comments: string) {
    return this.svc.approve(id, req.user?.sub, 'APPROVED', comments);
  }

  @Post(':id/reject')
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async reject(@Param('id') id: string, @Req() req, @Body('comments') comments: string) {
    return this.svc.reject(id, req.user?.sub, comments);
  }

  @Get('user/my-requests')
  @UseGuards(AuthGuard)
  async getUserRequests(@Req() req) {
    const userId = req.user?.sub || req.user?._id || req.user?.id || req.user?.employeeId;
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    return this.svc.getUserRequests(userId);
  }

  @Get('search-employees')
  @UseGuards(AuthGuard)
  async searchEmployees(@Query('employeeNumber') employeeNumber: string) {
    if (!employeeNumber || employeeNumber.trim().length === 0) {
      return [];
    }
    return this.svc.searchEmployeeByNumber(employeeNumber);
  }

  @Get()
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async list() {
    return this.svc.list();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Delete(':id/delete')
  @UseGuards(AuthGuard)
  async delete(@Param('id') id: string, @Req() req) {
    return this.svc.delete(id, req.user?.sub, false);
  }

  @Delete(':id/delete/admin')
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async deleteAdmin(@Param('id') id: string, @Req() req) {
    return this.svc.delete(id, req.user?.sub, true);
  }

  @Get('data/position-assignments')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN, Role.DEPARTMENT_HEAD)
  async getPositionAssignments() {
    return this.svc.getPositionAssignments();
  }

  @Get('data/structure-approvals')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async getStructureApprovals() {
    return this.svc.getStructureApprovals();
  }

  @Get('data/structure-change-logs')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN, Role.DEPARTMENT_HEAD)
  async getStructureChangeLogs() {
    return this.svc.getStructureChangeLogs();
  }
}
