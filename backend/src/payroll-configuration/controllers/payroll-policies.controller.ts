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
  @Roles(Role.PAYROLL_SPECIALIST)
  async createPayrollPolicy(
    @Body() createPayrollPolicyDto: CreatePayrollPolicyDto,
    @Req() req: Request,
  ): Promise<payrollPoliciesDocument> {
    const user = req['user'];
    const createdById = user.sub;
    return this.payrollPoliciesService.createPayrollPolicy(
      createPayrollPolicyDto,
      createdById,
    );
  }

  @Get()
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async getAllPayrollPolicies(): Promise<payrollPoliciesDocument[]> {
    return this.payrollPoliciesService.findAllPayrollPolicies();
  }

  @Get(':id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async getPayrollPolicyById(
    @Param('id') id: string,
  ): Promise<payrollPoliciesDocument> {
    return this.payrollPoliciesService.findOnePayrollPolicy(id);
  }

  @Patch(':id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async updatePayrollPolicy(
    @Param('id') id: string,
    @Body() updatePayrollPolicyDto: UpdatePayrollPolicyDto,
  ): Promise<payrollPoliciesDocument> {
    return this.payrollPoliciesService.updatePayrollPolicy(
      id,
      updatePayrollPolicyDto,
    );
  }

  @Post(':id/approve')
  @Roles(Role.Payroll_MANAGER)
  async approve(@Param('id') id: string, @Req() req: any) {
    const approverId = req.user?._id;
    return this.payrollPoliciesService.approve(id, approverId);
  }

  @Post(':id/reject')
  @Roles(Role.Payroll_MANAGER)
  async reject(@Param('id') id: string, @Req() req: any) {
    const approverId = req.user?._id;
    return this.payrollPoliciesService.reject(id, approverId);
  }

  @Delete(':id')
  @Roles(Role.Payroll_MANAGER)
  async delete(@Param('id') id: string) {
    return this.payrollPoliciesService.delete(id);
  }
}
