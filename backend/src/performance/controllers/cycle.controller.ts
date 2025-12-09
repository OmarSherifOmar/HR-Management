import { Controller, Get, Post, Put, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { CycleService } from '../services/cycle.service';
import { CreateCycleDto, UpdateCycleDto } from '../dtos/create-cycle.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';

@UseGuards(AuthGuard)
@Controller('api/performance/cycles')
export class CycleController {
  constructor(private readonly cycleService: CycleService) {}

  @Post()
  async create(@Body() dto: CreateCycleDto, @Req() req) {
    return this.cycleService.create(dto, req.user?.employeeId);
  }

  @Get()
  async findAll(@Query() filters: any) {
    return this.cycleService.findAll(filters);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.cycleService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCycleDto, @Req() req) {
    return this.cycleService.update(id, dto, req.user?.employeeId);
  }

  @Put(':id/activate')
  async activate(@Param('id') id: string, @Req() req) {
    return this.cycleService.activate(id, req.user?.employeeId);
  }

  @Put(':id/close')
  async close(@Param('id') id: string, @Req() req) {
    return this.cycleService.close(id, req.user?.employeeId);
  }
}
