import { Controller, Get, Post, Put, Param, Body, Query, Req, UseGuards, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';

import { PerformanceService } from './performance.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dtos/create-template.dto';
import { CreateCycleDto, UpdateCycleDto } from './dtos/create-cycle.dto';
import { CreateAssignmentDto, BulkAssignmentDto } from './dtos/create-assignment.dto';
import { SubmitAppraisalDto, PublishAppraisalDto, BulkPublishDto, SubmitAndPublishDto, AcknowledgeAppraisalDto as SubmitAcknowledgeAppraisalDto } from './dtos/submit-appraisal.dto';
import { ViewAppraisalDto } from './dtos/view-appraisal.dto';
import { GetAppraisalProgressDto } from './dtos/get-appraisal-progress.dto';
import { AcknowledgeAppraisalDto } from './dtos/acknowledge-appraisal.dto';
import { SendReminderDto } from './dtos/send-reminder.dto';
import { CreateDisputeDto } from './dtos/create-dispute.dto';
import { ResolveDisputeDto } from './dtos/resolve-dispute.dto';
import { AuthGuard } from '../auth/guards/authentication.guard';
import { Role, Roles } from '../auth/decorators/roles.decorator';

// ============================================================================
// TEMPLATE CONTROLLER
// ============================================================================
@UseGuards(AuthGuard)
@Controller('api/performance/templates')
export class TemplateController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post()
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTemplateDto, @Req() req) {
    try {
      console.log('TemplateController.create called with dto:', dto);
      const result = await this.performanceService.createTemplate(dto, req.user?.employeeId);
      console.log('TemplateController.create succeeded:', result._id);
      return result;
    } catch (error) {
      console.error('TemplateController.create error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to create template');
    }
  }

  @Get()
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findAll(@Query() filters: any) {
    return this.performanceService.findAllTemplates(filters);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findById(@Param('id') id: string) {
    return this.performanceService.findTemplateById(id);
  }

  @Put(':id')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto, @Req() req) {
    try {
      return await this.performanceService.updateTemplate(id, dto, req.user?.employeeId);
    } catch (error) {
      console.error('TemplateController.update error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to update template');
    }
  }

  @Put(':id/deactivate')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async deactivate(@Param('id') id: string, @Req() req) {
    try {
      return await this.performanceService.deactivateTemplate(id, req.user?.employeeId);
    } catch (error) {
      console.error('TemplateController.deactivate error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to deactivate template');
    }
  }
}

// ============================================================================
// CYCLE CONTROLLER
// ============================================================================
@UseGuards(AuthGuard)
@Controller('api/performance/cycles')
export class CycleController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post()
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async create(@Body() dto: CreateCycleDto, @Req() req) {
    try {
      console.log('CycleController.create called with dto:', dto);
      const result = await this.performanceService.createCycle(dto, req.user?.employeeId);
      console.log('CycleController.create succeeded:', result._id);
      return result;
    } catch (error) {
      console.error('CycleController.create error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to create cycle');
    }
  }

  @Get()
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findAll(@Query() filters: any) {
    console.log('CycleController.findAll called with filters:', filters);
    const result = await this.performanceService.findAllCycles(filters);
    console.log('CycleController.findAll returning:', result.length, 'cycles');
    return result;
  }

  @Get(':id')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findById(@Param('id') id: string) {
    return this.performanceService.findCycleById(id);
  }

  @Put(':id')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateCycleDto, @Req() req) {
    try {
      return await this.performanceService.updateCycle(id, dto, req.user?.employeeId);
    } catch (error) {
      console.error('CycleController.update error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to update cycle');
    }
  }

  @Put(':id/activate')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async activate(@Param('id') id: string, @Req() req) {
    try {
      return await this.performanceService.activateCycle(id, req.user?.employeeId);
    } catch (error) {
      console.error('CycleController.activate error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to activate cycle');
    }
  }

  @Put(':id/close')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async close(@Param('id') id: string, @Req() req) {
    try {
      return await this.performanceService.closeCycle(id, req.user?.employeeId);
    } catch (error) {
      console.error('CycleController.close error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to close cycle');
    }
  }
}

// ============================================================================
// ASSIGNMENT CONTROLLER
// ============================================================================
@UseGuards(AuthGuard)
@Controller('api/performance/assignments')
export class AssignmentController {
  constructor(private readonly performanceService: PerformanceService) {}

