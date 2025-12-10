import { Controller, Get, Post, Put, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { TemplateService } from '../services/template.service';
import { CreateTemplateDto, UpdateTemplateDto } from '../dtos/create-template.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';

@UseGuards(AuthGuard)
@Controller('api/performance/templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post('/create')
  async create(@Body() dto: CreateTemplateDto, @Req() req) {
    return this.templateService.create(dto, req.user?.employeeId);
  }

  @Get()
  async findAll(@Query() filters: any) {
    return this.templateService.findAll(filters);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.templateService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto, @Req() req) {
    return this.templateService.update(id, dto, req.user?.employeeId);
  }

  @Put(':id/deactivate')
  async deactivate(@Param('id') id: string, @Req() req) {
    return this.templateService.deactivate(id, req.user?.employeeId);
  }
}
