import { Body, Controller, Get, Post, Put, Param, Req, UseGuards, Delete, Patch } from '@nestjs/common';
import { TaxRulesService } from '../services/tax-rules.service';
import { CreateTaxRuleDto } from '../dtos/CreateTaxRuleDto';
import { UpdateTaxRuleDto } from '../dtos/UpdateTaxRuleDto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/decorators/roles.decorator';
import { authorizationGuard } from '../../auth/guards/authorization.guard';
import { AuthGuard } from '../../auth/guards/authentication.guard';

@Controller('payroll-configuration/tax-rules')
@UseGuards(AuthGuard, authorizationGuard)
export class TaxRulesController {
  constructor(private readonly taxRulesService: TaxRulesService) {}

  @Post()
  @Roles(Role.LEGAL_POLICY_ADMIN,)
  async create(@Body() dto: CreateTaxRuleDto, @Req() req: any) {
    const createdBy = req.user?._id;
    return this.taxRulesService.create(dto, createdBy);
  }

  @Get()
  @Roles(Role.LEGAL_POLICY_ADMIN, Role.Payroll_MANAGER)
  async findAll() {
    return this.taxRulesService.findAll();
  }

  @Get(':id')
  @Roles(Role.LEGAL_POLICY_ADMIN, Role.Payroll_MANAGER)
  async findById(@Param('id') id: string) {
    return this.taxRulesService.findById(id);
  }

  @Patch(':id')
  @Roles( Role.Payroll_MANAGER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaxRuleDto,
    @Req() req: any,
  ) {
    return this.taxRulesService.update(id, dto);
  }

  @Post(':id/approve')
  @Roles(Role.Payroll_MANAGER)
  async approve(@Param('id') id: string, @Req() req: any) {
    const approverId = req.user?._id;
    return this.taxRulesService.approve(id, approverId);
  }

  @Post(':id/reject')
  @Roles(Role.Payroll_MANAGER)
  async reject(@Param('id') id: string, @Req() req: any) {
    const approverId = req.user?._id;
    return this.taxRulesService.reject(id, approverId);
  }

  @Delete(':id')
  @Roles(Role.Payroll_MANAGER)
  async delete(@Param('id') id: string) {
    return this.taxRulesService.delete(id);
  }
}
