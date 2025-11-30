import { Body, Controller, Get, Post, Put, Param, Req, UseGuards } from '@nestjs/common';
import { TaxRulesService } from '../services/tax-rules.service';
import { CreateTaxRuleDto } from '../dtos/CreateTaxRuleDto';
import { UpdateTaxRuleDto } from '../dtos/UpdateTaxRuleDto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/decorators/roles.decorator';
import { authorizationGuard } from '../../auth/guards/authorization.guard';
import { AuthGuard } from '../../auth/guards/authentication.guard';

@Controller('payroll-configuration/tax-rules')
@UseGuards(AuthGuard, authorizationGuard)
@Roles(Role.LEGAL_POLICY_ADMIN)
export class TaxRulesController {
  constructor(private readonly taxRulesService: TaxRulesService) {}
  @Post()
  async create(@Body() dto: CreateTaxRuleDto, @Req() req: any) {
    const createdBy = req.user?._id; // assume JWT auth middleware
    return this.taxRulesService.create(dto, createdBy);
  }

  @Get()
  async findAll() {
    return this.taxRulesService.findAll();
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaxRuleDto,
    @Req() req: any,
  ) {
    const updatedBy = req.user?._id; // assume JWT auth middleware
    return this.taxRulesService.update(id, dto, updatedBy);
  }
}
