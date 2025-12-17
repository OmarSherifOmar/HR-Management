import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TerminationBenefitsService } from '../services/termination-benefits.service';
import { CreateTerminationBenefitsDto } from '../dtos/create-termination-benefits.dto';
import { UpdateTerminationBenefitsDto } from '../dtos/update-termination-benefits.dto';
import { terminationAndResignationBenefitsDocument } from '../models/terminationAndResignationBenefits';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

@Controller('payroll-configuration/termination-benefits')
@UseGuards(AuthGuard)
export class TerminationBenefitsController {
  constructor(
    private readonly terminationBenefitsService: TerminationBenefitsService,
  ) {}

  @Post()
  @Roles(Role.PAYROLL_SPECIALIST)
  async createTerminationBenefit(
    @Body() createTerminationBenefitsDto: CreateTerminationBenefitsDto,
  ): Promise<terminationAndResignationBenefitsDocument> {
    return this.terminationBenefitsService.createTerminationBenefit(
      createTerminationBenefitsDto,
    );
  }

  @Get()
  async getAllTerminationBenefits(): Promise<
    terminationAndResignationBenefitsDocument[]
  > {
    return this.terminationBenefitsService.findAllTerminationBenefits();
  }

  @Get(':id')
  async getTerminationBenefitById(
    @Param('id') id: string,
  ): Promise<terminationAndResignationBenefitsDocument> {
    return this.terminationBenefitsService.findOneTerminationBenefit(id);
  }

  @Patch(':id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async updateTerminationBenefit(
    @Param('id') id: string,
    @Body() updateTerminationBenefitsDto: UpdateTerminationBenefitsDto,
  ): Promise<terminationAndResignationBenefitsDocument> {
    return this.terminationBenefitsService.updateTerminationBenefit(
      id,
      updateTerminationBenefitsDto,
    );
  }
}