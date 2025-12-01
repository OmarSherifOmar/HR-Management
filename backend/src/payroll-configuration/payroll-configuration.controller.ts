import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ConfigurationApprovalService } from './services/configuration-approval.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/decorators/roles.decorator';
import { authorizationGuard } from '../auth/guards/authorization.guard';
import { AuthGuard } from '../auth/guards/authentication.guard';

@Controller('payroll-configuration')
@UseGuards(AuthGuard, authorizationGuard)
export class PayrollConfigurationController {
  constructor(
    private readonly approvalService: ConfigurationApprovalService,
  ) {}

  // Generic endpoints for viewing all configuration types (Payroll Manager)
  @Get('/:type')
  @Roles(Role.Payroll_MANAGER)
  async findAllByType(@Param('type') type: string) {
    return this.approvalService.findAll(type);
  }

  @Get('/:type/:id')
  @Roles(Role.Payroll_MANAGER)
  async findOneByType(@Param('type') type: string, @Param('id') id: string) {
    return this.approvalService.findOne(type, id);
  }

  // Approval endpoints (Payroll Manager only)
  @Post('/:type/:id/approve')
  @Roles(Role.Payroll_MANAGER)
  async approve(
    @Param('type') type: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const approverId = req.user?._id;
    return this.approvalService.approve(type, id, approverId);
  }

  @Post('/:type/:id/reject')
  @Roles(Role.Payroll_MANAGER)
  async reject(
    @Param('type') type: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const approverId = req.user?._id;
    return this.approvalService.reject(type, id, approverId);
  }

  // Update endpoint for draft configurations (Payroll Manager only)
  @Put('/:type/:id')
  @Roles(Role.Payroll_MANAGER)
  async update(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() payload: any,
    @Req() req: any,
  ) {
    const updatedBy = req.user?._id;
    return this.approvalService.update(type, id, payload, updatedBy);
  }

  // Delete endpoint (Payroll Manager only, excludes insurance and company-wide settings)
  @Delete('/:type/:id')
  @Roles(Role.Payroll_MANAGER)
  async delete(@Param('type') type: string, @Param('id') id: string) {
    // Prevent deletion of insurance and company-wide settings at the endpoint level
    if (type === 'insuranceBrackets' || type === 'CompanyWideSettings') {
      throw new Error(`Cannot delete ${type} via this endpoint. Use specific endpoints.`);
    }
    return this.approvalService.remove(type, id);
  }
}
