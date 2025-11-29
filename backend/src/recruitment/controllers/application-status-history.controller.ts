import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApplicationStatusHistoryService } from '../services/application-status-history.service';
import { CreateApplicationStatusHistoryDto } from '../dtos/create-application-status-history.dto';
import { UpdateApplicationStatusHistoryDto } from '../dtos/update-application-status-history.dto';

@Controller('recruitment/application-status-history')
export class ApplicationStatusHistoryController {
  constructor(
    private readonly historyService: ApplicationStatusHistoryService,
  ) {}

  @Post()
  create(@Body() dto: CreateApplicationStatusHistoryDto) {
    return this.historyService.create(dto);
  }

  @Get()
  findAll() {
    return this.historyService.findAll();
  }

  @Get('application/:applicationId')
  findByApplication(@Param('applicationId') applicationId: string) {
    return this.historyService.findByApplication(applicationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.historyService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusHistoryDto,
  ) {
    return this.historyService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.historyService.remove(id);
  }
}