import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Omar models
import { claims, claimsDocument } from './models/claims.schema';
import { disputes, disputesDocument } from './models/disputes.schema';
import { refunds, refundsDocument } from './models/refunds.schema';

// Ahmed models
import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from '../employee-profile/models/employee-profile.schema';

import {
  allowance,
  allowanceDocument,
} from '../payroll-configuration/models/allowance.schema';

// Shared model
import {
  paySlip,
  PayslipDocument,
} from '../payroll-execution/models/payslip.schema';

import { PayrollReportQueryDto } from './dto/payroll-report-query.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';

import {
  ClaimStatus,
  DisputeStatus,
  RefundStatus,
} from './enums/payroll-tracking-enum';


// ----------- Helper functions -----------
function pickRole(role: any) {
  if (!role) return;
  if (Array.isArray(role)) return role[0];
  return role;
}

function castEnumValue<T>(enumObj: any, value: string): T {
  if (!Object.values(enumObj).includes(value)) {
    throw new BadRequestException(`Invalid enum value: ${value}`);
  }
  return value as unknown as T;
}

// For Ahmed's typed payslip extracting
type LeanPayslip = {
  _id: string;
  employeeId?: string;
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
    penalties?: any;
  };
};

@Injectable()
export class PayrollTrackingService {
  constructor(
    // Omar injections
    @InjectModel(claims.name)
    private readonly claimModel: Model<claimsDocument>,

    @InjectModel(disputes.name)
    private readonly disputeModel: Model<disputesDocument>,

    @InjectModel(refunds.name)
    private readonly refundModel: Model<refundsDocument>,

    // Shared payslip model
    @InjectModel(paySlip.name)
    private readonly payslipModel: Model<PayslipDocument>,

    // Ahmed injections
    @InjectModel(EmployeeProfile.name)
    private readonly employeeModel: Model<EmployeeProfileDocument>,

    @InjectModel(allowance.name)
    private readonly allowanceModel: Model<allowanceDocument>,
  ) {}

  async getClaimsForEmployee(employeeId: string) {
    if (!Types.ObjectId.isValid(employeeId))
      throw new BadRequestException('Invalid employee id');

    return this.claimModel.find({ employeeId }).sort({ createdAt: -1 }).lean();
  }

  async getClaimByIdForEmployee(employeeId: string, claimId: string) {
    if (!Types.ObjectId.isValid(claimId))
      throw new BadRequestException('Invalid claim id');

    const claim: any = await this.claimModel.findById(claimId);
    if (!claim) throw new NotFoundException('Claim not found');

    const claimEmployeeId = String(
      claim.employeeId?._id ?? claim.employeeId,
    );

    if (claimEmployeeId !== String(employeeId))
      throw new ForbiddenException('Access denied');

    return typeof claim.toObject === 'function' ? claim.toObject() : claim;
  }

  async listTaxDocumentsForEmployee(employeeId: string) {
    if (!Types.ObjectId.isValid(employeeId))
      throw new BadRequestException('Invalid employee id');

    const docs = await this.payslipModel
      .find(
        { employeeId },
        {
          payrollRunId: 1,
          totalGrossSalary: 1,
          netPay: 1,
          createdAt: 1,
        },
      )
      .sort({ createdAt: -1 })
      .lean();

    return docs.map((p: any) => ({
      payrollRunId: p.payrollRunId,
      gross: p.totalGrossSalary,
      net: p.netPay,
      createdAt: p.createdAt,
    }));
  }



