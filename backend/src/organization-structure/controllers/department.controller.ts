import { Controller, Post, Get, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { CreateDepartmentDto } from '../dtos/create-department.dto';
import { UpdateDepartmentDto } from '../dtos/update-department.dto';
import { DepartmentService } from '../services/department.service';
import { AuthGuard } from '../../auth/./guards/authentication.guard';
import { authorizationGuard } from '../../auth/./guards/authorization.guard';
import { Roles, Role } from '../../auth/./decorators/roles.decorator';


@UseGuards(AuthGuard)
@Controller('api/org/departments')
export class DepartmentController {
  constructor(private readonly svc: DepartmentService) {}

  @Post('/createDepartment')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async create(@Body() dto: CreateDepartmentDto, @Req() req) {
    return this.svc.create(dto, req.user?.employeeId);
  }

  @Get()
  async list(@Query('active') active = 'true') {
    const activeOnly = active === 'true';
    return this.svc.findAll(activeOnly);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  @Patch(':id')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @Req() req) {
    return this.svc.update(id, dto, req.user?.employeeId);
  }

  @Post(':id/activePositions')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async FindActivePoistions(@Param('id') id: string) {
    return this.svc.FindActivePoistions(id);
  }

  @Post(':id/deactivate')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async deactivate(@Param('id') id: string, @Req() req) {
    return this.svc.deactivate(id, req.user?.employeeId);
  }

  @Delete(':id')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async delete(@Param('id') id: string, @Req() req) {
    return this.svc.delete(id, req.user?.employeeId);
  }
}