import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ShiftService } from '../services/shift.service';
import { CreateShiftDto } from '../dtos/shift/create-shift.dto';
import { UpdateShiftDto } from '../dtos/shift/update-shift.dto';
import { ShiftDocument } from '../models/shift.schema';

@Controller('time-management/shifts')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post()
  async create(@Body() createShiftDto: CreateShiftDto): Promise<ShiftDocument> {
    return this.shiftService.create(createShiftDto);
  }

  @Get()
  async findAll(@Query() filters: any): Promise<ShiftDocument[]> {
    return this.shiftService.findAll(filters);
  }

  @Get('active')
  async findActive(): Promise<ShiftDocument[]> {
    return this.shiftService.findActive();
  }

  @Get('by-type/:shiftTypeId')
  async findByType(@Param('shiftTypeId') shiftTypeId: string): Promise<ShiftDocument[]> {
    return this.shiftService.findByType(shiftTypeId);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ShiftDocument> {
    return this.shiftService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateShiftDto: UpdateShiftDto,
  ): Promise<ShiftDocument> {
    return this.shiftService.update(id, updateShiftDto);
  }

  @Delete(':id/soft')
  async softDelete(@Param('id') id: string): Promise<ShiftDocument> {
    return this.shiftService.softDelete(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<ShiftDocument> {
    return this.shiftService.delete(id);
  }
}
