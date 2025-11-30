import { 
    Controller, Get, Post, Body, Patch, Param, Delete, Put 
  } from '@nestjs/common';
  import { ApplicationService } from '../services/application.service';
  import { CreateApplicationDto, UpdateApplicationDto } from '../dtos/create-application.dto';
  
  @Controller('applications')
  export class ApplicationController {
    constructor(private readonly applicationService: ApplicationService) {}
  
    @Post()
    create(@Body() createApplicationDto: CreateApplicationDto) {
      return this.applicationService.create(createApplicationDto);
    }
  
    @Get()
    findAll() {
      return this.applicationService.findAll();
    }
  
    @Get('candidate/:candidateId')
    findByCandidate(@Param('candidateId') candidateId: string) {
      return this.applicationService.findByCandidate(candidateId);
    }
  
    @Get('requisition/:requisitionId')
    findByRequisition(@Param('requisitionId') requisitionId: string) {
      return this.applicationService.findByRequisition(requisitionId);
    }
  
    @Get('hr/:hrId')
    findByHr(@Param('hrId') hrId: string) {
      return this.applicationService.findByHr(hrId);
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.applicationService.findOne(id);
    }
  
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateApplicationDto: UpdateApplicationDto) {
      return this.applicationService.update(id, updateApplicationDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.applicationService.remove(id);
    }
  
    @Put(':id/stage/:stage')
    updateStage(@Param('id') id: string, @Param('stage') stage: string) {
      return this.applicationService.updateStage(id, stage);
    }
  
    @Put(':id/status/:status')
    updateStatus(@Param('id') id: string, @Param('status') status: string) {
      return this.applicationService.updateStatus(id, status);
    }
  }