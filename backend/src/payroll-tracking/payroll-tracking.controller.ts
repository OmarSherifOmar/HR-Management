import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

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
 * - In tests (NODE_ENV === 'test') it returns a no-op decorator to avoid instantiating JwtService.
 * - In prod it applies real guards.
 */
function MaybeUseGuards(...guards: any[]) {
  if (process.env.NODE_ENV === 'test') {
    return function () {} as any;
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

  @Get('disputes')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER, Role.SYSTEM_ADMIN)
  async listDisputes(@Query('status') status?: string) {
    return this.svc.listDisputes({ status });
  }

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

  @Patch('disputes/:id/manager-approve')
  @Roles(Role.Payroll_MANAGER)
  async managerApprove(@Param('id') id: string, @Req() req: any) {
    const { userId } = this.extractUser(req);
    return this.svc.managerApproveDispute(id, userId);
  }

  @Get('transparency/summary')
  @Roles(Role.Payroll_MANAGER, Role.FINANCE_STAFF, Role.SYSTEM_ADMIN)
  async getTransparency() {
    return this.svc.transparencySummary();
  }

  @Post('refunds')
  @Roles(Role.FINANCE_STAFF)
  async processRefund(@Req() req: any, @Body() dto: ProcessRefundDto) {
    const { userId, role } = this.extractUser(req);
    return this.svc.processRefund({ userId, role }, dto);
  }

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

  @Get('me/payslips')
  getMyPayslips(@Req() req: Request & { user?: { sub?: string } }) {
    const employeeId = req.user?.sub;
    if (!employeeId) throw new ForbiddenException('User ID missing in token');
    return this.svc.getPayslipsForEmployee(employeeId);
  }

  @Get('me/payslips/:id')
  getMyPayslip(
    @Req() req: Request & { user?: { sub?: string } },
    @Param('id') payslipId: string,
  ) {
    const employeeId = req.user?.sub;
    if (!employeeId) throw new ForbiddenException('User ID missing in token');
    return this.svc.getPayslipById(employeeId, payslipId);
  }

  @Get('me/payslips/:id/download')
  async downloadMyPayslip(
    @Req() req: Request & { user?: { sub?: string } },
    @Param('id') payslipId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const employeeId = req.user?.sub;
    if (!employeeId) throw new ForbiddenException('User ID missing in token');

    const csvBuffer = await this.svc.downloadPayslipCsv(employeeId, payslipId);
    if (!csvBuffer)
      throw new NotFoundException('Payslip not found or access denied');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payslip_${payslipId}.csv"`,
    );

    return csvBuffer;
  }

  @Get('me/base-salary')
  async getMyBaseSalary(@Req() req: Request & { user?: { sub?: string } }) {
    const employeeId = req.user?.sub;
    if (!employeeId) throw new ForbiddenException('User ID missing in token');
    return this.svc.getBaseSalaryForEmployee(employeeId);
  }

  @Get('me/leave-compensation')
  async getMyLeaveCompensation(
    @Req() req: Request & { user?: { sub?: string } },
    @Query('remainingDays') remainingDaysStr: string,
    @Query('encash') encashStr?: string,
    @Query('workingDays') workingDaysStr?: string,
  ) {
    const employeeId = req.user?.sub;
    if (!employeeId) throw new ForbiddenException('User ID missing in token');

    if (!remainingDaysStr)
      throw new BadRequestException(
        'Query param `remainingDays` is required and must be a number',
      );

    const remainingDays = Number(remainingDaysStr);
    if (isNaN(remainingDays) || remainingDays < 0)
      throw new BadRequestException(
        '`remainingDays` must be a non-negative number',
      );

    const encash = encashStr === undefined ? true : encashStr !== 'false';

    let workingDays: number | undefined = undefined;
    if (workingDaysStr) {
      const num = Number(workingDaysStr);
      if (isNaN(num) || num <= 0)
        throw new BadRequestException('`workingDays` must be a positive number');
      workingDays = num;
    }

    return this.svc.calculateLeaveCompensation(
      employeeId,
      remainingDays,
      encash,
      workingDays,
    );
  }

  @Get('me/commute-compensation')
  async getMyCommuteCompensation(
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    const employeeId = req.user?.sub;
    if (!employeeId) throw new ForbiddenException('User ID missing in token');
    return this.svc.calculateCommuteCompensation(employeeId);
  }

  @Get('me/tax-deductions')
  async getMyTaxDeductions(@Req() req: Request & { user?: { sub?: string } }) {
    const employeeId = req.user?.sub;
    if (!employeeId) throw new ForbiddenException('User ID missing in token');
    return this.svc.calculateTaxBreakdown(employeeId);
  }

  @Get('me/insurance-deductions')
  async getMyInsuranceDeductions(
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    const employeeId = req.user?.sub;
    if (!employeeId) throw new ForbiddenException('User ID missing in token');
    return this.svc.calculateInsuranceBreakdown(employeeId);
  }

  @Get('me/misconduct-deductions')
  async getMyMisconductDeductions(
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    const employeeId = req.user?.sub;
    if (!employeeId) throw new ForbiddenException('User ID missing in token');
    return this.svc.calculateMisconductDeductions(employeeId);
  }

  @Get('me/unpaid-leave-deductions')
  async getMyUnpaidLeaveDeductions(
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    const employeeId = req.user?.sub;
    if (!employeeId) throw new ForbiddenException('User ID missing in token');
    return this.svc.calculateUnpaidLeaveDeductions(employeeId);
  }
}