  // Get all assignments (for debugging/HR view)
  @Get()
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findAll(@Req() req) {
    console.log('[AssignmentController] GET /api/performance/assignments called by user:', req.user?.employeeId, 'role:', req.user?.role);
    const result = await this.performanceService.findAll();
    console.log('[AssignmentController] findAll returned:', result?.length || 0, 'assignments');
    return result;
  }

  @Post()
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async create(@Body() dto: CreateAssignmentDto, @Req() req) {
    return this.performanceService.create(dto, req.user?.employeeId);
  }

  @Post('bulk')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async bulkAssign(@Body() dto: BulkAssignmentDto, @Req() req) {
    return this.performanceService.bulkAssign(dto, req.user?.employeeId);
  }

  // IMPORTANT: 'manager/me' must come BEFORE 'manager/:managerId' to avoid route conflicts
  @Get('manager/me')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async findByManagerMe(@Req() req) {
    console.log('[AssignmentController] manager/me called, user:', req.user?.employeeId);
    return this.performanceService.findByManager(req.user?.employeeId);
  }

  @Get('manager/:managerId')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findByManager(@Param('managerId') managerId: string, @Query('cycleId') cycleId?: string) {
    console.log('[AssignmentController] manager/:managerId called with:', managerId);
    const result = await this.performanceService.findByManager(managerId, cycleId);
    console.log('[AssignmentController] Result count:', result?.length || 0);
    return result;
  }

  // Get current user's appraisals (MUST come before :id route)
  @Get('my-appraisals')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async getMyAppraisals(@Req() req) {
    console.log('[AssignmentController] GET /my-appraisals for user:', req.user?.employeeId);
    return this.performanceService.getEmployeeAppraisals(req.user?.employeeId);
  }

