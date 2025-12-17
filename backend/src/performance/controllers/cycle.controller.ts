import { Controller, Get, Post, Put, Param, Body, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { CycleService } from '../services/cycle.service';
import { CreateCycleDto, UpdateCycleDto } from '../dtos/create-cycle.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Role, Roles } from '../../auth/decorators/roles.decorator';
@UseGuards(AuthGuard)
@Controller('api/performance/cycles')
export class CycleController {
  constructor(private readonly cycleService: CycleService) {}

  @Post()
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async create(@Body() dto: CreateCycleDto, @Req() req) {
    try {
      console.log('CycleController.create called with dto:', dto);
      const result = await this.cycleService.create(dto, req.user?.employeeId);
      console.log('CycleController.create succeeded:', result._id);
      return result;
    } catch (error) {
      console.error('CycleController.create error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to create cycle');
    }
  }

  @Get()
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findAll(@Query() filters: any) {
    console.log('CycleController.findAll called with filters:', filters);
    const result = await this.cycleService.findAll(filters);
    console.log('CycleController.findAll returning:', result.length, 'cycles');
    return result;
  }

  @Get(':id')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findById(@Param('id') id: string) {
    return this.cycleService.findById(id);
  }

  @Put(':id')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateCycleDto, @Req() req) {
    try {
      return await this.cycleService.update(id, dto, req.user?.employeeId);
    } catch (error) {
      console.error('CycleController.update error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to update cycle');
    }
  }

  @Put(':id/activate')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async activate(@Param('id') id: string, @Req() req) {
    try {
      return await this.cycleService.activate(id, req.user?.employeeId);
    } catch (error) {
      console.error('CycleController.activate error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to activate cycle');
    }
  }

  @Put(':id/close')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async close(@Param('id') id: string, @Req() req) {
    try {
      return await this.cycleService.close(id, req.user?.employeeId);
    } catch (error) {
      console.error('CycleController.close error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to close cycle');
    }
  }
}
