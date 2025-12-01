import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ClearanceChecklistService } from '../services/clearance-checklist.service';
import { CreateClearanceChecklistDto } from '../dtos/create-clearance-checklist.dto';
import { UpdateDepartmentSignoffDto } from '../dtos/update-department-signoff.dto';
import { UpdateAssetReturnDto } from '../dtos/update-asset-return.dto';
@Controller('clearance-checklists')
export class ClearanceChecklistController {
  constructor(
    private readonly checklistService: ClearanceChecklistService,
  ) {}
  @Post()
  create(@Body() dto: CreateClearanceChecklistDto) {
    return this.checklistService.create(dto);
  }
  @Get()
  findAll() {
    return this.checklistService.findAll();
  }
  @Get('offboarding/:offboardingProcessId')
  findByOffboardingProcess(
    @Param('offboardingProcessId') offboardingProcessId: string,
  ) {
    return this.checklistService.findByOffboardingProcess(offboardingProcessId);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checklistService.findOne(id);
  }
  @Get(':id/status')
  getClearanceStatus(@Param('id') id: string) {
    return this.checklistService.getClearanceStatus(id);
  }
  @Patch(':id/signoff')
  updateDepartmentSignoff(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentSignoffDto,
  ) {
    return this.checklistService.updateDepartmentSignoff(id, dto);
  }
  @Patch(':id/asset-return')
  updateAssetReturn(
    @Param('id') id: string,
    @Body() dto: UpdateAssetReturnDto,
  ) {
    return this.checklistService.updateAssetReturn(id, dto);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checklistService.remove(id);
  }
}
