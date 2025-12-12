import { Controller, Get, Post, Put, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { AssignmentService } from '../services/assignment.service';
import { CreateAssignmentDto, BulkAssignmentDto } from '../dtos/create-assignment.dto';
import { SubmitAppraisalDto, PublishAppraisalDto, BulkPublishDto } from '../dtos/submit-appraisal.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';

@UseGuards(AuthGuard)
@Controller('api/performance/assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  async create(@Body() dto: CreateAssignmentDto, @Req() req) {
    return this.assignmentService.create(dto, req.user?.employeeId);
  }

  @Post('bulk')
  async bulkAssign(@Body() dto: BulkAssignmentDto, @Req() req) {
    return this.assignmentService.bulkAssign(dto, req.user?.employeeId);
  }

  @Get('manager/:managerId')
  async findByManager(@Param('managerId') managerId: string, @Query('cycleId') cycleId?: string) {
    return this.assignmentService.findByManager(managerId, cycleId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.assignmentService.findById(id);
  }

  @Put('submit')
  async submit(@Body() dto: SubmitAppraisalDto) {
    return this.assignmentService.submit(dto);
  }

  @Put('publish')
  async publish(@Body() dto: PublishAppraisalDto) {
    return this.assignmentService.publish(dto);
  }

  @Post('bulk-publish')
  async bulkPublish(@Body() dto: BulkPublishDto) {
    return this.assignmentService.bulkPublish(dto);
  }
}
