import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { HolidayService } from '../services/holiday.service';
import { HolidayType } from '../models/enums';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

class CreateHolidayDto {
  type!: HolidayType;
  startDate!: string; // ISO date
  endDate?: string; // ISO date
  name?: string;
}

class UpdateHolidayDto {
  type?: HolidayType;
  startDate?: string;
  endDate?: string;
  name?: string;
  active?: boolean;
}

@Controller('time-management/holidays')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Get()
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async list() {
    return this.holidayService.listHolidays();
  }

  @Post()
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async create(@Body() body: CreateHolidayDto) {
    const { type, startDate, endDate, name } = body;
    return this.holidayService.createHoliday({
      type,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      name,
      active: true,
    } as any);
  }

  @Patch(':id')
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async update(@Param('id') id: string, @Body() body: UpdateHolidayDto) {
    const updates: any = { ...body };
    if (body.startDate) updates.startDate = new Date(body.startDate);
    if (body.endDate) updates.endDate = new Date(body.endDate);
    return this.holidayService.updateHoliday(id, updates);
  }
}
