import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { JobRequisitionService } from '../services/job-requisition.service';
import { CreateJobRequisitionDto } from '../dtos/create-job-requisition.dto';
import { UpdateJobRequisitionDto } from '../dtos/update-job-requisition.dto';

@Controller('recruitment/job-requisitions')
export class JobRequisitionController {
  constructor(private readonly service: JobRequisitionService) {}

  @Post()
  create(@Body() dto: CreateJobRequisitionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: string) {
    return this.service.findByStatus(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJobRequisitionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}