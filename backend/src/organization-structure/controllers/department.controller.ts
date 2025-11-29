import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
// DTO imports assumed present in your repo
import { CreateDepartmentDto } from '../dtos/create-department.dto';
import { UpdateDepartmentDto } from '../dtos/update-department.dto';
import { DepartmentService } from '../services/department.service';

// Auth/roles guards assumed to exist in app (JwtAuthGuard, RolesGuard, Roles decorator)
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';


//create, delete, edit, list, get, findactive to deactivate


@UseGuards(RolesGuard)
@Controller('api/org/departments')
export class DepartmentController {
  constructor(private readonly svc: DepartmentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('SYSTEM_ADMIN', 'HR_ADMIN')
  async create(@Body() dto: CreateDepartmentDto, @Req() req) {
    return this.svc.create(dto, req.user?.employeeId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Query('active') active = 'true') {
    return this.svc.findAll(active === 'true');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async get(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('SYSTEM_ADMIN', 'HR_ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @Req() req) {
    return this.svc.update(id, dto, req.user?.employeeId);
  }

  @Get(':id/FindActive')
  @UseGuards(JwtAuthGuard)
  @Roles('SYSTEM_ADMIN', 'HR_ADMIN', 'MANAGER')
  async FindActive(@Param('id') id: string) {
    return this.svc.FindActive(id);
  }

  @Post(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @Roles('SYSTEM_ADMIN', 'HR_ADMIN')
  async deactivate(@Param('id') id: string, @Req() req) {
    return this.svc.deactivate(id, req.user?.employeeId);
  }
}
