// backend/src/payroll-tracking/payroll-tracking.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/guards/authentication.guard';
import { authorizationGuard } from '../auth/guards/authorization.guard';

import { Roles, Role } from '../auth/decorators/roles.decorator';

import { PayrollTrackingService } from './payroll-tracking.service';

import { PayrollReportQueryDto } from './dto/payroll-report-query.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';
import { CreateDisputeNoteDto } from './dto/create-dispute-note.dto';

/**
 * MaybeUseGuards decorator factory:
 * - In tests (NODE_ENV === 'test') it returns a valid no-op decorator so Jest/Nest
 *   won't try to instantiate guard dependencies like JwtService.
 * - In other environments it applies UseGuards(...) as usual.
 */
function MaybeUseGuards(...guards: any[]) {
  if (process.env.NODE_ENV === 'test') {
    return function (
      target: any,
      propertyKey?: string | symbol,
      descriptor?: PropertyDescriptor,
    ) {
      // intentionally do nothing — valid decorator for tests
    } as ClassDecorator & MethodDecorator;
  }
  return UseGuards(...guards);
}

@MaybeUseGuards(AuthGuard, authorizationGuard)
@Controller('payroll-tracking')
export class PayrollTrackingController {
  constructor(private readonly svc: PayrollTrackingService) {}

  private extractUser(req: any) {
    const user = req.user || {};
    const userId = user.sub || user.id || null;
    const role =
      user.role || (Array.isArray(user.roles) ? user.roles[0] : undefined);
    return { userId, role };
  }

  // EMPLOYEE – Get own claims
  @Get('claims/mine')
  @Roles(Role.DEPARTMENT_EMPLOYEE)
  async getMyClaims(@Req() req: any) {
    const { userId } = this.extractUser(req);
    return this.svc.getClaimsForEmployee(userId);
  }

  @Get('claims/:id')
  @Roles(Role.DEPARTMENT_EMPLOYEE)
  async getMyClaimById(@Req() req: any, @Param('id') id: string) {
    const { userId } = this.extractUser(req);
    return this.svc.getClaimByIdForEmployee(userId, id);
  }

  @Get('tax-documents/mine')
  @Roles(Role.DEPARTMENT_EMPLOYEE)
  async getMyTaxDocs(@Req() req: any) {
    const { userId } = this.extractUser(req);
    return this.svc.listTaxDocumentsForEmployee(userId);
  }

  // PAYROLL SPECIALIST + MANAGER + FINANCE + ADMIN
  @Get('reports/payroll')
  @Roles(
    Role.PAYROLL_SPECIALIST,
    Role.Payroll_MANAGER,
    Role.FINANCE_STAFF,
    Role.SYSTEM_ADMIN,
  )
  async getPayrollReport(@Query() q: PayrollReportQueryDto) {
    return this.svc.generatePayrollReport(q);
  }

  // DISPUTES LIST
  @Get('disputes')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER, Role.SYSTEM_ADMIN)
  async listDisputes(@Query('status') status?: string) {
    return this.svc.listDisputes({ status });
  }

  // UPDATE DISPUTE
  @Patch('disputes/:id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async patchDispute(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateDisputeDto,
  ) {
    const { userId, role } = this.extractUser(req);
    return this.svc.updateDispute(id, { userId, role }, dto);
  }

  // CLAIMS LIST
  @Get('claims')
  @Roles(
    Role.PAYROLL_SPECIALIST,
    Role.Payroll_MANAGER,
    Role.FINANCE_STAFF,
    Role.SYSTEM_ADMIN,
  )
  async listClaims(@Query('status') status?: string) {
    return this.svc.listClaims({ status });
  }

  // UPDATE CLAIM
  @Patch('claims/:id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async patchClaim(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateClaimDto,
  ) {
    const { userId, role } = this.extractUser(req);
    return this.svc.updateClaim(id, { userId, role }, dto);
  }

  // MANAGER APPROVAL
  @Patch('disputes/:id/manager-approve')
  @Roles(Role.Payroll_MANAGER)
  async managerApprove(@Param('id') id: string, @Req() req: any) {
    const { userId } = this.extractUser(req);
    return this.svc.managerApproveDispute(id, userId);
  }

  // TRANSPARENCY SUMMARY
  @Get('transparency/summary')
  @Roles(Role.Payroll_MANAGER, Role.FINANCE_STAFF, Role.SYSTEM_ADMIN)
  async getTransparency() {
    return this.svc.transparencySummary();
  }

  // FINANCE – REFUNDS
  @Post('refunds')
  @Roles(Role.FINANCE_STAFF)
  async processRefund(@Req() req: any, @Body() dto: ProcessRefundDto) {
    const { userId, role } = this.extractUser(req);
    return this.svc.processRefund({ userId, role }, dto);
  }

  // ADD DISPUTE NOTE
  @Post('disputes/:id/notes')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async addDisputeNote(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: CreateDisputeNoteDto,
  ) {
    const { userId, role } = this.extractUser(req);
    return this.svc.updateDispute(id, { userId, role }, { note: body.note });
  }
}
