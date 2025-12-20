import { Controller, Get, Post, Put, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { AppraisalService } from '../services/appraisal.service';
import { ViewAppraisalDto } from '../dtos/view-appraisal.dto';
import { AcknowledgeAppraisalDto } from '../dtos/acknowledge-appraisal.dto';
import { GetAppraisalProgressDto } from '../dtos/get-appraisal-progress.dto';
import { SendReminderDto } from '../dtos/send-reminder.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Role,Roles } from '../../auth/decorators/roles.decorator';
import { SystemRole } from '../../employee-profile/enums/employee-profile.enums';

@UseGuards(AuthGuard)
@Controller('api/performance/appraisals')
export class AppraisalController {
  constructor(private readonly appraisalService: AppraisalService) {}

  // IMPORTANT: Static routes must come before parameterized routes

  @Post('progress')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async getProgress(@Body() dto: GetAppraisalProgressDto) {
    try {
      console.log('getProgress called with:', dto);
      return await this.appraisalService.getProgress(dto);
    } catch (error) {
      console.error('getProgress error:', error);
      throw error;
    }
  }

  @Post('send-reminders')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async sendReminders(@Body() dto: SendReminderDto, @Req() req) {
    return this.appraisalService.sendReminders(dto, req.user?.employeeId);
  }

  @Get('my-appraisals')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async getMyAppraisals(@Req() req) {
    console.log('[AppraisalController] GET /my-appraisals for:', req.user?.employeeId);
    return this.appraisalService.getMyAppraisals(req.user?.employeeId);
  }

  @Get('employee/:employeeId')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async getByEmployeeId(@Param('employeeId') employeeId: string) {
    console.log('[AppraisalController] GET /employee/:employeeId for:', employeeId);
    return this.appraisalService.getMyAppraisals(employeeId);
  }

  // Parameterized routes come after static routes

  @Get(':recordId/employee/:employeeId')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async view(@Param('recordId') recordId: string, @Param('employeeId') employeeId: string) {
    return this.appraisalService.view({ appraisalRecordId: recordId, employeeId });
  }

  @Put(':recordId/employee/:employeeId/acknowledge')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async acknowledge(
    @Param('recordId') recordId: string,
    @Param('employeeId') employeeId: string,
    @Body('comment') comment?: string,
  ) {
    return this.appraisalService.acknowledge({ appraisalRecordId: recordId, employeeId, comment });
  }

  @Put(':id/acknowledge')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async acknowledgeAppraisal(@Param('id') id: string, @Body() body: { comment?: string }, @Req() req) {
    return this.appraisalService.acknowledgeAppraisal(id, req.user?.employeeId, body.comment);
  }

  @Put(':id/employee/me/acknowledge')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async acknowledgeAppraisalMe(@Param('id') id: string, @Body() body: { comment?: string }, @Req() req) {
    return this.appraisalService.acknowledgeAppraisal(id, req.user?.employeeId, body.comment);
  }
}
    