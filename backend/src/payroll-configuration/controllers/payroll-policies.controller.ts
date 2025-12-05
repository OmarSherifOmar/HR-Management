import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PayrollPoliciesService } from '../services/payroll-policies.service';
import { CreatePayrollPolicyDto } from '../dtos/create-payroll-policy.dto';
import { UpdatePayrollPolicyDto } from '../dtos/update-payroll-policy.dto';
import { payrollPoliciesDocument } from '../models/payrollPolicies.schema';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

@Controller('payroll-configuration/payroll-policies')
@UseGuards(AuthGuard)
export class PayrollPoliciesController {
  constructor(
    private readonly payrollPoliciesService: PayrollPoliciesService,
  ) {}

  @Post()
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER, Role.SYSTEM_ADMIN)
  async createPayrollPolicy(
    @Body() createPayrollPolicyDto: CreatePayrollPolicyDto,
  ): Promise<payrollPoliciesDocument> {
    return this.payrollPoliciesService.createPayrollPolicy(
      createPayrollPolicyDto,
    );
  }

  @Get()
  async getAllPayrollPolicies(): Promise<payrollPoliciesDocument[]> {
    return this.payrollPoliciesService.findAllPayrollPolicies();
  }

  @Get(':id')
  async getPayrollPolicyById(
    @Param('id') id: string,
  ): Promise<payrollPoliciesDocument> {
    return this.payrollPoliciesService.findOnePayrollPolicy(id);
  }

  @Patch(':id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER, Role.SYSTEM_ADMIN)
  async updatePayrollPolicy(
    @Param('id') id: string,
    @Body() updatePayrollPolicyDto: UpdatePayrollPolicyDto,
  ): Promise<payrollPoliciesDocument> {
    return this.payrollPoliciesService.updatePayrollPolicy(
      id,
      updatePayrollPolicyDto,
    );
  }
}
