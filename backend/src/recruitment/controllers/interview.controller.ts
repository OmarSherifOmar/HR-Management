import { 
    Controller, Get, Post, Body, Patch, Param, Delete, Put 
  } from '@nestjs/common';
  import { InterviewService } from '../services/interview.service';
  import { CreateInterviewDto, UpdateInterviewDto } from '../dtos/create-interview.dto';
  
  @Controller('interviews')
  export class InterviewController {
    constructor(private readonly interviewService: InterviewService) {}
  
    @Post()
    create(@Body() createInterviewDto: CreateInterviewDto) {
      return this.interviewService.create(createInterviewDto);
    }
  
    @Get()
    findAll() {
      return this.interviewService.findAll();
    }
  
    @Get('application/:applicationId')
    findByApplication(@Param('applicationId') applicationId: string) {
      return this.interviewService.findByApplication(applicationId);
    }
  
    @Get('application/:applicationId/stage/:stage')
    findByStage(
      @Param('applicationId') applicationId: string,
      @Param('stage') stage: string,
    ) {
      return this.interviewService.findByStage(applicationId, stage);
    }
  
    @Get('panel/:panelMemberId')
    findByPanelMember(@Param('panelMemberId') panelMemberId: string) {
      return this.interviewService.findByPanelMember(panelMemberId);
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.interviewService.findOne(id);
    }
  
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateInterviewDto: UpdateInterviewDto) {
      return this.interviewService.update(id, updateInterviewDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.interviewService.remove(id);
    }
  
    @Put(':id/status/:status')
    updateStatus(@Param('id') id: string, @Param('status') status: string) {
      return this.interviewService.updateStatus(id, status);
    }
  }