import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { PayrollTrackingService } from './payroll-tracking.service';
import { AuthGuard } from '../auth/guards/authentication.guard';
import type { Response } from 'express';

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
  async getMyPayslips(@Req() request: any) {
    const { user } = request as { user?: { sub?: string } };
    const employeeId = user?.sub;

    if (!employeeId) {
      throw new NotFoundException('Invalid token');
    }

    return this.payrollTrackingService.getPayslipsForEmployee(employeeId);
  }

  // ---------------------------------------------------------
  // 2️⃣ VIEW SPECIFIC PAYSLIP
  // ---------------------------------------------------------
  @Get('me/payslips/:id')
  async getMyPayslip(@Req() request: any, @Param('id') payslipId: string) {
    const { user } = request as { user?: { sub?: string } };
    const employeeId = user?.sub;

    if (!employeeId) {
      throw new NotFoundException('Invalid token');
    }

    return this.payrollTrackingService.getPayslipById(employeeId, payslipId);
  }

  // ---------------------------------------------------------
  // 3️⃣ DOWNLOAD PAYSLIP AS CSV
  // ---------------------------------------------------------
  @Get('me/payslips/:id/download')
  async downloadMyPayslip(
    @Req() request: any,
    @Param('id') payslipId: string,
    @Res() res: Response,
  ) {
    const { user } = request as { user?: { sub?: string } };
    const employeeId = user?.sub;

    if (!employeeId) {
      throw new NotFoundException('Invalid token');
    }

    const csvBuffer = await this.payrollTrackingService.downloadPayslipCsv(
      employeeId,
      payslipId,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payslip_${payslipId}.csv"`,
    );

    return res.send(csvBuffer);
  }
}
