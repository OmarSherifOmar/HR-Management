import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ConfigurationApprovalService } from '../services/configuration-approval.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/decorators/roles.decorator';
import { authorizationGuard } from '../../auth/guards/authorization.guard';
import { AuthGuard } from '../../auth/guards/authentication.guard';

@Controller('configurations')
@UseGuards(AuthGuard, authorizationGuard)
export class ConfigurationApprovalsController {
  constructor(private readonly svc: ConfigurationApprovalService) {}

  @Get(':type')
  @Roles(Role.Payroll_MANAGER)
  async list(@Param('type') type: string) {
    return this.svc.findAll(type);
  }

  @Get(':type/:id')
  @Roles(Role.Payroll_MANAGER)
  async get(@Param('type') type: string, @Param('id') id: string) {
    return this.svc.findOne(type, id);
  }

  @Put(':type/:id')
  @Roles(Role.Payroll_MANAGER)
  async update(@Param('type') type: string, @Param('id') id: string, @Body() body: any, @Req() req: any) {
    const user = req.user?._id;
    return this.svc.update(type, id, body, user);
  }

  @Post(':type/:id/approve')
  @Roles(Role.Payroll_MANAGER)
  async approve(@Param('type') type: string, @Param('id') id: string, @Req() req: any) {
    const user = req.user?._id;
    return this.svc.approve(type, id, user);
  }

  @Post(':type/:id/reject')
  @Roles(Role.Payroll_MANAGER)
  async reject(@Param('type') type: string, @Param('id') id: string, @Req() req: any) {
    const user = req.user?._id;
    return this.svc.reject(type, id, user);
  }

  @Delete(':type/:id')
  @Roles(Role.Payroll_MANAGER)
  async remove(@Param('type') type: string, @Param('id') id: string) {
    return this.svc.remove(type, id);
  }
}
