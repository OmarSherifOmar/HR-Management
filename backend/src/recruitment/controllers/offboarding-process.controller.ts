import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { OffboardingProcessService } from '../services/offboarding-process.service';
import { CreateOffboardingProcessDto } from '../dtos/create-offboarding-process.dto';
import { UpdateOffboardingProcessDto } from '../dtos/update-offboarding-process.dto';
@Controller('recruitment/offboarding-processes')
export class OffboardingProcessController {
  constructor(
    private readonly offboardingService: OffboardingProcessService,
  ) {}
  @Post()
  create(@Body() dto: CreateOffboardingProcessDto) {
    return this.offboardingService.create(dto);
  }
  @Get()
  findAll() {
    return this.offboardingService.findAll();
  }
  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.offboardingService.findByEmployee(employeeId);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offboardingService.findOne(id);
  }
  @Get(':id/summary')
  getOffboardingSummary(@Param('id') id: string) {
    return this.offboardingService.getOffboardingSummary(id);
  }
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOffboardingProcessDto,
  ) {
    return this.offboardingService.update(id, dto);
  }
  @Post(':id/revoke-access')
  revokeAccess(
    @Param('id') id: string,
    @Body('revokedBy') revokedBy: string,
  ) {
    return this.offboardingService.revokeAccess(id, revokedBy);
  }
  @Post(':id/trigger-settlement')
  triggerFinalSettlement(@Param('id') id: string) {
    return this.offboardingService.triggerFinalSettlement(id);
  }
  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.offboardingService.complete(id);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.offboardingService.remove(id);
  }
}
