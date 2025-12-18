import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { CompanyWideSettingsService } from '../services/company-wide-settings.service';
import { CreateCompanyWideSettingsDto } from '../dtos/CreateCompanyWideSettingsDto';
import { UpdateCompanyWideSettingsDto } from '../dtos/UpdateCompanyWideSettingsDto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/decorators/roles.decorator';
import { authorizationGuard } from '../../auth/guards/authorization.guard';
import { AuthGuard } from '../../auth/guards/authentication.guard';

@Controller('payroll-configuration/company-wide-settings')
@UseGuards(AuthGuard, authorizationGuard)
@Roles(Role.SYSTEM_ADMIN)
export class CompanyWideSettingsController {
  constructor(
    private readonly companyWideSettingsService: CompanyWideSettingsService,
  ) {}

  @Post()
  async create(@Body() dto: CreateCompanyWideSettingsDto) {
    return this.companyWideSettingsService.create(dto);
  }

  @Get()
  async findAll() {
    return this.companyWideSettingsService.findAll();
  }

  @Get('current')
  async findCurrent() {
    return this.companyWideSettingsService.findOne();
  }

  @Put()
  async update(@Body() dto: UpdateCompanyWideSettingsDto) {
    return this.companyWideSettingsService.update(dto);
  }
}
