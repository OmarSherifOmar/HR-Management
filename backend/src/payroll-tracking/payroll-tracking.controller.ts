import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { PayrollTrackingService } from './payroll-tracking.service';
import { AuthGuard } from '../auth/guards/authentication.guard';
import type { Request, Response } from 'express';

@UseGuards(AuthGuard)
@Controller('payroll-tracking')
export class PayrollTrackingController {
  constructor(
    private readonly payrollTrackingService: PayrollTrackingService,
  ) {}

  // ---------------------------------------------------------
  // 1️⃣ GET ALL PAYSLIPS FOR LOGGED-IN EMPLOYEE
  // ---------------------------------------------------------
  @Get('me/payslips')
  getMyPayslips(@Req() req: Request & { user?: { sub?: string } }) {
    const employeeId = req.user?.sub;

    if (!employeeId) {
      throw new ForbiddenException('User ID missing in token');
    }

    return this.payrollTrackingService.getPayslipsForEmployee(employeeId);
  }

  // ---------------------------------------------------------
  // 2️⃣ VIEW A SPECIFIC PAYSLIP
  // ---------------------------------------------------------
  @Get('me/payslips/:id')
  getMyPayslip(
    @Req() req: Request & { user?: { sub?: string } },
    @Param('id') payslipId: string,
  ) {
    const employeeId = req.user?.sub;

    if (!employeeId) {
      throw new ForbiddenException('User ID missing in token');
    }

    return this.payrollTrackingService.getPayslipById(employeeId, payslipId);
  }

  // ---------------------------------------------------------
  // 3️⃣ DOWNLOAD PAYSLIP AS CSV
  // ---------------------------------------------------------
  @Get('me/payslips/:id/download')
  async downloadMyPayslip(
    @Req() req: Request & { user?: { sub?: string } },
    @Param('id') payslipId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const employeeId = req.user?.sub;

    if (!employeeId) {
      throw new ForbiddenException('User ID missing in token');
    }

    const csvBuffer = await this.payrollTrackingService.downloadPayslipCsv(
      employeeId,
      payslipId,
    );

    if (!csvBuffer) {
      throw new NotFoundException('Payslip not found or access denied');
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payslip_${payslipId}.csv"`,
    );

    return csvBuffer;
  }

  // ---------------------------------------------------------
  // 4️⃣ GET BASE SALARY ACCORDING TO EMPLOYMENT CONTRACT
  // ---------------------------------------------------------
  @Get('me/base-salary')
  async getMyBaseSalary(@Req() req: Request & { user?: { sub?: string } }) {
    const employeeId = req.user?.sub;

    if (!employeeId) {
      throw new ForbiddenException('User ID missing in token');
    }

    return this.payrollTrackingService.getBaseSalaryForEmployee(employeeId);
  }

  // ---------------------------------------------------------
  // 5️⃣ CALCULATE LEAVE COMPENSATION (ENCASHMENT ESTIMATE)
  // ---------------------------------------------------------
  @Get('me/leave-compensation')
  async getMyLeaveCompensation(
    @Req() req: Request & { user?: { sub?: string } },
    @Query('remainingDays') remainingDaysStr: string,
    @Query('encash') encashStr?: string,
    @Query('workingDays') workingDaysStr?: string,
  ) {
    const employeeId = req.user?.sub;

    if (!employeeId) {
      throw new ForbiddenException('User ID missing in token');
    }

    if (!remainingDaysStr) {
      throw new BadRequestException(
        'Query param `remainingDays` is required and must be a number',
      );
    }

    const remainingDays = Number(remainingDaysStr);
    if (Number.isNaN(remainingDays) || remainingDays < 0) {
      throw new BadRequestException(
        '`remainingDays` must be a non-negative number',
      );
    }

    const encash = encashStr === undefined ? true : encashStr !== 'false';

    let workingDays: number | undefined = undefined;
    if (workingDaysStr) {
      const w = Number(workingDaysStr);
      if (Number.isNaN(w) || w <= 0) {
        throw new BadRequestException(
          '`workingDays` must be a positive number',
        );
      }
      workingDays = w;
    }

    return this.payrollTrackingService.calculateLeaveCompensation(
      employeeId,
      remainingDays,
      encash,
      workingDays,
    );
  }

  // ---------------------------------------------------------
  // 6️⃣ GET COMMUTE / TRANSPORT COMPENSATION
  // ---------------------------------------------------------
  @Get('me/commute-compensation')
  async getMyCommuteCompensation(
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    const employeeId = req.user?.sub;

    if (!employeeId) {
      throw new ForbiddenException('User ID missing in token');
    }

    return this.payrollTrackingService.calculateCommuteCompensation(employeeId);
  }

  // ---------------------------------------------------------
  // 7️⃣ GET DETAILED TAX DEDUCTIONS
  // ---------------------------------------------------------
  @Get('me/tax-deductions')
  async getMyTaxDeductions(@Req() req: Request & { user?: { sub?: string } }) {
    const employeeId = req.user?.sub;

    if (!employeeId) {
      throw new ForbiddenException('User ID missing in token');
    }

    return this.payrollTrackingService.calculateTaxBreakdown(employeeId);
  }

  // ---------------------------------------------------------
  // 8️⃣ GET ITEMIZED INSURANCE DEDUCTIONS
  // ---------------------------------------------------------
  @Get('me/insurance-deductions')
  async getMyInsuranceDeductions(
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    const employeeId = req.user?.sub;

    if (!employeeId) {
      throw new ForbiddenException('User ID missing in token');
    }

    return this.payrollTrackingService.calculateInsuranceBreakdown(employeeId);
  }

  // ---------------------------------------------------------
  // 9️⃣ GET MISCONDUCT / UNAPPROVED ABSENTEEISM DEDUCTIONS
  // ---------------------------------------------------------
  @Get('me/misconduct-deductions')
  async getMyMisconductDeductions(
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    const employeeId = req.user?.sub;

    if (!employeeId) {
      throw new ForbiddenException('User ID missing in token');
    }

    return this.payrollTrackingService.calculateMisconductDeductions(
      employeeId,
    );
  }

  // ---------------------------------------------------------
  // 🔟 GET UNPAID LEAVE DEDUCTIONS
  // ---------------------------------------------------------
  @Get('me/unpaid-leave-deductions')
  async getMyUnpaidLeaveDeductions(
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    const employeeId = req.user?.sub;

    if (!employeeId) {
      throw new ForbiddenException('User ID missing in token');
    }

    return this.payrollTrackingService.calculateUnpaidLeaveDeductions(
      employeeId,
    );
  }
}
