import { Controller, Get, Post, Put, Param, Body, Query, Req, UseGuards, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { TemplateService } from '../services/template.service';
import { CreateTemplateDto, UpdateTemplateDto } from '../dtos/create-template.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';

import { Role, Roles } from '../../auth/decorators/roles.decorator';
import { SystemRole } from '../../employee-profile/enums/employee-profile.enums';


@UseGuards(AuthGuard)
@Controller('api/performance/templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTemplateDto, @Req() req) {
    try {
      console.log('TemplateController.create called with dto:', dto);
      const result = await this.templateService.create(dto, req.user?.employeeId);
      console.log('TemplateController.create succeeded:', result._id);
      return result;
    } catch (error) {
      console.error('TemplateController.create error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to create template');
    }
  }

  @Get()
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findAll(@Query() filters: any) {
    return this.templateService.findAll(filters);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findById(@Param('id') id: string) {
    return this.templateService.findById(id);
  }

  @Put(':id')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto, @Req() req) {
    try {
      return await this.templateService.update(id, dto, req.user?.employeeId);
    } catch (error) {
      console.error('TemplateController.update error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to update template');
    }
  }

  @Put(':id/deactivate')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async deactivate(@Param('id') id: string, @Req() req) {
    try {
      return await this.templateService.deactivate(id, req.user?.employeeId);
    } catch (error) {
      console.error('TemplateController.deactivate error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to deactivate template');
    }
  }
}