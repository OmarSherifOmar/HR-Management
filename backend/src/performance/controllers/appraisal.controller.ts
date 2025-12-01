import { Controller, Get, Post, Put, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { AppraisalService } from '../services/appraisal.service';
import { ViewAppraisalDto } from '../dtos/view-appraisal.dto';
import { AcknowledgeAppraisalDto } from '../dtos/acknowledge-appraisal.dto';
import { GetAppraisalProgressDto } from '../dtos/get-appraisal-progress.dto';
import { SendReminderDto } from '../dtos/send-reminder.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';

@UseGuards(AuthGuard)
@Controller('api/performance/appraisals')
export class AppraisalController {
  constructor(private readonly appraisalService: AppraisalService) {}

  @Get(':recordId/employee/:employeeId')
  async view(@Param('recordId') recordId: string, @Param('employeeId') employeeId: string) {
    return this.appraisalService.view({ appraisalRecordId: recordId, employeeId });
  }

  @Put(':recordId/employee/:employeeId/acknowledge')
  async acknowledge(
    @Param('recordId') recordId: string,
    @Param('employeeId') employeeId: string,
    @Body('comment') comment?: string,
  ) {
    return this.appraisalService.acknowledge({ appraisalRecordId: recordId, employeeId, comment });
  }

  @Post('progress')
  async getProgress(@Body() dto: GetAppraisalProgressDto) {
    return this.appraisalService.getProgress(dto);
  }

  @Post('send-reminders')
  async sendReminders(@Body() dto: SendReminderDto, @Req() req) {
    return this.appraisalService.sendReminders(dto, req.user?.employeeId);
  }
}
