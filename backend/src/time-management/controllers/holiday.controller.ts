import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IsEnum, IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';
import { HolidayService } from '../services/holiday.service';
import { HolidayType } from '../models/enums';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

class CreateHolidayDto {
  @IsEnum(HolidayType)
  @IsNotEmpty()
  type!: HolidayType;

  @IsString()
  @IsNotEmpty()
  startDate!: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  name?: string;
}

class UpdateHolidayDto {
  @IsEnum(HolidayType)
  @IsOptional()
  type?: HolidayType;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

@Controller('time-management/holidays')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Get()
  async list() {
    return this.holidayService.listHolidays();
  }

  @Post()
  async create(@Body() body: any) {
    console.log('=== CREATE HOLIDAY DEBUG ===');
    console.log('Received raw body:', body);
    console.log('Body type:', typeof body);
    console.log('Body.type value:', body.type);
    console.log('Body keys:', Object.keys(body));
    console.log('JSON stringified:', JSON.stringify(body));
    
    const payload: any = {
      type: body.type,
      startDate: new Date(body.startDate),
      name: body.name,
      active: true,
    };
    
    if (body.endDate) {
      payload.endDate = new Date(body.endDate);
    }
    
    console.log('Creating holiday with payload:', payload);
    return this.holidayService.createHoliday(payload);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateHolidayDto) {
    const updates: any = { ...body };
    if (body.startDate) updates.startDate = new Date(body.startDate);
    if (body.endDate) updates.endDate = new Date(body.endDate);
    return this.holidayService.updateHoliday(id, updates);
  }
}