  // Get employee's appraisals (MUST come before :id route)
  @Get('employee/:employeeId/appraisals')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async getEmployeeAppraisals(@Param('employeeId') employeeId: string) {
    console.log('[AssignmentController] GET /employee/:employeeId/appraisals for:', employeeId);
    return this.performanceService.getEmployeeAppraisals(employeeId);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findById(@Param('id') id: string) {
    return this.performanceService.findById(id);
  }

  @Put('submit')
  @Roles(Role.DEPARTMENT_HEAD, Role.DEPARTMENT_EMPLOYEE, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async submit(@Body() dto: SubmitAppraisalDto) {
    return this.performanceService.submit(dto);
  }

  @Post('submit')
  @Roles(Role.DEPARTMENT_HEAD, Role.DEPARTMENT_EMPLOYEE, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async submitPost(@Body() dto: SubmitAppraisalDto) {
    return this.performanceService.submit(dto);
  }

  @Put('publish')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async publish(@Body() dto: PublishAppraisalDto, @Req() req) {
    console.log('[AssignmentController] PUT /publish for record:', dto.recordId);
    // Extract user ID from JWT token if not provided
    if (!dto.publishedByEmployeeId) {
      dto.publishedByEmployeeId = req.user?.employeeId;
    }
    return this.performanceService.publish(dto);
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
    return this.performanceService.publish(dto);
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
    return this.performanceService.bulkPublish(dto);
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
    return this.performanceService.submitAndPublish(dto);
  }

  // Manager publishes their own submitted appraisal
  @Put('manager-publish')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async managerPublish(@Body() dto: PublishAppraisalDto, @Req() req) {
    console.log('[AssignmentController] PUT /manager-publish for record:', dto.recordId);
    dto.publishedByEmployeeId = req.user?.employeeId;
    return this.performanceService.managerPublish(dto, req.user?.employeeId);
  }

  // Employee acknowledges their published appraisal
  @Put('acknowledge')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async acknowledgeAppraisal(@Body() dto: SubmitAcknowledgeAppraisalDto, @Req() req) {
    console.log('[AssignmentController] PUT /acknowledge for record:', dto.recordId);
    dto.acknowledgedByEmployeeId = req.user?.employeeId;
    return this.performanceService.acknowledgeAppraisalFromAssignment(dto);
  }

  // Archive a single appraisal record
  @Put('records/:recordId/archive')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async archiveRecord(@Param('recordId') recordId: string) {
    console.log('[AssignmentController] PUT /records/:recordId/archive for:', recordId);
    return this.performanceService.archiveRecord(recordId);
  }

  // Archive entire cycle and all its assignments
  @Put('cycles/:cycleId/archive-all')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async archiveCycleAndAssignments(@Param('cycleId') cycleId: string) {
    console.log('[AssignmentController] PUT /cycles/:cycleId/archive-all for:', cycleId);
    return this.performanceService.archiveCycleAndAssignments(cycleId);
  }

  // Track appraisal progress for a department
  @Post('department/progress')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN, Role.DEPARTMENT_HEAD)
  async getDepartmentProgress(@Body() body: { departmentId: string }, @Req() req) {
    console.log('[AssignmentController] POST /department/progress called by user:', req.user?.employeeId);
    console.log('[AssignmentController] Body:', body);
    return this.performanceService.getDepartmentAppraisalProgress(body.departmentId);
  }

  // Send reminders to managers for pending assignments
  @Post('send-reminder')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async sendReminder(@Body() body: { cycleId: string; reminderType: string; departmentIds?: string[]; customMessage?: string }, @Req() req) {
    console.log('[AssignmentController] POST /send-reminder');
    return this.performanceService.sendReminder(body.cycleId, body.reminderType, body.departmentIds || [], body.customMessage);
  }
}

// ============================================================================
// APPRAISAL CONTROLLER
// ============================================================================
@UseGuards(AuthGuard)
@Controller('api/performance/appraisals')
export class AppraisalController {
  constructor(private readonly performanceService: PerformanceService) {}

  // IMPORTANT: Static routes must come before parameterized routes

  @Post('progress')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async getProgress(@Body() dto: GetAppraisalProgressDto) {
    try {
      console.log('getProgress called with:', dto);
      return await this.performanceService.getProgress(dto);
    } catch (error) {
      console.error('getProgress error:', error);
      throw error;
    }
  }

  @Post('send-reminders')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async sendReminders(@Body() dto: SendReminderDto, @Req() req) {
    return this.performanceService.sendReminders(dto, req.user?.employeeId);
  }

  @Get('my-appraisals')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async getMyAppraisals(@Req() req) {
    console.log('[AppraisalController] GET /my-appraisals for:', req.user?.employeeId);
    return this.performanceService.getMyAppraisals(req.user?.employeeId);
  }

  @Get('employee/:employeeId')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async getByEmployeeId(@Param('employeeId') employeeId: string) {
    console.log('[AppraisalController] GET /employee/:employeeId for:', employeeId);
    return this.performanceService.getMyAppraisals(employeeId);
  }

  // Parameterized routes come after static routes

  @Get(':recordId/employee/:employeeId')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async view(@Param('recordId') recordId: string, @Param('employeeId') employeeId: string) {
    return this.performanceService.view({ appraisalRecordId: recordId, employeeId });
  }

  @Put(':recordId/employee/:employeeId/acknowledge')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async acknowledge(
    @Param('recordId') recordId: string,
    @Param('employeeId') employeeId: string,
    @Body('comment') comment?: string,
  ) {
    return this.performanceService.acknowledge({ appraisalRecordId: recordId, employeeId, comment });
  }

  @Put(':id/acknowledge')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async acknowledgeAppraisal(@Param('id') id: string, @Body() body: { comment?: string }, @Req() req) {
    return this.performanceService.acknowledgeAppraisal(id, req.user?.employeeId, body.comment);
  }

  @Put(':id/employee/me/acknowledge')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async acknowledgeAppraisalMe(@Param('id') id: string, @Body() body: { comment?: string }, @Req() req) {
    return this.performanceService.acknowledgeAppraisal(id, req.user?.employeeId, body.comment);
  }
}

// ============================================================================
// DISPUTE CONTROLLER
// ============================================================================
@UseGuards(AuthGuard)
@Controller('api/performance/disputes')
export class DisputeController {
  constructor(private readonly performanceService: PerformanceService) {}

  // Get all disputes (for HR)
  @Get()
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findAll() {
    console.log('[DisputeController] GET /api/performance/disputes - findAll');
    return this.performanceService.findAllDisputes();
  }

  // Create dispute for current user (generic POST endpoint)
  @Post()
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async createDispute(@Body() dto: CreateDisputeDto, @Req() req) {
    console.log('[DisputeController] POST / - create dispute');
    console.log('[DisputeController] User:', req.user?.employeeId, 'Role:', req.user?.role);
    console.log('[DisputeController] DTO:', JSON.stringify(dto));
    if (!req.user?.employeeId) {
      throw new BadRequestException('Employee ID is required');
    }
    dto.raisedByEmployeeId = req.user?.employeeId;
    return this.performanceService.createDispute(dto);
  }

  // IMPORTANT: Static routes must come before parameterized routes
  
  // Get disputes raised by current user
  @Get('employee/me')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findByEmployeeMe(@Req() req) {
    console.log('[DisputeController] GET /employee/me for:', req.user?.employeeId);
    return this.performanceService.findDisputesByEmployee(req.user?.employeeId);
  }

  // Create dispute for current user - any authenticated employee can create
  @Post('employee/me')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async createForMe(@Body() dto: CreateDisputeDto, @Req() req) {
    console.log('[DisputeController] POST /employee/me');
    console.log('[DisputeController] User:', req.user?.employeeId, 'Role:', req.user?.role);
    console.log('[DisputeController] DTO:', JSON.stringify(dto));
    if (!req.user?.employeeId) {
      throw new BadRequestException('Employee ID is required');
    }
    dto.raisedByEmployeeId = req.user?.employeeId;
    return this.performanceService.createDispute(dto);
  }

  // Get disputes for employees managed by current user
  @Get('manager/me')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async findByManagerMe(@Req() req) {
    console.log('[DisputeController] GET /manager/me for:', req.user?.employeeId);
    return this.performanceService.findDisputesByManager(req.user?.employeeId);
  }

  // Parameterized routes come after static routes
  
  @Get('manager/:managerId')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async findByManager(@Param('managerId') managerId: string) {
    console.log('[DisputeController] GET /manager/:managerId for:', managerId);
    return this.performanceService.findDisputesByManager(managerId);
  }

  @Post('employee/:employeeId')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async create(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateDisputeDto,
    @Req() req,
  ) {
    console.log('[DisputeController] POST /employee/:employeeId for:', employeeId);
    
    // Security: Only allow employees to create disputes for themselves
    // HR staff and admins can create for any employee
    const canCreateForOthers = [Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN].includes(req.user?.role);
    if (!canCreateForOthers && req.user?.employeeId !== employeeId) {
      throw new BadRequestException('You can only create disputes for yourself');
    }
    
    dto.raisedByEmployeeId = employeeId;
    return this.performanceService.createDispute(dto);
  }

  @Get('cycle/:cycleId')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findByCycle(@Param('cycleId') cycleId: string) {
    return this.performanceService.findDisputesByCycle(cycleId);
  }

  @Put(':id/resolve')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async resolve(@Param('id') id: string, @Body() dto: ResolveDisputeDto, @Req() req) {
    dto.disputeId = id;
    dto.resolvedByEmployeeId = req.user?.employeeId;
    return this.performanceService.resolveDispute(dto);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findById(@Param('id') id: string) {
    return this.performanceService.findDisputeById(id);
  }
}

// ============================================================================
// REPORTING CONTROLLER
// ============================================================================
@UseGuards(AuthGuard)
@Controller('api/performance/reporting')
export class ReportingController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('history/:employeeId')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async getHistory(@Param('employeeId') employeeId: string) {
    console.log('[ReportingController] GET /history/:employeeId for:', employeeId);
    return this.performanceService.getHistory(employeeId);
  }

  @Get('outcome-report/:cycleId')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async generateOutcomeReport(@Param('cycleId') cycleId: string) {
    console.log('[ReportingController] GET /outcome-report/:cycleId for:', cycleId);
    return this.performanceService.generateOutcomeReport(cycleId);
  }

  @Get('multi-cycle-trend/:employeeId')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async getMultiCycleTrend(
    @Param('employeeId') employeeId: string,
    @Query('limit') limit?: string
  ) {
    console.log('[ReportingController] GET /multi-cycle-trend/:employeeId for:', employeeId, 'limit:', limit);
    return this.performanceService.getMultiCycleTrendAnalysis(employeeId, limit ? parseInt(limit) : 10);
  }
}

// ============================================================================
// PERFORMANCE CONTROLLER (placeholder for main controller)
// ============================================================================
@Controller('performance')
export class PerformanceController {}
