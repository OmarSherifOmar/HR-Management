import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TerminationRequestService } from '../services/termination-request.service';
import { CreateTerminationRequestDto } from '../dtos/create-termination-request.dto';
import { UpdateTerminationRequestDto } from '../dtos/update-termination-request.dto';
@Controller('recruitment/termination-requests')
export class TerminationRequestController {
  constructor(
    private readonly terminationService: TerminationRequestService,
  ) {}
  @Post()
  create(@Body() dto: CreateTerminationRequestDto) {
    return this.terminationService.create(dto);
  }
  @Get()
  findAll() {
    return this.terminationService.findAll();
  }
  @Get('pending')
  findPendingRequests() {
    return this.terminationService.findPendingRequests();
  }
  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.terminationService.findByEmployee(employeeId);
  }
  @Get('employee/:employeeId/performance-data')
  getEmployeePerformanceData(@Param('employeeId') employeeId: string) {
    return this.terminationService.getEmployeePerformanceData(employeeId);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.terminationService.findOne(id);
  }
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTerminationRequestDto,
  ) {
    return this.terminationService.update(id, dto);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.terminationService.remove(id);
  }
}
