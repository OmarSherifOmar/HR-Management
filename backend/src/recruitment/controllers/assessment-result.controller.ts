import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { AssessmentResultService } from '../services/assessment-result.service';
import { CreateAssessmentResultDto } from '../dtos/create-assessment-result.dto';
import { UpdateAssessmentResultDto } from '../dtos/update-assessment-result.dto';

@Controller('recruitment/assessment-results')
export class AssessmentResultController {
  constructor(private readonly service: AssessmentResultService) {}

  @Post()
  create(@Body() dto: CreateAssessmentResultDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('interview/:interviewId')
  findByInterview(@Param('interviewId') interviewId: string) {
    return this.service.findByInterview(interviewId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAssessmentResultDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}