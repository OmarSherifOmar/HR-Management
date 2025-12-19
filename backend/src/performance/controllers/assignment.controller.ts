import { Controller, Get, Post, Put, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { AssignmentService } from '../services/assignment.service';
import { CreateAssignmentDto, BulkAssignmentDto } from '../dtos/create-assignment.dto';
import { SubmitAppraisalDto, PublishAppraisalDto, BulkPublishDto, SubmitAndPublishDto, AcknowledgeAppraisalDto } from '../dtos/submit-appraisal.dto';
import { SendReminderDto } from '../dtos/send-reminder.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Role, Roles } from '../../auth/decorators/roles.decorator';

import { SystemRole } from '../../employee-profile/enums/employee-profile.enums';

@UseGuards(AuthGuard)
@Controller('api/performance/assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  // Get all assignments (for debugging/HR view)
  @Get()
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findAll(@Req() req) {
    console.log('[AssignmentController] GET /api/performance/assignments called by user:', req.user?.employeeId, 'role:', req.user?.role);
    const result = await this.assignmentService.findAll();
    console.log('[AssignmentController] findAll returned:', result?.length || 0, 'assignments');
    return result;
  }

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

  // IMPORTANT: 'manager/me' must come BEFORE 'manager/:managerId' to avoid route conflicts
  @Get('manager/me')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async findByManagerMe(@Req() req) {
    console.log('[AssignmentController] manager/me called, user:', req.user?.employeeId);
    return this.assignmentService.findByManager(req.user?.employeeId);
  }

  @Get('manager/:managerId')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findByManager(@Param('managerId') managerId: string, @Query('cycleId') cycleId?: string) {
    console.log('[AssignmentController] manager/:managerId called with:', managerId);
    const result = await this.assignmentService.findByManager(managerId, cycleId);
    console.log('[AssignmentController] Result count:', result?.length || 0);
    return result;
  }

  // Get current user's appraisals (MUST come before :id route)
  @Get('my-appraisals')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async getMyAppraisals(@Req() req) {
    console.log('[AssignmentController] GET /my-appraisals for user:', req.user?.employeeId);
    return this.assignmentService.getEmployeeAppraisals(req.user?.employeeId);
  }

  // Get employee's appraisals (MUST come before :id route)
  @Get('employee/:employeeId/appraisals')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async getEmployeeAppraisals(@Param('employeeId') employeeId: string) {
    console.log('[AssignmentController] GET /employee/:employeeId/appraisals for:', employeeId);
    return this.assignmentService.getEmployeeAppraisals(employeeId);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findById(@Param('id') id: string) {
    return this.assignmentService.findById(id);
  }

  @Put('submit')
  @Roles(Role.DEPARTMENT_HEAD, Role.DEPARTMENT_EMPLOYEE, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async submit(@Body() dto: SubmitAppraisalDto) {
    return this.assignmentService.submit(dto);
  }

  @Post('submit')
  @Roles(Role.DEPARTMENT_HEAD, Role.DEPARTMENT_EMPLOYEE, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async submitPost(@Body() dto: SubmitAppraisalDto) {
    return this.assignmentService.submit(dto);
  }

  @Put('publish')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async publish(@Body() dto: PublishAppraisalDto, @Req() req) {
    console.log('[AssignmentController] PUT /publish for record:', dto.recordId);
    // Extract user ID from JWT token if not provided
    if (!dto.publishedByEmployeeId) {
      dto.publishedByEmployeeId = req.user?.employeeId;
    }
    return this.assignmentService.publish(dto);
  }

  @Post('publish')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async publishPost(@Body() dto: PublishAppraisalDto, @Req() req) {
    console.log('[AssignmentController] POST /publish for record:', dto.recordId);
    console.log('[AssignmentController] User from JWT:', req.user?.employeeId);
    // Extract user ID from JWT token if not provided
    if (!dto.publishedByEmployeeId) {
      dto.publishedByEmployeeId = req.user?.employeeId;
    }
    return this.assignmentService.publish(dto);
  }

  @Post('bulk-publish')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async bulkPublish(@Body() dto: BulkPublishDto, @Req() req) {
    console.log('[AssignmentController] POST /bulk-publish for cycle:', dto.cycleId);
    console.log('[AssignmentController] User from JWT:', req.user?.employeeId);
    // Extract user ID from JWT token if not provided
    if (!dto.publishedByEmployeeId) {
      dto.publishedByEmployeeId = req.user?.employeeId;
    }
    return this.assignmentService.bulkPublish(dto);
  }

  // Manager submits and publishes appraisal in one step
  @Post('submit-and-publish')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async submitAndPublish(@Body() dto: SubmitAndPublishDto, @Req() req) {
    console.log('[AssignmentController] POST /submit-and-publish for assignment:', dto.assignmentId);
    console.log('[AssignmentController] User:', req.user?.employeeId);
    console.log('[AssignmentController] User role:', req.user?.role);
    console.log('[AssignmentController] User roles:', req.user?.roles);
    dto.managerId = req.user?.employeeId;
    return this.assignmentService.submitAndPublish(dto);
  }

  // Manager publishes their own submitted appraisal
  @Put('manager-publish')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async managerPublish(@Body() dto: PublishAppraisalDto, @Req() req) {
    console.log('[AssignmentController] PUT /manager-publish for record:', dto.recordId);
    dto.publishedByEmployeeId = req.user?.employeeId;
    return this.assignmentService.managerPublish(dto, req.user?.employeeId);
  }

  // Employee acknowledges their published appraisal
  @Put('acknowledge')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async acknowledgeAppraisal(@Body() dto: AcknowledgeAppraisalDto, @Req() req) {
    console.log('[AssignmentController] PUT /acknowledge for record:', dto.recordId);
    dto.acknowledgedByEmployeeId = req.user?.employeeId;
    return this.assignmentService.acknowledgeAppraisal(dto);
  }

  // Archive a single appraisal record
  @Put('records/:recordId/archive')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async archiveRecord(@Param('recordId') recordId: string) {
    console.log('[AssignmentController] PUT /records/:recordId/archive for:', recordId);
    return this.assignmentService.archiveRecord(recordId);
  }

  // Archive entire cycle and all its assignments
  @Put('cycles/:cycleId/archive-all')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async archiveCycleAndAssignments(@Param('cycleId') cycleId: string) {
    console.log('[AssignmentController] PUT /cycles/:cycleId/archive-all for:', cycleId);
    return this.assignmentService.archiveCycleAndAssignments(cycleId);
  }

  // Track appraisal progress for a department
  @Post('department/progress')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN, Role.DEPARTMENT_HEAD)
  async getDepartmentProgress(@Body() body: { departmentId: string }, @Req() req) {
    console.log('[AssignmentController] POST /department/progress called by user:', req.user?.employeeId);
    console.log('[AssignmentController] Body:', body);
    return this.assignmentService.getDepartmentAppraisalProgress(body.departmentId);
  }

  // Send reminders to managers for pending assignments
  @Post('send-reminder')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async sendReminder(@Body() dto: SendReminderDto, @Req() req) {
    console.log('[AssignmentController] POST /send-reminder called by user:', req.user?.employeeId);
    console.log('[AssignmentController] Reminder DTO:', dto);
    return this.assignmentService.sendReminder(dto.cycleId, dto.reminderType, dto.departmentIds || [], dto.customMessage);
  }
}