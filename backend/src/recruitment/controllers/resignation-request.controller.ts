import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ResignationRequestService } from '../services/resignation-request.service';
import { CreateResignationRequestDto } from '../dtos/create-resignation-request.dto';
import { UpdateResignationRequestDto } from '../dtos/update-resignation-request.dto';
@Controller('resignation-requests')
export class ResignationRequestController {
  constructor(
    private readonly resignationService: ResignationRequestService,
  ) {}
  @Post()
  create(@Body() dto: CreateResignationRequestDto) {
    return this.resignationService.create(dto);
  }
  @Get()
  findAll() {
    return this.resignationService.findAll();
  }
  @Get('pending')
  findPendingRequests() {
    return this.resignationService.findPendingRequests();
  }
  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.resignationService.findByEmployee(employeeId);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resignationService.findOne(id);
  }
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateResignationRequestDto,
  ) {
    return this.resignationService.update(id, dto);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resignationService.remove(id);
  }
}