  async generatePayrollReport(query: PayrollReportQueryDto) {
    const match: any = {};

    if (query.month) {
      match.payrollRunId =
        Types.ObjectId.isValid(query.month)
          ? new Types.ObjectId(query.month)
          : query.month;
    }

    return this.payslipModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$payrollRunId',
          totalGross: { $sum: { $ifNull: ['$totalGrossSalary', 0] } },
          totalNet: { $sum: { $ifNull: ['$netPay', 0] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalGross: -1 } },
    ]);
  }


  async listDisputes(filter?: { status?: string }) {
    const query: any = {};

    if (filter?.status) {
      if (!Object.values(DisputeStatus).includes(filter.status as any))
        throw new BadRequestException(
          `Invalid dispute status: ${filter.status}`,
        );
      query.status = filter.status;
    }

    return this.disputeModel.find(query).sort({ createdAt: -1 }).lean();
  }

  async updateDispute(id: string, updater: any, dto: UpdateDisputeDto) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid dispute id');

    const dispute: any = await this.disputeModel.findById(id);
    if (!dispute) throw new NotFoundException('Dispute not found');

    if (dto.status)
      dispute.status = castEnumValue(DisputeStatus, dto.status);

    if (dto.note) {
      const entry = {
        by: updater.userId,
        role: pickRole(updater.role),
        note: dto.note,
        date: new Date(),
      };

      dispute.resolutionNotes = dispute.resolutionNotes || [];
      dispute.resolutionNotes.push(entry);
    }

    await dispute.save();
    return dispute.toObject ? dispute.toObject() : dispute;
  }

  async managerApproveDispute(id: string, managerId: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid dispute id');

    const dispute: any = await this.disputeModel.findById(id);
    if (!dispute) throw new NotFoundException('Dispute not found');

    dispute.status = DisputeStatus.APPROVED;

    const entry = {
      by: managerId,
      role: 'Payroll Manager',
      note: 'Manager approval',
      date: new Date(),
    };

    dispute.resolutionNotes = dispute.resolutionNotes || [];
    dispute.resolutionNotes.push(entry);

    await dispute.save();
    return dispute.toObject ? dispute.toObject() : dispute;
  }


  async listClaims(filter?: { status?: string }) {
    const query: any = {};
    if (filter?.status) {
      if (!Object.values(ClaimStatus).includes(filter.status as any))
        throw new BadRequestException(`Invalid claim status: ${filter.status}`);
      query.status = filter.status;
    }
    return this.claimModel.find(query).sort({ createdAt: -1 }).lean();
  }

  async updateClaim(id: string, updater: any, dto: UpdateClaimDto) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid claim id');

    const claim: any = await this.claimModel.findById(id);
    if (!claim) throw new NotFoundException('Claim not found');

    if (dto.status) claim.status = castEnumValue(ClaimStatus, dto.status);

    if (dto.note) {
      const entry = {
        by: updater.userId,
        role: pickRole(updater.role),
        note: dto.note,
        date: new Date(),
      };

      claim.notes = claim.notes || [];
      claim.notes.push(entry);
    }

    await claim.save();
    return claim.toObject ? claim.toObject() : claim;
  }



  async transparencySummary() {
    const totalPayslips = await this.payslipModel.countDocuments();
    const totalDisputes = await this.disputeModel.countDocuments();
    const totalClaims = await this.claimModel.countDocuments();

    const pendingDisputes = await this.disputeModel.countDocuments({
      status: DisputeStatus.UNDER_REVIEW,
    });

    const pendingClaims = await this.claimModel.countDocuments({
      status: ClaimStatus.UNDER_REVIEW,
    });

    const refundsProcessed = await this.refundModel.countDocuments({
      status: RefundStatus.PAID,
    });

    return {
      totalPayslips,
      totalDisputes,
      totalClaims,
      pendingDisputes,
      pendingClaims,
      refundsProcessed,
    };
  }


  async processRefund(actor: any, dto: ProcessRefundDto) {
    if (!Types.ObjectId.isValid(dto.linkedId))
      throw new BadRequestException('Invalid linked ID');

    const id = new Types.ObjectId(dto.linkedId);

    const dispute = await this.disputeModel.findById(id);
    const claim = dispute ? null : await this.claimModel.findById(id);

    if (!dispute && !claim)
      throw new NotFoundException('No linked dispute/claim found');

    const refund: any = await this.refundModel.create({
      claimId: claim?._id,
      disputeId: dispute?._id,
      refundDetails: {
        description: dto.reason || 'Refund processed',
        amount: dto.amount,
      },
      employeeId: dispute
        ? dispute.employeeId
        : claim
          ? claim.employeeId
          : undefined,
      financeStaffId: actor.userId
        ? new Types.ObjectId(actor.userId)
        : undefined,
      status: RefundStatus.PAID,
    });

    // update dispute or claim
    const entity = dispute || claim;

    entity.status = dispute
      ? DisputeStatus.APPROVED
      : ClaimStatus.APPROVED;

    const note = {
      by: actor.userId,
      role: pickRole(actor.role),
      note: `Refund of ${dto.amount} processed`,
      date: new Date(),
    };

    entity.notes = entity.notes || entity.resolutionNotes || [];
    entity.notes.push(note);

    await entity.save();

    return refund.toObject ? refund.toObject() : refund;
  }


  async getPayslipsForEmployee(employeeId: string) {
    const slips = await this.payslipModel
      .find({ employeeId })
      .sort({ createdAt: -1 })
      .lean<LeanPayslip[]>();

    return slips.map((p) => ({
      _id: p._id,
      month: p.createdAt?.toISOString?.().slice(0, 7),
      generatedAt: p.createdAt,
      paymentStatus: p.paymentStatus,
      grossSalary: p.totalGrossSalary,
      totalDeductions: p.totaDeductions ?? 0,
      netPay: p.netPay,
    }));
  }

  async getPayslipById(employeeId: string, slipId: string) {
    const slip = await this.payslipModel
      .findOne({ _id: slipId, employeeId })
      .lean<LeanPayslip>();

    if (!slip) throw new NotFoundException('Payslip not found');

    const employee = await this.employeeModel
      .findById(employeeId)
      .populate({ path: 'payGradeId' })
      .lean();

    const dispute = await this.disputeModel
      .findOne({ payslipId: slip._id })
      .lean();

    return {
      ...slip,
      month: slip.createdAt.toISOString().slice(0, 7),
      contractType: employee?.contractType ?? null,
      workType: employee?.workType ?? null,
      dispute: dispute || null,
    };
  }

  async downloadPayslipCsv(employeeId: string, slipId: string) {
    const slip = await this.getPayslipById(employeeId, slipId);
    const lines = [
      'Field,Value',
      `Month,${slip.month}`,
      `Base Salary,${slip.earningsDetails?.baseSalary ?? 0}`,
      `Gross Salary,${slip.totalGrossSalary}`,
      `Net Pay,${slip.netPay}`,
    ];
    return Buffer.from(lines.join('\n'), 'utf8');
  }

  async getBaseSalaryForEmployee(employeeId: string) {
    const employee = await this.employeeModel
      .findById(employeeId)
      .populate({ path: 'payGradeId' })
      .lean();

    if (!employee) throw new NotFoundException('Employee not found');

    let fullTimeBase =
      employee?.payGradeId?.baseSalary ??
      (await this.payslipModel
        .findOne({ employeeId })
        .sort({ createdAt: -1 })
        .lean()
        .then((p: any) => p?.earningsDetails?.baseSalary));

    if (!fullTimeBase) {
      return { baseSalary: 0, fullTimeBase: null, fraction: 0 };
    }

    let fraction = 1;

    if (employee.contractType?.includes('PART')) {
      const perc = employee.partTimePercentage ?? employee.workFraction;
      fraction =
        perc && perc > 1
          ? perc / 100
          : perc && perc > 0
            ? perc
            : 0.5;
    }

    return {
      baseSalary: Math.round(fullTimeBase * fraction * 100) / 100,
      fullTimeBase,
      fraction,
    };
  }

  async calculateLeaveCompensation(
    employeeId: string,
    remaining: number,
    encash = true,
    workingDays?: number,
  ) {
    if (remaining <= 0)
      return {
        remaining,
        encash,
        dailyRate: 0,
        compensation: 0,
      };

    const salaryInfo = await this.getBaseSalaryForEmployee(employeeId);
    const base = salaryInfo.baseSalary ?? 0;

    const work = workingDays || 22;
    const rate = Math.round((base / work) * 100) / 100;
    const comp = Math.round(rate * remaining * 100) / 100;

    return {
      remaining,
      encash,
      baseSalary: base,
      workingDaysPerMonth: work,
      dailyRate: rate,
      compensation: comp,
    };
  }

  async calculateCommuteCompensation(employeeId: string) {
    const slip = await this.payslipModel
      .findOne({ employeeId })
      .sort({ createdAt: -1 })
      .lean<LeanPayslip>();

    const matches = [];

    if (slip?.earningsDetails?.allowances) {
      for (const a of slip.earningsDetails.allowances) {
        const name = a.name ?? a.label ?? a.type ?? '';
        const n = String(name).toLowerCase();
        if (
          n.includes('transport') ||
          n.includes('commut') ||
          n.includes('bus') ||
          n.includes('metro')
        ) {
          matches.push({
            name,
            amount: a.amount ?? 0,
            source: 'payslip',
          });
        }
      }
    }

    let total = matches.reduce((s, m) => s + m.amount, 0);

    if (total === 0) {
      const cfg = await this.allowanceModel.findOne({ name: /transport/i });
      if (cfg?.amount) {
        total = cfg.amount;
        matches.push({
          name: cfg.name,
          amount: cfg.amount,
          source: 'config',
        });
      }
    }

    return {
      monthlyTransportAllowance: total,
      annualTransportAllowance: total * 12,
      breakdown: matches,
    };
  }

  async calculateTaxBreakdown(employeeId: string) {
    const slip = await this.payslipModel
      .findOne({ employeeId })
      .sort({ createdAt: -1 })
      .lean<LeanPayslip>();

    if (!slip)
      return { taxes: [], totalTax: 0, note: 'No payslip found' };

    const taxes = (slip.deductionsDetails?.taxes ?? []).map((t: any) => ({
      name: t.name ?? 'Tax',
      amount: t.amount ?? 0,
      base: t.base ?? null,
      rate: t.rate ?? null,
      rule: t.rule ?? null,
      source: 'payslip',
    }));

    return {
      taxes,
      totalTax: taxes.reduce((s, t) => s + t.amount, 0),
      payslipId: slip._id,
      month: slip.createdAt.toISOString().slice(0, 7),
    };
  }

  async calculateInsuranceBreakdown(employeeId: string) {
    const slip = await this.payslipModel
      .findOne({ employeeId })
      .sort({ createdAt: -1 })
      .lean<LeanPayslip>();

    if (!slip)
      return { insurances: [], totalEmployeeContributions: 0, totalEmployerContributions: 0 };

    const items = (slip.deductionsDetails?.insurances ?? []).map((i: any) => ({
      name: i.name ?? 'Insurance',
      employeeShare: i.employee ?? 0,
      employerShare: i.employer ?? 0,
      total: (i.employee ?? 0) + (i.employer ?? 0),
      base: i.base ?? null,
      rate: i.rate ?? null,
      rule: i.rule ?? null,
    }));

    return {
      insurances: items,
      totalEmployeeContributions: items.reduce((s, i) => s + i.employeeShare, 0),
      totalEmployerContributions: items.reduce((s, i) => s + i.employerShare, 0),
      payslipId: slip._id,
      month: slip.createdAt.toISOString().slice(0, 7),
    };
  }

  async calculateMisconductDeductions(employeeId: string) {
    const slip = await this.payslipModel
      .findOne({ employeeId })
      .sort({ createdAt: -1 })
      .lean<LeanPayslip>();

    if (!slip)
      return { items: [], total: 0, note: 'No payslip found' };

    const penalties = slip.deductionsDetails?.penalties;
    let items: any[] = [];

    if (Array.isArray(penalties)) items = penalties;
    else if (penalties) items = [penalties];

    const filtered = items.filter((p) => {
      const name = String(p.name ?? '').toLowerCase();
      return (
        name.includes('misconduct') ||
        name.includes('absence') ||
        name.includes('unapproved') ||
        name.includes('penalty')
      );
    });

    const mapped = filtered.map((p) => ({
      name: p.name ?? 'Penalty',
      amount: p.amount ?? 0,
      source: 'payslip',
    }));

    return {
      items: mapped,
      total: mapped.reduce((s, m) => s + m.amount, 0),
      payslipId: slip._id,
      month: slip.createdAt.toISOString().slice(0, 7),
    };
  }

  async calculateUnpaidLeaveDeductions(employeeId: string) {
    const slip = await this.payslipModel
      .findOne({ employeeId })
      .sort({ createdAt: -1 })
      .lean<LeanPayslip>();

    if (!slip)
      return { unpaidDays: 0, dailyRate: 0, deduction: 0 };

    const penalties = slip.deductionsDetails?.penalties;

    let unpaidDays = 0;

    if (Array.isArray(penalties)) {
      for (const p of penalties) {
        if (p.unpaidLeaveDays) unpaidDays += p.unpaidLeaveDays;
      }
    } else if (penalties?.unpaidLeaveDays) {
      unpaidDays = penalties.unpaidLeaveDays;
    }

    const salaryInfo = await this.getBaseSalaryForEmployee(employeeId);
    const rate = Math.round((salaryInfo.baseSalary / 22) * 100) / 100;
    const deduction = Math.round(rate * unpaidDays * 100) / 100;

    return {
      unpaidDays,
      baseSalary: salaryInfo.baseSalary,
      dailyRate: rate,
      deduction,
      payslipId: slip._id,
      month: slip.createdAt.toISOString().slice(0, 7),
    };
  }
}
