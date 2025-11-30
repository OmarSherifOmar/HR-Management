import { 
    Controller, Get, Post, Body, Patch, Param, Delete, Query 
  } from '@nestjs/common';
  import { JobTemplateService } from '../services/job-template.service';
  import { CreateJobTemplateDto, UpdateJobTemplateDto } from '../dtos/create-job-template.dto';
  
  @Controller('job-templates')
  export class JobTemplateController {
    constructor(private readonly jobTemplateService: JobTemplateService) {}
  
    @Post()
    create(@Body() createJobTemplateDto: CreateJobTemplateDto) {
      return this.jobTemplateService.create(createJobTemplateDto);
    }
  
    @Get()
    findAll() {
      return this.jobTemplateService.findAll();
    }
  
    @Get('department/:department')
    findByDepartment(@Param('department') department: string) {
      return this.jobTemplateService.findByDepartment(department);
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.jobTemplateService.findOne(id);
    }
  
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateJobTemplateDto: UpdateJobTemplateDto) {
      return this.jobTemplateService.update(id, updateJobTemplateDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.jobTemplateService.remove(id);
    }
  }