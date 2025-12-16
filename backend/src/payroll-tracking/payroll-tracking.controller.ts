import {
  Controller,
  Get,
  Post,
  Put,
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

/** Request type with user info from JWT */
type AuthenticatedRequest = Request & {
  user?: { sub?: string; id?: string; roles?: string[]; role?: string };
};

import { AuthGuard } from '../auth/guards/authentication.guard';
import { authorizationGuard } from '../auth/guards/authorization.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';

import { PayrollTrackingService } from './payroll-tracking.service';

import { PayrollReportQueryDto } from './dto/payroll-report-query.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';
import { CreateDisputeNoteDto } from './dto/create-dispute-note.dto';

import { CreateClaimDto } from './dto/create-claim.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { CreateRefundDto } from './dto/create-refund.dto';

import { IsOptional, IsString, IsIn } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/** DTO used by specialist + manager decision endpoints */
class SpecialistDecisionDto {
  @IsString()
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  approvedAmount?: number;
}

/** No-op guard wrapper for tests */
function MaybeUseGuards(
  ...guards: Parameters<typeof UseGuards>
): ReturnType<typeof UseGuards> {
  if (process.env.NODE_ENV === 'test') {
    // return a no-op decorator compatible with NestJS decorator type
    const noop = () => undefined;
    return noop as unknown as ReturnType<typeof UseGuards>;
  }
  return UseGuards(...guards);
}

@MaybeUseGuards(AuthGuard, authorizationGuard)
@Controller('payroll-tracking')
export class PayrollTrackingController {
  constructor(private readonly svc: PayrollTrackingService) {}

  /** extract user info helper */
  private extractUser(req: AuthenticatedRequest) {
    const user = (req.user ?? {}) as {
      sub?: string;
      id?: string;
      roles?: string[];
      role?: string;
    };
    const userId = user.sub ?? user.id ?? null;
    const role =
      user.role ?? (Array.isArray(user.roles) ? user.roles[0] : undefined);
    return { userId, role };
  }

  // ---------------------------------------------------------------------------
  // EMPLOYEE CLAIM CREATION
  // ---------------------------------------------------------------------------
  @Post('claims')
  @Roles(Role.DEPARTMENT_EMPLOYEE)
  async createClaim(
    @Body() dto: CreateClaimDto,
    @Req()
    req: Request & {
      user?: { sub?: string; id?: string; roles?: string[]; role?: string };
    },
  ) {
    const { userId } = this.extractUser(req);
    if (!userId) {
      throw new ForbiddenException('User ID missing in token');
    }

    const roles = Array.isArray(req.user?.roles)
      ? req.user.roles
      : req.user?.role
        ? [req.user.role]
        : [];

    const isHrOrAdmin =
      roles.includes(Role.HR_EMPLOYEE) ||
      roles.includes(Role.HR_MANAGER) ||
      roles.includes(Role.SYSTEM_ADMIN);

    // For regular employees, always bind the claim to their own employeeId.
    if (!isHrOrAdmin) {
      if (dto.employeeId && dto.employeeId !== userId) {
        throw new BadRequestException(
          'employeeId must match authenticated user unless HR/System Admin',
        );
      }
      dto.employeeId = userId;
    } else if (!dto.employeeId) {
      // For HR/System Admin, require an explicit employeeId or default to self.
      dto.employeeId = userId;
    }

    return this.svc.createClaim(dto);
  }

  @Post('disputes')
  @Roles(Role.DEPARTMENT_EMPLOYEE)
  async createDispute(
    @Body() dto: CreateDisputeDto,
    @Req()
    req: Request & {
      user?: { sub?: string; id?: string; roles?: string[]; role?: string };
    },
  ) {
    const { userId } = this.extractUser(req);
    if (!userId) {
      throw new ForbiddenException('User ID missing in token');
    }

    const roles = Array.isArray(req.user?.roles)
      ? req.user.roles
      : req.user?.role
        ? [req.user.role]
        : [];

    const isHrOrAdmin =
      roles.includes(Role.HR_EMPLOYEE) ||
      roles.includes(Role.HR_MANAGER) ||
      roles.includes(Role.SYSTEM_ADMIN);

    // For regular employees, always bind the dispute to their own employeeId.
    if (!isHrOrAdmin) {
      if (dto.employeeId && dto.employeeId !== userId) {
        throw new BadRequestException(
          'employeeId must match authenticated user unless HR/System Admin',
        );
      }
      dto.employeeId = userId;
    } else if (!dto.employeeId) {
      // For HR/System Admin, require an explicit employeeId or default to self.
      dto.employeeId = userId;
    }

    return this.svc.createDispute(dto);
  }

  // ---------------------------------------------------------------------------
  // CLAIM SPECIALIST DECISION
  // ---------------------------------------------------------------------------
  @Put('claims/:id/specialist-decision')
  @Roles(Role.PAYROLL_SPECIALIST)
  async claimSpecialistDecision(
    @Param('id') id: string,
    @Body() body: SpecialistDecisionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const dto = plainToInstance(SpecialistDecisionDto, body);
    const { userId } = this.extractUser(req);

    return this.svc.claimSpecialistDecision(
      id,
      dto.action,
      userId,
      dto.comment,
      dto.approvedAmount,
    );
  }

  // ---------------------------------------------------------------------------
  // CLAIM MANAGER DECISION
  // ---------------------------------------------------------------------------
  @Put('claims/:id/manager-decision')
  @Roles(Role.Payroll_MANAGER)
  async claimManagerDecision(
    @Param('id') id: string,
    @Body() body: SpecialistDecisionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const dto = plainToInstance(SpecialistDecisionDto, body);
    const { userId } = this.extractUser(req);

    return this.svc.claimManagerDecision(id, dto.action, userId, dto.comment);
  }

  // ---------------------------------------------------------------------------
  // APPROVED CLAIMS (FINANCE)
  // ---------------------------------------------------------------------------
  @Get('claims/approved')
  @Roles(Role.FINANCE_STAFF)
  async getApprovedClaims() {
    return this.svc.getApprovedClaims();
  }

  // ---------------------------------------------------------------------------
  // FINANCE REFUND FOR CLAIM
  // ---------------------------------------------------------------------------
  @Post('claims/:id/refund')
  @Roles(Role.FINANCE_STAFF)
  async createRefundForClaim(
    @Param('id') id: string,
    @Body() dto: CreateRefundDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { userId } = this.extractUser(req);
    return this.svc.createRefundForClaim(id, dto, userId);
  }

  // EXPENSE CLAIM REFUND
  @Post('claims/:id/expense-refund')
  @Roles(Role.FINANCE_STAFF)
  async createExpenseRefundForClaim(
    @Param('id') id: string,
    @Body() dto: CreateRefundDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { userId } = this.extractUser(req);
    return this.svc.createExpenseRefundForClaim(id, dto, userId);
  }

  // ---------------------------------------------------------------------------
  // DISPUTE SPECIALIST DECISION
  // ---------------------------------------------------------------------------
  @Put('disputes/:id/specialist-decision')
  @Roles(Role.PAYROLL_SPECIALIST)
  async disputeSpecialistDecision(
    @Param('id') id: string,
    @Body() body: SpecialistDecisionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const dto = plainToInstance(SpecialistDecisionDto, body);
    const { userId } = this.extractUser(req);

    return this.svc.disputeSpecialistDecision(
      id,
      dto.action,
      userId,
      dto.comment,
    );
  }

  // ---------------------------------------------------------------------------
  // DISPUTE MANAGER DECISION
  // ---------------------------------------------------------------------------
  @Put('disputes/:id/manager-decision')
  @Roles(Role.Payroll_MANAGER)
  async disputeManagerDecision(
    @Param('id') id: string,
    @Body() body: SpecialistDecisionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const dto = plainToInstance(SpecialistDecisionDto, body);
    const { userId } = this.extractUser(req);

    return this.svc.disputeManagerDecision(id, dto.action, userId, dto.comment);
  }

  // ---------------------------------------------------------------------------
  // APPROVED DISPUTES (FINANCE)
  // ---------------------------------------------------------------------------
  @Get('disputes/approved')
  @Roles(Role.FINANCE_STAFF)
  async getApprovedDisputes() {
    return this.svc.getApprovedDisputes();
  }

  // ---------------------------------------------------------------------------
  // REFUND FOR DISPUTE
  // ---------------------------------------------------------------------------
  @Post('disputes/:id/refund')
  @Roles(Role.FINANCE_STAFF)
  async createRefundForDispute(
    @Param('id') id: string,
    @Body() dto: CreateRefundDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { userId } = this.extractUser(req);
    return this.svc.createRefundForDispute(id, dto, userId);
  }

  // ---------------------------------------------------------------------------
  // PAYROLL REPORT BY DEPARTMENT
  // ---------------------------------------------------------------------------
  @Get('reports/department/:departmentId')
  @Roles(Role.PAYROLL_SPECIALIST)
  async getDepartmentReport(@Param('departmentId') departmentId: string) {
    return this.svc.getDepartmentPayrollReport(departmentId);
  }

  // ---------------------------------------------------------------------------
  // EMPLOYEE SELF-SERVICE ROUTES
  // ---------------------------------------------------------------------------

  @Get('claims/mine')
  @Roles(Role.DEPARTMENT_EMPLOYEE)
  async getMyClaims(@Req() req: AuthenticatedRequest) {
    const { userId } = this.extractUser(req);
    if (!userId) throw new ForbiddenException('User ID missing in token');
    return this.svc.getClaimsForEmployee(userId);
  }

  @Get('disputes/mine')
  @Roles(Role.DEPARTMENT_EMPLOYEE)
  async getMyDisputes(@Req() req: AuthenticatedRequest) {
    const { userId } = this.extractUser(req);
    if (!userId) throw new ForbiddenException('User ID missing in token');
    return this.svc.listDisputes({ employeeId: userId });
  }

  @Get('claims/:id')
  @Roles(
    Role.DEPARTMENT_EMPLOYEE,
    Role.PAYROLL_SPECIALIST,
    Role.Payroll_MANAGER,
    Role.FINANCE_STAFF,
    Role.SYSTEM_ADMIN,
  )
  async getClaimById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const { userId } = this.extractUser(req);

    const roles = Array.isArray(req.user?.roles)
      ? req.user.roles
      : req.user?.role
        ? [req.user.role]
        : [];

    const hasPayrollOrAdminRole = roles.some((r) =>
      [
        Role.PAYROLL_SPECIALIST,
        Role.Payroll_MANAGER,
        Role.FINANCE_STAFF,
        Role.SYSTEM_ADMIN,
      ].includes(r as Role),
    );

    // If user only has employee role (no payroll/admin), enforce ownership
    if (!hasPayrollOrAdminRole) {
      if (!userId) throw new ForbiddenException('User ID missing in token');
      return this.svc.getClaimByIdForEmployee(userId, id);
    }

    // Payroll/admin roles can view any claim
    return this.svc.getClaimById(id);
  }

  @Get('disputes/mine/:id')
  @Roles(Role.DEPARTMENT_EMPLOYEE)
  async getMyDisputeById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const { userId } = this.extractUser(req);
    if (!userId) throw new ForbiddenException('User ID missing in token');
    return this.svc.getDisputeByIdForEmployee(userId, id);
  }

  @Get('tax-documents/mine')
  @Roles(Role.DEPARTMENT_EMPLOYEE)
  async getMyTaxDocs(@Req() req: AuthenticatedRequest) {
    const { userId } = this.extractUser(req);
    return await this.svc.listTaxDocumentsForEmployee(userId);
  }

  @Get('tax-documents/mine/:year/download')
  @Roles(Role.DEPARTMENT_EMPLOYEE)
  async downloadMyTaxDocument(
    @Req() req: Request & { user?: { sub?: string } },
    @Param('year') yearStr: string,
    @Res() res: Response,
  ) {
    const employeeId = req.user?.sub;
    if (!employeeId) throw new ForbiddenException('User ID missing in token');

    const year = parseInt(yearStr, 10);
    if (isNaN(year)) throw new BadRequestException('Invalid year');

    const pdfBuffer = await this.svc.generateTaxDocumentPdf(employeeId, year);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="tax_document_${year}.pdf"`,
    );

    // Send raw PDF bytes so the client receives a proper PDF file.
    res.end(pdfBuffer);
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

  @Get('reports/payroll/export/csv')
  @Roles(
    Role.PAYROLL_SPECIALIST,
    Role.Payroll_MANAGER,
    Role.FINANCE_STAFF,
    Role.SYSTEM_ADMIN,
    Role.HR_ADMIN,
  )
  async exportPayrollReportCsv(@Query() q: PayrollReportQueryDto, @Res() res: Response) {
    const csvBuffer = await this.svc.exportPayrollReportCsv(q);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="payroll_report.csv"',
    );

    res.end(csvBuffer);
  }

  @Get('reports/payroll/export/pdf')
  @Roles(
    Role.PAYROLL_SPECIALIST,
    Role.Payroll_MANAGER,
    Role.FINANCE_STAFF,
    Role.SYSTEM_ADMIN,
    Role.HR_ADMIN,
  )
  async exportPayrollReportPdf(@Query() q: PayrollReportQueryDto, @Res() res: Response) {
    const pdfBuffer = await this.svc.exportPayrollReportPdf(q);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="payroll_report.pdf"',
    );

    res.end(pdfBuffer);
  }

  @Get('disputes')
  @Roles(
    Role.PAYROLL_SPECIALIST,
    Role.Payroll_MANAGER,
    Role.SYSTEM_ADMIN,
    Role.FINANCE_STAFF,
  )
  async listDisputes(@Query('status') status?: string) {
    return this.svc.listDisputes({ status });
  }

  @Get('disputes/:id')
  @Roles(
    Role.PAYROLL_SPECIALIST,
    Role.Payroll_MANAGER,
    Role.SYSTEM_ADMIN,
    Role.FINANCE_STAFF,
  )
  async getDisputeById(@Param('id') id: string) {
    return this.svc.getDisputeById(id);
  }

  @Patch('disputes/:id')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async patchDispute(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
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
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateClaimDto,
  ) {
    const { userId, role } = this.extractUser(req);
    return this.svc.updateClaim(id, { userId, role }, dto);
  }

  @Patch('disputes/:id/manager-approve')
  @Roles(Role.Payroll_MANAGER)
  async managerApprove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const { userId } = this.extractUser(req);
    return this.svc.managerApproveDispute(id, userId);
  }

  @Get('transparency/summary')
  @Roles(Role.Payroll_MANAGER, Role.FINANCE_STAFF, Role.SYSTEM_ADMIN)
  async getTransparency() {
    return this.svc.transparencySummary();
  }

  @Get('refunds/pending')
  @Roles(Role.FINANCE_STAFF)
  async getPendingRefunds() {
    return this.svc.getPendingRefunds();
  }

  @Post('refunds')
  @Roles(Role.FINANCE_STAFF)
  async processRefund(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ProcessRefundDto,
  ) {
    const { userId, role } = this.extractUser(req);
    return this.svc.processRefund({ userId, role }, dto);
  }

  @Post('refunds/:id/mark-paid')
  @Roles(Role.FINANCE_STAFF)
  async markRefundPaid(
    @Param('id') id: string,
    @Body('payrollRunId') payrollRunId: string,
  ) {
    if (!payrollRunId)
      throw new BadRequestException('payrollRunId is required');
    return this.svc.markRefundPaid(id, payrollRunId);
  }

  @Post('disputes/:id/notes')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async addDisputeNote(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateDisputeNoteDto,
  ) {
    const { userId, role } = this.extractUser(req);
    return this.svc.updateDispute(id, { userId, role }, { note: body.note });
  }

  // ---------------------------------------------------------------------------
  // PAYSLIP + COMPENSATION (EMPLOYEE)
  // ---------------------------------------------------------------------------

  @Get('me/refunds')
  async getMyRefunds(@Req() req: AuthenticatedRequest) {
    const { userId } = this.extractUser(req);
    if (!userId) throw new ForbiddenException('User ID missing in token');
    return this.svc.getRefundsForEmployee(userId);
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
    @Res() res: Response,
  ) {
    const employeeId = req.user?.sub;
    if (!employeeId) throw new ForbiddenException('User ID missing in token');

    const pdfBuffer = await this.svc.generatePayslipPdf(employeeId, payslipId);
    if (!pdfBuffer || !pdfBuffer.length)
      throw new NotFoundException('Payslip not found or access denied');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payslip_${payslipId}.pdf"`,
    );

    // Send raw PDF bytes so the client receives a downloadable PDF file.
    res.end(pdfBuffer);
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
        throw new BadRequestException('`workingDays` must be positive');
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

  @Get('me/salary-history')
  async getMySalaryHistory(@Req() req: Request & { user?: { sub?: string } }) {
    const employeeId = req.user?.sub;
    if (!employeeId) throw new ForbiddenException('User ID missing in token');
    return this.svc.getSalaryHistory(employeeId);
  }

  @Get('me/employer-contributions')
  async getMyEmployerContributions(
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    const employeeId = req.user?.sub;
    if (!employeeId) throw new ForbiddenException('User ID missing in token');
    return this.svc.getEmployerContributions(employeeId);
  }
}
