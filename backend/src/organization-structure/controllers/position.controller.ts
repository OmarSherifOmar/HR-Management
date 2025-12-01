import { Controller, Post, Get, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { CreatePositionDto } from '../dtos/create-position.dto';
import { UpdatePositionDto } from '../dtos/update-position.dto';
import { PositionService } from '../services/position.service';
import { AuthGuard } from '../../auth/./guards/authentication.guard';
import { authorizationGuard } from '../../auth/./guards/authorization.guard';
import { Roles, Role } from '../../auth/./decorators/roles.decorator';

@UseGuards(AuthGuard)
@Controller('api/org/positions')
export class PositionController {
  constructor(private readonly svc: PositionService) {}

  @Post('/create')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async create(@Body() dto: CreatePositionDto, @Req() req) {
    return this.svc.create(dto, req.user?.employeeId);
  }

  @Get()
  async list(@Query('departmentId') departmentId?: string, @Query('active') active = 'true') {
    const filters: any = {};
    if (departmentId) filters.departmentId = departmentId;
    if (active === 'true') filters.isActive = true;
    return this.svc.findAll(filters);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  @Patch(':id/update')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdatePositionDto, @Req() req) {
    return this.svc.update(id, dto, req.user?.employeeId);
  }

  @Post(':id/deactivate')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async deactivate(@Param('id') id: string, @Req() req) {
    return this.svc.deactivate(id, req.user?.employeeId);
  }

  @Delete(':id/delete')
  @UseGuards(authorizationGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async delete(@Param('id') id: string, @Req() req) {
    return this.svc.delete(id, req.user?.employeeId);
  }
}
