import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
  Delete,
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
    @Req() req: Request,
  ): Promise<terminationAndResignationBenefitsDocument> {
    const user = req['user'];
    const createdById = user.sub;
    return this.terminationBenefitsService.createTerminationBenefit(
      createTerminationBenefitsDto,
      createdById,
    );
  }

  @Get()
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async getAllTerminationBenefits(): Promise<
    terminationAndResignationBenefitsDocument[]
  > {
    return this.terminationBenefitsService.findAllTerminationBenefits();
  }

  @Get(':id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
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

  @Post(':id/approve')
  @Roles(Role.Payroll_MANAGER)
  async approve(@Param('id') id: string, @Req() req: any) {
    const approverId = req.user?._id;
    return this.terminationBenefitsService.approve(id, approverId);
  }

  @Post(':id/reject')
  @Roles(Role.Payroll_MANAGER)
  async reject(@Param('id') id: string, @Req() req: any) {
    const approverId = req.user?._id;
    return this.terminationBenefitsService.reject(id, approverId);
  }

  @Delete(':id')
  @Roles(Role.Payroll_MANAGER)
  async delete(@Param('id') id: string) {
    return this.terminationBenefitsService.delete(id);
  }
}