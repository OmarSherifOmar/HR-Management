import { Controller, Get, Post, Put, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { AssignmentService } from '../services/assignment.service';
import { CreateAssignmentDto, BulkAssignmentDto } from '../dtos/create-assignment.dto';
import { SubmitAppraisalDto, PublishAppraisalDto, BulkPublishDto } from '../dtos/submit-appraisal.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Role, Roles } from '../../auth/decorators/roles.decorator';

import { SystemRole } from '../../employee-profile/enums/employee-profile.enums';

@UseGuards(AuthGuard)
@Controller('api/performance/assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async create(@Body() dto: CreateAssignmentDto, @Req() req) {
    return this.assignmentService.create(dto, req.user?.employeeId);
  }

  @Post('bulk')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async bulkAssign(@Body() dto: BulkAssignmentDto, @Req() req) {
    return this.assignmentService.bulkAssign(dto, req.user?.employeeId);
  }

  @Get('manager/:managerId')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role .SYSTEM_ADMIN)
  async findByManager(@Param('managerId') managerId: string, @Query('cycleId') cycleId?: string) {
    return this.assignmentService.findByManager(managerId, cycleId);
  }

  @Get('manager/me')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async findByManagerMe(@Req() req) {
    return this.assignmentService.findByManager(req.user?.employeeId);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findById(@Param('id') id: string) {
    return this.assignmentService.findById(id);
  }

  @Put('submit')
  @Roles(Role.DEPARTMENT_HEAD, Role.DEPARTMENT_EMPLOYEE, Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async submit(@Body() dto: SubmitAppraisalDto) {
    return this.assignmentService.submit(dto);
  }

  @Post('submit')
  @Roles(Role.DEPARTMENT_HEAD, Role.DEPARTMENT_EMPLOYEE, Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async submitPost(@Body() dto: SubmitAppraisalDto) {
    return this.assignmentService.submit(dto);
  }

  @Put('publish')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async publish(@Body() dto: PublishAppraisalDto) {
    return this.assignmentService.publish(dto);
  }

  @Post('bulk-publish')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async bulkPublish(@Body() dto: BulkPublishDto) {
    return this.assignmentService.bulkPublish(dto);
  }
}
