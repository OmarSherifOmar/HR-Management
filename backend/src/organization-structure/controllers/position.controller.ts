import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { CreatePositionDto } from '../dtos/create-position.dto';
import { UpdatePositionDto } from '../dtos/update-position.dto';
import { PositionService } from '../services/position.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';


// cretae, list, get, edit, deactivate


@UseGuards(RolesGuard)
@Controller('api/org/positions')
export class PositionController {
  constructor(private readonly svc: PositionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('SYSTEM_ADMIN', 'HR_ADMIN')
  async create(@Body() dto: CreatePositionDto, @Req() req) {
    return this.svc.create(dto, req.user?.employeeId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Query('departmentId') departmentId?: string, @Query('active') active = 'true') {
    const filters: any = {};
    if (departmentId) filters.departmentId = departmentId;
    if (active === 'true') filters.isActive = true;
    return this.svc.findAll(filters);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async get(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('SYSTEM_ADMIN', 'HR_ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdatePositionDto, @Req() req) {
    return this.svc.update(id, dto, req.user?.employeeId);
  }

  @Post(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @Roles('SYSTEM_ADMIN', 'HR_ADMIN')
  async deactivate(@Param('id') id: string, @Req() req) {
    return this.svc.deactivate(id, req.user?.employeeId);
  }
}
