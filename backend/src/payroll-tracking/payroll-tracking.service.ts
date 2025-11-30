import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  paySlip,
  PayslipDocument,
} from '../payroll-execution/models/payslip.schema';

import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from '../employee-profile/models/employee-profile.schema';

// -------------------------------------------------------------
// SAFE TYPE FOR LEAN PAYSLIP (fixes all TS errors)
// -------------------------------------------------------------
type LeanPayslip = {
  _id: string;
  createdAt: Date;
  paymentStatus: string;
  netPay: number;
  totalGrossSalary: number;
  totaDeductions?: number;

  earningsDetails?: {
    baseSalary?: number;
    allowances?: any[];
    bonuses?: any[];
    benefits?: any[];
    refunds?: any[];
  };

  deductionsDetails?: {
    taxes?: any[];
    insurances?: any[];
    penalties?: {
      unpaidLeaveDays?: number;
      [key: string]: any;
    } | null;
  };
};

@Injectable()
export class PayrollTrackingService {
  constructor(
    @InjectModel(paySlip.name)
    private readonly payslipModel: Model<PayslipDocument>,

    @InjectModel(EmployeeProfile.name)
    private readonly employeeModel: Model<EmployeeProfileDocument>,
  ) {}

  // ---------------------------------------------------------
  // 1️⃣ VIEW ALL PAYSLIPS FOR LOGGED-IN EMPLOYEE
  // ---------------------------------------------------------
  async getPayslipsForEmployee(employeeId: string) {
    const slips = await this.payslipModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .lean<LeanPayslip[]>();

    return slips.map((s) => ({
      _id: s._id,
      month: s.createdAt?.toISOString().slice(0, 7),
      netPay: s.netPay,
      paymentStatus: s.paymentStatus,
      createdAt: s.createdAt,
    }));
  }

  // ---------------------------------------------------------
  // 2️⃣ VIEW FULL PAYSLIP DETAILS
  // ---------------------------------------------------------
  async getPayslipById(employeeId: string, payslipId: string) {
    const slip = await this.payslipModel
      .findOne({
        _id: new Types.ObjectId(payslipId),
        employeeId: new Types.ObjectId(employeeId),
      })
      .lean<LeanPayslip>();

    if (!slip) throw new NotFoundException('Payslip not found');

    const employee = await this.employeeModel
      .findById(employeeId)
      .lean<{ contractType?: string; workType?: string }>();

    return {
      _id: slip._id,
      month: slip.createdAt.toISOString().slice(0, 7),
      generatedAt: slip.createdAt,
      paymentStatus: slip.paymentStatus,

      // Employment details
      contractType: employee?.contractType ?? null,
      workType: employee?.workType ?? null,

      // Salary components
      baseSalary: slip.earningsDetails?.baseSalary ?? 0,
      grossSalary: slip.totalGrossSalary,
      totalDeductions: slip.totaDeductions ?? 0,
      netPay: slip.netPay,

      // Earnings
      allowances: slip.earningsDetails?.allowances ?? [],
      bonuses: slip.earningsDetails?.bonuses ?? [],
      benefits: slip.earningsDetails?.benefits ?? [],
      refunds: slip.earningsDetails?.refunds ?? [],

      // Deductions
      taxes: slip.deductionsDetails?.taxes ?? [],
      insurances: slip.deductionsDetails?.insurances ?? [],
      penalties: slip.deductionsDetails?.penalties ?? null,
      unpaidLeaveDays: slip.deductionsDetails?.penalties?.unpaidLeaveDays ?? 0,
    };
  }

  // ---------------------------------------------------------
  // 3️⃣ CSV DOWNLOAD
  // ---------------------------------------------------------
  async downloadPayslipCsv(employeeId: string, payslipId: string) {
    const slip = await this.getPayslipById(employeeId, payslipId);

    const lines = [
      'Field,Value',
      `Month,${slip.month}`,
      `Status,${slip.paymentStatus}`,
      `Base Salary,${slip.baseSalary}`,
      `Gross Salary,${slip.grossSalary}`,
      `Total Deductions,${slip.totalDeductions}`,
      `Net Pay,${slip.netPay}`,
    ];

    return Buffer.from(lines.join('\n'), 'utf8');
  }
}
