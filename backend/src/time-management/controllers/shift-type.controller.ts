import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ShiftTypeService } from '../services/shift-type.service';
import { CreateShiftTypeDto } from '../dtos/shift-type/create-shift-type.dto';
import { UpdateShiftTypeDto } from '../dtos/shift-type/update-shift-type.dto';

@Controller('shift-types')
export class ShiftTypeController {
  constructor(private readonly shiftTypeService: ShiftTypeService) {}

  @Post()
  create(@Body() createShiftTypeDto: CreateShiftTypeDto) {
    return this.shiftTypeService.create(createShiftTypeDto);
  }

  @Get()
  findAll() {
    return this.shiftTypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftTypeService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateShiftTypeDto: UpdateShiftTypeDto) {
    return this.shiftTypeService.update(id, updateShiftTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftTypeService.delete(id);
  }
}