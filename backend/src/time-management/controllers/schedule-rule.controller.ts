import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ScheduleRuleService } from '../services/schedule-rule.service';
import { CreateScheduleRuleDto } from '../dtos/schedule-rule/create-schedule-rule.dto';
import { UpdateScheduleRuleDto } from '../dtos/schedule-rule/update-schedule-rule.dto';
import { ScheduleRuleDocument } from '../models/schedule-rule.schema';

@Controller('time-management/schedule-rules')
export class ScheduleRuleController {
  constructor(private readonly scheduleRuleService: ScheduleRuleService) {}

  @Post()
  async create(@Body() createScheduleRuleDto: CreateScheduleRuleDto): Promise<ScheduleRuleDocument> {
    return this.scheduleRuleService.create(createScheduleRuleDto);
  }

  @Get()
  async findAll(@Query() filters: any): Promise<ScheduleRuleDocument[]> {
    return this.scheduleRuleService.findAll(filters);
  }

  @Get('active')
  async findActive(): Promise<ScheduleRuleDocument[]> {
    return this.scheduleRuleService.findActive();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ScheduleRuleDocument> {
    return this.scheduleRuleService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateScheduleRuleDto: UpdateScheduleRuleDto,
  ): Promise<ScheduleRuleDocument> {
    return this.scheduleRuleService.update(id, updateScheduleRuleDto);
  }

  @Delete(':id/soft')
  async softDelete(@Param('id') id: string): Promise<ScheduleRuleDocument> {
    return this.scheduleRuleService.softDelete(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<ScheduleRuleDocument> {
    return this.scheduleRuleService.delete(id);
  }
}
