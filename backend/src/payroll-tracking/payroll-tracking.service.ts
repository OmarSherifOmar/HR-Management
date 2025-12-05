import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// model imports (using names as they were in your files)
import { claims as ClaimClass, claimsDocument } from './models/claims.schema';
import {
  disputes as DisputeClass,
  disputesDocument,
} from './models/disputes.schema';
import {
  refunds as RefundClass,
  refundsDocument,
} from './models/refunds.schema';

import {
  paySlip,
  PayslipDocument,
} from '../payroll-execution/models/payslip.schema';

import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from '../employee-profile/models/employee-profile.schema';

import {
  allowance,
  allowanceDocument,
} from '../payroll-configuration/models/allowance.schema';

import { PayrollReportQueryDto } from './dto/payroll-report-query.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';

import { CreateClaimDto } from './dto/create-claim.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { CreateRefundDto } from './dto/create-refund.dto';

import {
  ClaimStatus,
  DisputeStatus,
  RefundStatus,
} from './enums/payroll-tracking-enum';

// --------------------- Helpers & Types ---------------------

// Interface for populated payGrade
interface PopulatedPayGrade {
  _id: Types.ObjectId;
  grade: string;
  baseSalary: number;
  grossSalary: number;
  status: string;
}

// Interface for populated employee with payGrade
interface PopulatedEmployee {
  _id: Types.ObjectId;
  contractType?: string;
  workType?: string;
  payGradeId?: PopulatedPayGrade | Types.ObjectId;
}

// pick first role if array / return as-is otherwise
function pickRole(
  roleOrRoles: string | string[] | undefined,
): string | undefined {
  if (!roleOrRoles) return undefined;
  if (Array.isArray(roleOrRoles)) return roleOrRoles[0];
  return roleOrRoles;
}

// ensure incoming id-like values are stored/queried as ObjectId when possible
function ensureObjectId(
  id?: string | Types.ObjectId | null,
): Types.ObjectId | undefined {
  if (id === null || id === undefined) return undefined;
  // already an ObjectId instance
  if (id instanceof Types.ObjectId) return id;
  // valid string/object id -> convert
  if (Types.ObjectId.isValid(id)) return new Types.ObjectId(String(id));
  // fallback: return undefined
  return undefined;
}

// Timestamped unique ID generators (from third file)
function generateClaimIdStatic(): string {
  const d = new Date();
  const stamp = d
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14);
  const rnd = Math.floor(Math.random() * 9000) + 1000;
  return `CLAIM-${stamp}-${rnd}`;
}
function generateDisputeIdStatic(): string {
  const d = new Date();
  const stamp = d
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14);
  const rnd = Math.floor(Math.random() * 9000) + 1000;
  return `DISP-${stamp}-${rnd}`;
}

// LeanPayslip type (Ahmed)
type LeanPayslip = {
  _id: string;
  employeeId?: string;
  payrollRunId?: string | { toString(): string };
  createdAt: Date;
  paymentStatus: string;
  netPay: number;
  totalGrossSalary: number;
  totaDeductions?: number;

  earningsDetails?: {
    baseSalary?: number;
    allowances?: unknown[];
    bonuses?: unknown[];
    benefits?: unknown[];
    refunds?: unknown[];
  };

  deductionsDetails?: {
    taxes?: { amount?: number }[];
    insurances?: { amount?: number }[];
    penalties?: {
      unpaidLeaveDays?: number;
      [key: string]: unknown;
    } | null;
  };
};

@Injectable()
export class PayrollTrackingService {
  constructor(
    @InjectModel(ClaimClass.name)
    private readonly claimModel: Model<claimsDocument>,

    @InjectModel(DisputeClass.name)
    private readonly disputeModel: Model<disputesDocument>,

    @InjectModel(RefundClass.name)
    private readonly refundModel: Model<refundsDocument>,

    @InjectModel(paySlip.name)
    private readonly payslipModel: Model<PayslipDocument>,

    @InjectModel(EmployeeProfile.name)
    private readonly employeeModel: Model<EmployeeProfileDocument>,

    @InjectModel(allowance.name)
    private readonly allowanceModel: Model<allowanceDocument>,
  ) {}

  async getClaimsForEmployee(employeeId: string) {
    if (!Types.ObjectId.isValid(employeeId))
      throw new BadRequestException('Invalid employee id');

    return this.claimModel
      .find({ employeeId: ensureObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getClaimByIdForEmployee(employeeId: string, claimId: string) {
    if (!Types.ObjectId.isValid(claimId))
      throw new BadRequestException('Invalid claim id');

    // do NOT .lean() here because tests may stub findById
    const claim = await this.claimModel.findById(claimId);
    if (!claim) throw new NotFoundException('Claim not found');

    const claimEmployeeId = claim.employeeId
      ? String(claim.employeeId)
      : undefined;
    if (String(claimEmployeeId) !== String(employeeId))
      throw new ForbiddenException('Access denied');

    return claim.toObject();
  }

  async listClaims(filter?: { status?: string }) {
    const query: { status?: ClaimStatus } = {};
    if (filter?.status) {
      if (!Object.values(ClaimStatus).includes(filter.status as ClaimStatus))
        throw new BadRequestException(`Invalid claim status: ${filter.status}`);
      query.status = filter.status as ClaimStatus;
    }
    return this.claimModel.find(query).sort({ createdAt: -1 }).lean();
  }

  async updateClaim(
    claimId: string,
    updater: { userId: string | null; role: string | undefined },
    dto: UpdateClaimDto,
  ) {
    if (!Types.ObjectId.isValid(claimId))
      throw new BadRequestException('Invalid claim id');

    const claim = await this.claimModel.findById(claimId);
    if (!claim) throw new NotFoundException('Claim not found');

    if (dto.status) {
      if (!Object.values(ClaimStatus).includes(dto.status))
        throw new BadRequestException(`Invalid claim status: ${dto.status}`);
      claim.status = dto.status;
    }

    if (dto.note) {
      const entry = {
        by: ensureObjectId(updater.userId),
        role: pickRole(updater.role),
        note: dto.note,
        date: new Date(),
      };

      // Append note to resolutionComment
      const existingComment = claim.resolutionComment ?? '';
      const newEntry = `[${entry.date.toISOString()}] ${entry.role}: ${entry.note}`;
      claim.resolutionComment = existingComment
        ? `${existingComment}\n${newEntry}`
        : newEntry;
    }

    await claim.save();
    return claim.toObject();
  }

  async listDisputes(filter?: { status?: string }) {
    const query: { status?: DisputeStatus } = {};
    if (filter?.status) {
      if (
        !Object.values(DisputeStatus).includes(filter.status as DisputeStatus)
      )
        throw new BadRequestException(
          `Invalid dispute status: ${filter.status}`,
        );
      query.status = filter.status as DisputeStatus;
    }
    return this.disputeModel.find(query).sort({ createdAt: -1 }).lean();
  }

  async updateDispute(
    disputeId: string,
    updater: { userId: string | null; role: string | undefined },
    dto: UpdateDisputeDto,
  ) {
    if (!Types.ObjectId.isValid(disputeId))
      throw new BadRequestException('Invalid dispute id');

    const dispute = await this.disputeModel.findById(disputeId);
    if (!dispute) throw new NotFoundException('Dispute not found');

    if (dto.status) {
      dispute.status = dto.status;
    }

    if (dto.note) {
      const entry = {
        by: ensureObjectId(updater.userId),
        role: pickRole(updater.role),
        note: dto.note,
        date: new Date(),
      };

      // Append note to resolutionComment
      const existingComment = dispute.resolutionComment ?? '';
      const newEntry = `[${entry.date.toISOString()}] ${entry.role}: ${entry.note}`;
      dispute.resolutionComment = existingComment
        ? `${existingComment}\n${newEntry}`
        : newEntry;
    }

    await dispute.save();
    return dispute.toObject();
  }

  async managerApproveDispute(disputeId: string, managerId: string | null) {
    if (!Types.ObjectId.isValid(disputeId))
      throw new BadRequestException('Invalid dispute id');

    const dispute = await this.disputeModel.findById(disputeId);
    if (!dispute) throw new NotFoundException('Dispute not found');

    dispute.status = DisputeStatus.APPROVED;

    const entry = {
      by: managerId ? ensureObjectId(managerId) : undefined,
      role: 'Payroll Manager',
      note: 'Manager approval',
      date: new Date(),
    };

    // Append note to resolutionComment
    const existingComment = dispute.resolutionComment ?? '';
    const newEntry = `[${entry.date.toISOString()}] ${entry.role}: ${entry.note}`;
    dispute.resolutionComment = existingComment
      ? `${existingComment}\n${newEntry}`
      : newEntry;

    await dispute.save();
    return dispute.toObject();
  }

  async generatePayrollReport(query: PayrollReportQueryDto) {
    const match: Record<string, Types.ObjectId | string> = {};

    if (query.month) {
      match.payrollRunId = Types.ObjectId.isValid(query.month)
        ? new Types.ObjectId(query.month)
        : query.month;
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$payrollRunId',
          totalGross: { $sum: { $ifNull: ['$totalGrossSalary', 0] } },
          totalNet: { $sum: { $ifNull: ['$netPay', 0] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalGross: -1 as const } },
    ];

    return this.payslipModel.aggregate(pipeline);
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

  async processRefund(
    actor: { userId: string | null; role: string | undefined },
    dto: ProcessRefundDto,
  ) {
    if (!Types.ObjectId.isValid(dto.linkedId))
      throw new BadRequestException('Invalid linked ID');

    const linkedIdObj = new Types.ObjectId(dto.linkedId);

    const dispute = await this.disputeModel.findById(linkedIdObj);
    const claim = dispute ? null : await this.claimModel.findById(linkedIdObj);

    if (!dispute && !claim)
      throw new NotFoundException('No linked dispute/claim found');

    const details = {
      description: dto.reason || 'Refund processed',
      amount: dto.amount,
    };

    const refund = await this.refundModel.create({
      claimId: claim ? claim._id : undefined,
      disputeId: dispute ? dispute._id : undefined,
      refundDetails: details,
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

    // Update dispute -> set status to APPROVED because refund resolves it
    if (dispute) {
      dispute.status = DisputeStatus.APPROVED;

      const note = {
        by: ensureObjectId(actor.userId),
        role: pickRole(actor.role),
        note: `Refund of ${dto.amount} processed`,
        date: new Date(),
      };

      // Append note to resolutionComment
      const existingComment = dispute.resolutionComment ?? '';
      const newEntry = `[${note.date.toISOString()}] ${note.role}: ${note.note}`;
      dispute.resolutionComment = existingComment
        ? `${existingComment}\n${newEntry}`
        : newEntry;

      await dispute.save();
    }

    // Update claim -> set status to APPROVED
    if (claim) {
      claim.status = ClaimStatus.APPROVED;

      const note = {
        by: ensureObjectId(actor.userId),
        role: pickRole(actor.role),
        note: `Refund of ${dto.amount} processed`,
        date: new Date(),
      };

      // Append note to resolutionComment
      const existingComment = claim.resolutionComment ?? '';
      const newEntry = `[${note.date.toISOString()}] ${note.role}: ${note.note}`;
      claim.resolutionComment = existingComment
        ? `${existingComment}\n${newEntry}`
        : newEntry;

      await claim.save();
    }

    return refund.toObject();
  }

  async getPayslipsForEmployee(employeeId: string) {
    const slips = await this.payslipModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
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

  async listTaxDocumentsForEmployee(employeeId: string | null) {
    if (!employeeId) return [];
    const slips = await this.payslipModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .lean<LeanPayslip[]>();

    return slips.map((slip) => ({
      payrollRunId: slip.payrollRunId?.toString() ?? null,
      taxYear: slip.createdAt?.getFullYear() ?? new Date().getFullYear(),
      totalTaxWithheld:
        slip.deductionsDetails?.taxes?.reduce(
          (sum, t) => sum + (t.amount ?? 0),
          0,
        ) ?? 0,
      generatedAt: slip.createdAt,
    }));
  }

  async getPayslipById(employeeId: string, slipId: string) {
    const slip = await this.payslipModel
      .findOne({
        _id: new Types.ObjectId(slipId),
        employeeId: new Types.ObjectId(employeeId),
      })
      .lean<LeanPayslip>();

    if (!slip) throw new NotFoundException('Payslip not found');

    const employee = await this.employeeModel
      .findById(employeeId)
      .populate<{
        payGradeId: PopulatedPayGrade | null;
      }>({ path: 'payGradeId' })
      .lean<PopulatedEmployee>();

    const dispute = await this.disputeModel
      .findOne({ payslipId: slip._id })
      .lean<{
        disputeId: string;
        status: string;
        description: string;
        resolutionComment?: string;
        rejectionReason?: string;
        updatedAt?: Date;
      }>();

    return {
      _id: slip._id,
      month: slip.createdAt.toISOString().slice(0, 7),
      generatedAt: slip.createdAt,
      paymentStatus: slip.paymentStatus,
      contractType: employee?.contractType ?? null,
      workType: employee?.workType ?? null,
      baseSalary: slip.earningsDetails?.baseSalary ?? 0,
      grossSalary: slip.totalGrossSalary,
      totalDeductions: slip.totaDeductions ?? 0,
      netPay: slip.netPay,
      allowances: slip.earningsDetails?.allowances ?? [],
      bonuses: slip.earningsDetails?.bonuses ?? [],
      benefits: slip.earningsDetails?.benefits ?? [],
      refunds: slip.earningsDetails?.refunds ?? [],
      taxes: slip.deductionsDetails?.taxes ?? [],
      insurances: slip.deductionsDetails?.insurances ?? [],
      penalties: slip.deductionsDetails?.penalties ?? null,
      unpaidLeaveDays: slip.deductionsDetails?.penalties?.unpaidLeaveDays ?? 0,
      dispute: dispute
        ? {
            disputeId: dispute.disputeId,
            status: dispute.status,
            description: dispute.description,
            resolutionComment: dispute.resolutionComment ?? null,
            rejectionReason: dispute.rejectionReason ?? null,
            updatedAt: dispute.updatedAt ?? null,
          }
        : null,
    };
  }

  async downloadPayslipCsv(employeeId: string, slipId: string) {
    const slip = await this.getPayslipById(employeeId, slipId);

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

  async getBaseSalaryForEmployee(employeeId: string) {
    const employee = await this.employeeModel
      .findById(employeeId)
      .populate<{
        payGradeId: PopulatedPayGrade | null;
      }>({ path: 'payGradeId' })
      .lean<PopulatedEmployee>();

    if (!employee) throw new NotFoundException('Employee not found');

    const payGradeDoc = employee.payGradeId as PopulatedPayGrade | null;
    let fullTimeBase: number | null = null;

    if (payGradeDoc && typeof payGradeDoc.baseSalary === 'number') {
      fullTimeBase = payGradeDoc.baseSalary;
    }

    if (!fullTimeBase) {
      const latestSlip = await this.payslipModel
        .findOne({ employeeId: new Types.ObjectId(employeeId) })
        .sort({ createdAt: -1 })
        .lean<LeanPayslip>();

      fullTimeBase = latestSlip?.earningsDetails?.baseSalary ?? null;
    }

    if (!fullTimeBase) {
      return {
        baseSalary: 0,
        fullTimeBase: null,
        fraction: 0,
        note: 'Base salary not configured for employee',
      };
    }

    let fraction = 1;

    const isPartTimeContract =
      typeof employee.contractType === 'string' &&
      employee.contractType.includes('PART');
    const isPartTimeWork =
      typeof employee.workType === 'string' &&
      employee.workType.includes('PART');

    if (isPartTimeContract || isPartTimeWork) {
      // Default part-time fraction
      fraction = 0.5;
    }

    const computedBase = Math.round(fullTimeBase * fraction * 100) / 100;

    return {
      baseSalary: computedBase,
      fullTimeBase,
      fraction,
    };
  }

  async calculateLeaveCompensation(
    employeeId: string,
    remainingDays: number,
    encash = true,
    workingDaysPerMonth?: number,
  ) {
    if (remainingDays <= 0) {
      return {
        remainingDays,
        encash,
        dailyRate: 0,
        compensation: 0,
        note: 'No remaining days to convert',
      };
    }

    const salaryInfo = await this.getBaseSalaryForEmployee(employeeId);
    const baseSalary =
      typeof salaryInfo.baseSalary === 'number' ? salaryInfo.baseSalary : 0;

    const workDays =
      typeof workingDaysPerMonth === 'number' && workingDaysPerMonth > 0
        ? workingDaysPerMonth
        : 22;

    const dailyRate = Math.round((baseSalary / workDays) * 100) / 100;
    const compensation = Math.round(dailyRate * remainingDays * 100) / 100;

    return {
      remainingDays,
      encash,
      baseSalary,
      workingDaysPerMonth: workDays,
      dailyRate,
      compensation,
      note: encash
        ? 'Estimated encashment amount for unused leave days'
        : 'Monetary equivalent (not encashed)',
    };
  }

  async calculateCommuteCompensation(employeeId: string) {
    const latestSlip = await this.payslipModel
      .findOne({ employeeId: new Types.ObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .lean<LeanPayslip>();

    const matches: Array<{ name: string; amount: number; source: string }> = [];

    const tryExtractAmount = (a: unknown): number | null => {
      if (a == null) return null;
      if (typeof a === 'number') return a;
      if (typeof a === 'object' && a !== null) {
        const obj = a as Record<string, unknown>;
        if (typeof obj.amount === 'number') return obj.amount;
        if (typeof obj.value === 'number') return obj.value;
        if (typeof obj.total === 'number') return obj.total;
      }
      return null;
    };

    if (
      latestSlip?.earningsDetails?.allowances &&
      Array.isArray(latestSlip.earningsDetails.allowances)
    ) {
      for (const a of latestSlip.earningsDetails.allowances) {
        const name = (() => {
          if (!a || typeof a !== 'object') return '';
          const obj = a as Record<string, unknown>;
          if (typeof obj.name === 'string') return obj.name;
          if (typeof obj.label === 'string') return obj.label;
          if (typeof obj.type === 'string') return obj.type;
          return '';
        })();
        const nameStr = String(name).toLowerCase();
        if (
          nameStr.includes('transport') ||
          nameStr.includes('commut') ||
          nameStr.includes('travel') ||
          nameStr.includes('bus') ||
          nameStr.includes('metro') ||
          nameStr.includes('taxi') ||
          nameStr.includes('car')
        ) {
          const amt = tryExtractAmount(a) ?? 0;
          matches.push({
            name: name || 'transport',
            amount: Math.round(amt * 100) / 100,
            source: 'payslip',
          });
        }
      }
    }

    let monthlyTotal = matches.reduce((s, m) => s + m.amount, 0);

    if (monthlyTotal === 0) {
      try {
        const cfg = await this.allowanceModel
          .findOne({ name: /transport/i })
          .lean<allowanceDocument>();
        if (cfg && typeof cfg.amount === 'number') {
          monthlyTotal = Math.round(cfg.amount * 100) / 100;
          matches.push({
            name: cfg.name || 'Transport Allowance',
            amount: monthlyTotal,
            source: 'config',
          });
        }
      } catch {
        // ignore
      }
    }

    const annual = Math.round(monthlyTotal * 12 * 100) / 100;

    return {
      monthlyTransportAllowance: monthlyTotal,
      annualTransportAllowance: annual,
      breakdown: matches,
      note:
        monthlyTotal > 0
          ? 'Found transport allowance'
          : 'No transport allowance configured or present on latest payslip',
    };
  }

  async calculateTaxBreakdown(employeeId: string) {
    const latestSlip = await this.payslipModel
      .findOne({ employeeId: new Types.ObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .lean<LeanPayslip>();

    if (!latestSlip) {
      return {
        taxes: [],
        totalTax: 0,
        note: 'No payslip found for employee',
      };
    }

    const taxesRaw = latestSlip.deductionsDetails?.taxes ?? [];

    const tryNumber = (v: any): number | null => {
      if (v == null) return null;
      if (typeof v === 'number') return v;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const taxes = (Array.isArray(taxesRaw) ? taxesRaw : []).map(
      (t: unknown) => {
        const obj: Record<string, unknown> =
          typeof t === 'object' && t !== null
            ? (t as Record<string, unknown>)
            : {};

        const get = (k: string) =>
          Object.prototype.hasOwnProperty.call(obj, k) ? obj[k] : undefined;

        const name = get('name') ?? get('label') ?? get('type') ?? 'Tax';
        const amount =
          tryNumber(get('amount')) ??
          tryNumber(get('value')) ??
          tryNumber(get('total')) ??
          0;
        const base =
          tryNumber(get('base')) ?? tryNumber(get('taxableBase')) ?? null;
        const rate =
          tryNumber(get('rate')) ?? tryNumber(get('percentage')) ?? null;

        const rawRule = get('rule') ?? get('law') ?? get('reference') ?? null;
        let rule: string | null = null;
        const rr: unknown = rawRule;
        if (rr == null) {
          rule = null;
        } else if (typeof rr === 'string') {
          rule = rr;
        } else if (typeof rr === 'number' || typeof rr === 'boolean') {
          rule = String(rr);
        } else if (typeof rr === 'object') {
          const safeStringify = (v: unknown): string | null => {
            try {
              const seen = new WeakSet();
              return JSON.stringify(
                v,
                (_key: string, value: unknown) => {
                  if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) return '[Circular]';
                    seen.add(value);
                  }
                  return value;
                },
                2,
              );
            } catch {
              try {
                if (v && typeof v === 'object') {
                  const o = v as Record<string, unknown>;
                  const keys = Object.keys(o);
                  const entries = keys
                    .slice(0, 5)
                    .map((k) => `${k}:${String(o[k])}`);
                  return `{${entries.join(',')}${keys.length > 5 ? ',...' : ''}}`;
                }
              } catch {
                // fall through
              }
              return null;
            }
          };

          rule = safeStringify(rr);
        } else {
          rule = null;
        }

        const nameStr = (() => {
          if (typeof name === 'string') return name;
          if (typeof name === 'number' || typeof name === 'boolean')
            return String(name);
          if (typeof name === 'object' && name !== null) {
            const o = name as Record<string, unknown>;
            if (typeof o.label === 'string') return o.label;
            if (typeof o.name === 'string') return o.name;
            if (typeof o.type === 'string') return o.type;
            try {
              return JSON.stringify(o);
            } catch {
              return 'Tax';
            }
          }
          return 'Tax';
        })();

        return {
          name: nameStr,
          amount: Math.round(amount * 100) / 100,
          base: base == null ? null : Math.round(base * 100) / 100,
          rate: rate == null ? null : Math.round(rate * 100) / 100,
          rule: rule,
          source: 'payslip',
        };
      },
    );

    const totalTax =
      Math.round(taxes.reduce((s, it) => s + (it.amount || 0), 0) * 100) / 100;

    const taxableIncomeGuess = latestSlip.earningsDetails?.baseSalary ?? null;

    return {
      payslipId: latestSlip._id,
      month: latestSlip.createdAt.toISOString().slice(0, 7),
      taxableIncome: taxableIncomeGuess,
      taxes,
      totalTax,
      note:
        taxes.length > 0
          ? 'Detailed tax items extracted from latest payslip. `rule` field is present when payslip includes reference to law/rule.'
          : 'No detailed tax items present on latest payslip. Configure deduction items to include rule/reference for transparency.',
    };
  }

  async calculateInsuranceBreakdown(employeeId: string) {
    const latestSlip = await this.payslipModel
      .findOne({ employeeId: new Types.ObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .lean<LeanPayslip>();

    if (!latestSlip) {
      return {
        insurances: [],
        totalEmployeeContributions: 0,
        totalEmployerContributions: 0,
        note: 'No payslip found for employee',
      };
    }

    const insRaw = latestSlip.deductionsDetails?.insurances ?? [];

    const tryNumber = (v: any): number | null => {
      if (v == null) return null;
      if (typeof v === 'number') return v;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const items = (Array.isArray(insRaw) ? insRaw : []).map((it: unknown) => {
      const isRecord = (v: unknown): v is Record<string, unknown> =>
        typeof v === 'object' && v !== null;
      const obj: Record<string, unknown> = isRecord(it) ? it : {};
      const get = (k: string) =>
        Object.prototype.hasOwnProperty.call(obj, k) ? obj[k] : undefined;

      const name = get('name') ?? get('label') ?? get('type') ?? 'Insurance';

      const employeeShare =
        tryNumber(get('employee')) ??
        tryNumber(get('employeeShare')) ??
        tryNumber(get('employee_amount')) ??
        tryNumber(get('employeeAmount')) ??
        0;

      const employerShare =
        tryNumber(get('employer')) ??
        tryNumber(get('employerShare')) ??
        tryNumber(get('employer_amount')) ??
        tryNumber(get('employerAmount')) ??
        0;

      const explicitTotal =
        tryNumber(get('amount')) ?? tryNumber(get('total')) ?? null;
      const amount = explicitTotal ?? employeeShare + employerShare;

      const base =
        tryNumber(get('base')) ?? tryNumber(get('salaryBase')) ?? null;
      const rate =
        tryNumber(get('rate')) ?? tryNumber(get('percentage')) ?? null;

      const rawRule = get('rule') ?? get('law') ?? get('reference') ?? null;

      const safeStringify = (v: unknown): string | null => {
        if (v == null) return null;
        if (typeof v === 'string') return v;
        if (
          typeof v === 'number' ||
          typeof v === 'boolean' ||
          typeof v === 'bigint' ||
          typeof v === 'symbol'
        ) {
          return String(v);
        }
        type NamedFn = ((...args: unknown[]) => unknown) & { name?: string };
        const isNamedFn = (x: unknown): x is NamedFn => typeof x === 'function';
        if (isNamedFn(v)) {
          return `[Function${v.name ? ': ' + v.name : ''}]`;
        }

        try {
          const seen = new WeakSet();
          return JSON.stringify(
            v,
            (_k: string, val: unknown) => {
              if (typeof val === 'object' && val !== null) {
                if (seen.has(val)) return '[Circular]';
                seen.add(val);
              }
              if (typeof val === 'bigint' || typeof val === 'symbol')
                return String(val as any);
              return val;
            },
            2,
          );
        } catch {
          try {
            if (v && typeof v === 'object') {
              const o = v as Record<string, unknown>;
              const keys = Object.keys(o);
              const entries = keys
                .slice(0, 5)
                .map((k) => `${k}:${String(o[k])}`);
              return `{${entries.join(',')}${keys.length > 5 ? ',...' : ''}}`;
            }
          } catch {
            // Ignore stringify errors
          }
          return null;
        }
      };

      const rule = rawRule == null ? null : safeStringify(rawRule);

      return {
        name: (() => {
          if (typeof name === 'string') return name;
          if (typeof name === 'number' || typeof name === 'boolean')
            return String(name);
          if (typeof name === 'object' && name !== null) {
            const o = name as Record<string, unknown>;
            if (typeof o.label === 'string') return o.label;
            if (typeof o.name === 'string') return o.name;
            if (typeof o.type === 'string') return o.type;
            const s = safeStringify(o);
            return s ?? 'Insurance';
          }
          return 'Insurance';
        })(),
        employeeShare: Math.round((employeeShare || 0) * 100) / 100,
        employerShare: Math.round((employerShare || 0) * 100) / 100,
        total: Math.round((amount || 0) * 100) / 100,
        base: base == null ? null : Math.round(base * 100) / 100,
        rate: rate == null ? null : Math.round(rate * 100) / 100,
        rule: rule,
        source: 'payslip',
      };
    });

    const totalEmployeeContributions =
      Math.round(items.reduce((s, i) => s + (i.employeeShare || 0), 0) * 100) /
      100;
    const totalEmployerContributions =
      Math.round(items.reduce((s, i) => s + (i.employerShare || 0), 0) * 100) /
      100;

    return {
      payslipId: latestSlip._id,
      month: latestSlip.createdAt.toISOString().slice(0, 7),
      insurances: items,
      totalEmployeeContributions,
      totalEmployerContributions,
      note:
        items.length > 0
          ? 'Itemized insurance contributions from latest payslip. `rule` shows law/reference when present.'
          : 'No insurance deduction items recorded on latest payslip.',
    };
  }

  async calculateMisconductDeductions(employeeId: string) {
    const latestSlip = await this.payslipModel
      .findOne({ employeeId: new Types.ObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .lean<LeanPayslip>();

    if (!latestSlip) {
      return { items: [], total: 0, note: 'No payslip found for employee' };
    }

    const penalties = latestSlip.deductionsDetails?.penalties ?? null;
    const otherDeductions = (latestSlip.deductionsDetails?.taxes ?? []).concat(
      latestSlip.deductionsDetails?.insurances ?? [],
    );

    const candidates: unknown[] = [];

    if (penalties) {
      if (Array.isArray(penalties)) {
        for (const p of penalties as unknown[]) {
          candidates.push(p);
        }
      } else {
        candidates.push(penalties as unknown);
      }
    }

    if (Array.isArray(otherDeductions)) {
      for (const d of otherDeductions) {
        candidates.push(d);
      }
    }

    const keywords = [
      'misconduct',
      'disciplin',
      'absent',
      'unauthor',
      'unapprov',
      'absence',
      'penalt',
      'deduct',
      'leave',
    ];

    const tryNumber = (v: any): number | null => {
      if (v == null) return null;
      if (typeof v === 'number') return v;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const safeGet = (obj: unknown, k: string) => {
      if (
        typeof obj === 'object' &&
        obj !== null &&
        Object.prototype.hasOwnProperty.call(obj, k)
      )
        return (obj as Record<string, unknown>)[k];
      return undefined;
    };

    const matches: Array<{
      name: string;
      amount: number;
      reason?: string | null;
      rule?: string | null;
      source: string;
    }> = [];

    const safeStringify = (v: unknown): string | null => {
      try {
        if (v == null) return null;
        if (typeof v === 'string') return v;
        if (typeof v === 'number' || typeof v === 'boolean') return String(v);
        return JSON.stringify(v);
      } catch {
        try {
          return String(v);
        } catch {
          return null;
        }
      }
    };

    for (const c of candidates) {
      if (c == null) continue;
      const name =
        safeGet(c, 'name') ??
        safeGet(c, 'label') ??
        safeGet(c, 'type') ??
        safeGet(c, 'description') ??
        '';

      const nameStr = (() => {
        if (typeof name === 'string') return name.toLowerCase();
        if (typeof name === 'number' || typeof name === 'boolean')
          return String(name).toLowerCase();
        const s = safeStringify(name);
        return s ? s.toLowerCase() : '';
      })();

      const amount =
        tryNumber(safeGet(c, 'amount')) ??
        tryNumber(safeGet(c, 'total')) ??
        tryNumber(safeGet(c, 'value')) ??
        0;

      const reason =
        safeGet(c, 'reason') ??
        safeGet(c, 'description') ??
        safeGet(c, 'note') ??
        null;
      const rule =
        safeGet(c, 'rule') ??
        safeGet(c, 'law') ??
        safeGet(c, 'reference') ??
        null;

      let include = false;
      if (typeof nameStr === 'string') {
        for (const kw of keywords) {
          if (nameStr.includes(kw)) {
            include = true;
            break;
          }
        }
      }

      if (
        !include &&
        typeof c === 'object' &&
        c !== null &&
        'unpaidLeaveDays' in (c as Record<string, unknown>)
      ) {
        include = true;
      }

      if (include) {
        const displayName = (() => {
          if (typeof name === 'string') return name;
          if (typeof name === 'number' || typeof name === 'boolean')
            return String(name);
          const s = safeStringify(name);
          return s ?? 'Deduction';
        })();

        matches.push({
          name: displayName,
          amount: Math.round((amount || 0) * 100) / 100,
          reason: reason == null ? null : safeStringify(reason),
          rule: safeStringify(rule),
          source: 'payslip',
        });
      }
    }

    const total =
      Math.round(matches.reduce((s, m) => s + (m.amount || 0), 0) * 100) / 100;

    return {
      payslipId: latestSlip._id,
      month: latestSlip.createdAt.toISOString().slice(0, 7),
      items: matches,
      total,
      note:
        matches.length > 0
          ? 'Found misconduct/absence deductions on latest payslip'
          : 'No misconduct/unapproved absence deductions found on latest payslip',
    };
  }

  async calculateUnpaidLeaveDeductions(employeeId: string) {
    const latestSlip = await this.payslipModel
      .findOne({ employeeId: new Types.ObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .lean<LeanPayslip>();

    if (!latestSlip) {
      return {
        payslipId: null,
        month: null,
        unpaidDays: 0,
        dailyRate: 0,
        deduction: 0,
        note: 'No payslip found for employee',
      };
    }

    const penalties = latestSlip.deductionsDetails?.penalties ?? null;
    let unpaidDays: number = 0;

    const tryNumber = (v: any): number | null => {
      if (v == null) return null;
      if (typeof v === 'number') return v;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    if (penalties != null) {
      if (Array.isArray(penalties)) {
        const deriveNameString = (n: unknown): string => {
          if (typeof n === 'string') return n.toLowerCase();
          if (typeof n === 'number' || typeof n === 'boolean')
            return String(n).toLowerCase();
          if (typeof n === 'object' && n !== null) {
            const o = n as Record<string, unknown>;
            if (typeof o.label === 'string') return o.label.toLowerCase();
            if (typeof o.name === 'string') return o.name.toLowerCase();
            if (typeof o.type === 'string') return o.type.toLowerCase();
            try {
              return JSON.stringify(o).toLowerCase();
            } catch {
              return '';
            }
          }
          return '';
        };

        for (const p of penalties) {
          const obj =
            typeof p === 'object' && p !== null
              ? (p as Record<string, unknown>)
              : ({} as Record<string, unknown>);

          const val = tryNumber(
            obj['unpaidLeaveDays'] ??
              obj['unpaid_days'] ??
              obj['unpaidLeave'] ??
              obj['unpaid'],
          );
          if (val && val > 0) unpaidDays += val;

          const name = obj['name'] ?? obj['label'] ?? obj['type'] ?? '';
          const nameStr = deriveNameString(name);
          if (
            !val &&
            (nameStr.includes('unpaid') ||
              nameStr.includes('unpaid leave') ||
              nameStr.includes('unpaid_leave'))
          ) {
            const a = tryNumber(
              obj['amount'] ?? obj['deduction'] ?? obj['value'],
            );
            if (a && a > 0) unpaidDays += 1;
          }
        }
      } else if (typeof penalties === 'object') {
        const p = penalties as Record<string, unknown>;
        const val = tryNumber(
          p.unpaidLeaveDays ?? p.unpaid_days ?? p.unpaidLeave ?? p.unpaid,
        );
        if (val && val > 0) unpaidDays += val;
      }
    }

    if (unpaidDays === 0) {
      const top = latestSlip.deductionsDetails?.penalties;
      if (top && !Array.isArray(top) && typeof top === 'object') {
        const p = top as Record<string, unknown>;
        const maybe =
          tryNumber(
            p['unpaidLeaveDays'] ??
              p['unpaid_days'] ??
              p['unpaidLeave'] ??
              p['unpaid'],
          ) ?? 0;
        if (maybe > 0) unpaidDays += maybe;
      }
    }

    if (unpaidDays === 0) {
      const lookFor = (arr: any[] | undefined) => {
        if (!Array.isArray(arr)) return 0;
        let found = 0;

        const getProp = (obj: unknown, k: string) =>
          typeof obj === 'object' &&
          obj !== null &&
          Object.prototype.hasOwnProperty.call(obj, k)
            ? (obj as Record<string, unknown>)[k]
            : undefined;

        for (const it of arr) {
          const nmVal =
            getProp(it, 'name') ??
            getProp(it, 'label') ??
            getProp(it, 'type') ??
            '';
          const nmStr =
            typeof nmVal === 'string'
              ? nmVal.toLowerCase()
              : typeof nmVal === 'number' || typeof nmVal === 'boolean'
                ? String(nmVal).toLowerCase()
                : (() => {
                    try {
                      return nmVal && typeof nmVal === 'object'
                        ? JSON.stringify(nmVal).toLowerCase()
                        : '';
                    } catch {
                      return '';
                    }
                  })();

          if (
            nmStr.includes('unpaid') ||
            nmStr.includes('unpaid leave') ||
            nmStr.includes('unpaid_leave')
          ) {
            const d =
              tryNumber(
                typeof it === 'object' && it !== null
                  ? ((it as Record<string, unknown>).unpaidLeaveDays ??
                      (it as Record<string, unknown>).unpaid_days ??
                      (it as Record<string, unknown>).unpaidLeave ??
                      (it as Record<string, unknown>).unpaid)
                  : null,
              ) ?? 0;
            if (d > 0) found += d;
            else {
              const amt =
                tryNumber(
                  getProp(it, 'amount') ??
                    getProp(it, 'deduction') ??
                    getProp(it, 'value') ??
                    getProp(it, 'total'),
                ) ?? 0;
              if (amt > 0) found += 1;
            }
          }
        }
        return found;
      };

      unpaidDays += lookFor(latestSlip.deductionsDetails?.insurances as any[]);
      unpaidDays += lookFor(latestSlip.deductionsDetails?.taxes as any[]);
    }

    const salaryInfo = await this.getBaseSalaryForEmployee(employeeId);
    const baseSalary =
      typeof salaryInfo.baseSalary === 'number' ? salaryInfo.baseSalary : 0;
    const workingDaysPerMonth = 22;
    const dailyRate =
      Math.round((baseSalary / workingDaysPerMonth) * 100) / 100;
    const deduction = Math.round(dailyRate * unpaidDays * 100) / 100;

    const related: Array<{
      name: string;
      days?: number | null;
      amount?: number | null;
      raw?: unknown;
    }> = [];
    if (Array.isArray(penalties)) {
      for (const p of penalties) {
        const obj =
          typeof p === 'object' && p !== null
            ? (p as Record<string, unknown>)
            : ({} as Record<string, unknown>);

        const days =
          tryNumber(
            obj.unpaidLeaveDays ??
              obj.unpaid_days ??
              obj.unpaidLeave ??
              obj.unpaid,
          ) ?? null;

        const amt =
          tryNumber(obj.amount ?? obj.deduction ?? obj.value ?? obj.total) ??
          null;

        const nmVal = obj.name ?? obj.label ?? obj.type ?? 'penalty';
        const nm =
          typeof nmVal === 'string'
            ? nmVal
            : typeof nmVal === 'number' || typeof nmVal === 'boolean'
              ? String(nmVal)
              : 'penalty';

        related.push({ name: String(nm), days, amount: amt, raw: p });
      }
    } else if (penalties && typeof penalties === 'object') {
      const p = penalties as Record<string, unknown>;
      const days =
        tryNumber(
          p.unpaidLeaveDays ?? p.unpaid_days ?? p.unpaidLeave ?? p.unpaid,
        ) ?? null;
      const amt =
        tryNumber(p.amount ?? p.deduction ?? p.value ?? p.total) ?? null;
      const nmVal = p.name ?? p.label ?? p.type ?? 'penalty';
      const nm =
        typeof nmVal === 'string'
          ? nmVal
          : typeof nmVal === 'number' || typeof nmVal === 'boolean'
            ? String(nmVal)
            : 'penalty';
      related.push({ name: String(nm), days, amount: amt, raw: p });
    }

    return {
      payslipId: latestSlip._id,
      month: latestSlip.createdAt.toISOString().slice(0, 7),
      unpaidDays,
      baseSalary,
      workingDaysPerMonth,
      dailyRate,
      deduction,
      related,
      note:
        unpaidDays > 0
          ? 'Computed unpaid-leave deduction'
          : 'No unpaid leave detected on latest payslip',
    };
  }

  // ============================================================
  // ---------------------- THIRD FILE: Create / Decision -------
  // (methods from the third file added here, names kept)
  // ============================================================

  // Unique ID generators as instance methods (wrappers)
  private generateClaimId(): string {
    return generateClaimIdStatic();
  }
  private generateDisputeId(): string {
    return generateDisputeIdStatic();
  }

  // CREATE CLAIM (REQ-PY-42)
  async createClaim(createDto: CreateClaimDto) {
    if (createDto.amount == null || Number(createDto.amount) <= 0)
      throw new BadRequestException('amount must be positive');

    const claimId = this.generateClaimId();
    const newClaim = new this.claimModel({
      claimId,
      description: createDto.description ?? '',
      claimType: createDto.claimType ?? 'general',
      employeeId: ensureObjectId(createDto.employeeId),
      amount: createDto.amount,
      approvedAmount: null,
      status: ClaimStatus.UNDER_REVIEW,
    });

    try {
      return await newClaim.save();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 11000)
        throw new ConflictException('duplicate claim id, try again');
      throw err;
    }
  }

  // CREATE DISPUTE (REQ-PY-39)
  async createDispute(createDto: CreateDisputeDto) {
    if (createDto.amount != null && Number(createDto.amount) <= 0)
      throw new BadRequestException('amount must be positive if provided');

    if (!createDto.refundId)
      throw new BadRequestException('refundId (payslipId) is required');

    const disputeId = this.generateDisputeId();

    const newDispute = new this.disputeModel({
      disputeId,
      description: String(createDto.reason ?? ''),
      employeeId: new Types.ObjectId(createDto.employeeId),
      payslipId: new Types.ObjectId(createDto.refundId),
      status: DisputeStatus.UNDER_REVIEW,
    });

    try {
      return await newDispute.save();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 11000)
        throw new ConflictException('duplicate dispute id, try again');
      throw err;
    }
  }

  // CLAIM: SPECIALIST DECISION (REQ-PY-42)
  async claimSpecialistDecision(
    claimId: string,
    action: 'approve' | 'reject',
    payrollSpecialistId: string | Types.ObjectId | null,
    comment?: string,
    approvedAmount?: number,
  ) {
    const claim = await this.claimModel.findOne({ claimId });
    if (!claim) throw new NotFoundException('Claim not found');

    if ([ClaimStatus.APPROVED, ClaimStatus.REJECTED].includes(claim.status))
      throw new BadRequestException('Claim already finalized');

    if (action === 'reject') {
      claim.status = ClaimStatus.REJECTED;
      claim.rejectionReason = comment ?? 'Rejected by specialist';
      if (payrollSpecialistId)
        claim.payrollSpecialistId = ensureObjectId(payrollSpecialistId);
    } else {
      claim.status = ClaimStatus.APPROVED;
      if (payrollSpecialistId)
        claim.payrollSpecialistId = ensureObjectId(payrollSpecialistId);
      if (approvedAmount != null) claim.approvedAmount = approvedAmount;
      claim.resolutionComment = comment
        ? `specialist_approved: ${comment}`
        : 'specialist_approved';
    }

    return claim.save();
  }

  // CLAIM: MANAGER DECISION (REQ-PY-43)
  async claimManagerDecision(
    claimId: string,
    action: 'approve' | 'reject',
    payrollManagerId: string | Types.ObjectId | null,
    comment?: string,
  ) {
    const claim = await this.claimModel.findOne({ claimId });
    if (!claim) throw new NotFoundException('Claim not found');

    if (
      ![ClaimStatus.APPROVED, ClaimStatus.UNDER_REVIEW].includes(claim.status)
    )
      throw new BadRequestException('Claim not awaiting manager approval');

    if (action === 'reject') {
      claim.status = ClaimStatus.REJECTED;
      claim.rejectionReason = comment ?? 'Rejected by manager';
      if (payrollManagerId)
        claim.payrollManagerId = ensureObjectId(payrollManagerId);
    } else {
      claim.status = ClaimStatus.APPROVED;
      if (payrollManagerId)
        claim.payrollManagerId = ensureObjectId(payrollManagerId);
      claim.resolutionComment =
        (claim.resolutionComment ? claim.resolutionComment + ' | ' : '') +
        `manager_approved: ${comment ?? ''}`;
    }

    return claim.save();
  }

  // GET APPROVED CLAIMS (REQ-PY-44)
  async getApprovedClaims() {
    return this.claimModel
      .find({ status: ClaimStatus.APPROVED })
      .populate('employeeId payrollSpecialistId payrollManagerId')
      .exec();
  }

  // DISPUTE: SPECIALIST DECISION (REQ-PY-39)
  async disputeSpecialistDecision(
    disputeId: string,
    action: 'approve' | 'reject',
    payrollSpecialistId: string | Types.ObjectId | null,
    comment?: string,
  ) {
    const dispute = await this.disputeModel.findOne({ disputeId });
    if (!dispute) throw new NotFoundException('Dispute not found');

    if (
      [DisputeStatus.APPROVED, DisputeStatus.REJECTED].includes(dispute.status)
    )
      throw new BadRequestException('Dispute already finalized');

    if (action === 'reject') {
      dispute.status = DisputeStatus.REJECTED;
      dispute.rejectionReason = comment ?? 'Rejected by specialist';
      if (payrollSpecialistId)
        dispute.payrollSpecialistId = ensureObjectId(payrollSpecialistId);
    } else {
      if (payrollSpecialistId)
        dispute.payrollSpecialistId = ensureObjectId(payrollSpecialistId);
      dispute.resolutionComment = comment
        ? `specialist_approved: ${comment}`
        : 'specialist_approved';
    }

    return dispute.save();
  }

  // DISPUTE: MANAGER DECISION (REQ-PY-40)
  async disputeManagerDecision(
    disputeId: string,
    action: 'approve' | 'reject',
    payrollManagerId: string | Types.ObjectId | null,
    comment?: string,
  ) {
    const dispute = await this.disputeModel.findOne({ disputeId });
    if (!dispute) throw new NotFoundException('Dispute not found');

    if (
      [DisputeStatus.APPROVED, DisputeStatus.REJECTED].includes(dispute.status)
    )
      throw new BadRequestException('Dispute already finalized');

    if (action === 'approve') {
      if (!dispute.payrollSpecialistId)
        throw new BadRequestException(
          'Dispute must be approved by specialist first',
        );
      dispute.status = DisputeStatus.APPROVED;
      if (payrollManagerId)
        dispute.payrollManagerId = ensureObjectId(payrollManagerId);
      dispute.resolutionComment =
        (dispute.resolutionComment ? dispute.resolutionComment + ' | ' : '') +
        `manager_approved: ${comment ?? ''}`;
    } else {
      dispute.status = DisputeStatus.REJECTED;
      dispute.rejectionReason = comment ?? 'Rejected by manager';
      if (payrollManagerId)
        dispute.payrollManagerId = ensureObjectId(payrollManagerId);
    }

    return dispute.save();
  }

  // GET APPROVED DISPUTES (REQ-PY-41)
  async getApprovedDisputes() {
    return this.disputeModel
      .find({ status: DisputeStatus.APPROVED })
      .populate('employeeId payslipId payrollSpecialistId payrollManagerId')
      .exec();
  }

  // REFUND: CLAIM (REQ-PY-44)
  async createRefundForClaim(
    claimId: string,
    createRefundDto: CreateRefundDto,
    financeStaffId: string | Types.ObjectId | null,
  ) {
    const claim = await this.claimModel.findOne({ claimId });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.status !== ClaimStatus.APPROVED)
      throw new BadRequestException('Claim must be approved');

    const employeeId = createRefundDto.employeeId ?? claim.employeeId;

    const refundDoc = new this.refundModel({
      claimId: claim._id,
      refundDetails: {
        description:
          createRefundDto.reason ?? `Refund for claim ${claim.claimId}`,
        amount: createRefundDto.amount,
      },
      employeeId,
      financeStaffId,
      status: RefundStatus.PENDING,
    });

    return refundDoc.save();
  }

  // REFUND: EXPENSE CLAIM (REQ-PY-46)
  async createExpenseRefundForClaim(
    claimId: string,
    createRefundDto: CreateRefundDto,
    financeStaffId: string | Types.ObjectId | null,
  ) {
    const claim = await this.claimModel.findOne({ claimId });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.claimType !== 'expense')
      throw new BadRequestException('Claim is not an expense claim');

    return this.createRefundForClaim(claimId, createRefundDto, financeStaffId);
  }

  // REFUND: DISPUTE (REQ-PY-45)
  async createRefundForDispute(
    disputeId: string,
    createRefundDto: CreateRefundDto,
    financeStaffId: string | Types.ObjectId | null,
  ) {
    const dispute = await this.disputeModel.findOne({ disputeId });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status !== DisputeStatus.APPROVED)
      throw new BadRequestException('Dispute must be approved');

    const employeeId = createRefundDto.employeeId ?? dispute.employeeId;

    const refundDoc = new this.refundModel({
      disputeId: dispute._id,
      refundDetails: {
        description:
          createRefundDto.reason ?? `Refund for dispute ${dispute.disputeId}`,
        amount: createRefundDto.amount,
      },
      employeeId,
      financeStaffId,
      status: RefundStatus.PENDING,
    });

    return refundDoc.save();
  }

  // REFUND: MARK AS PAID
  async markRefundPaid(refundId: string, payrollRunId: string) {
    const refund = await this.refundModel.findById(refundId);
    if (!refund) throw new NotFoundException('Refund not found');
    refund.status = RefundStatus.PAID;
    refund.paidInPayrollRunId = new Types.ObjectId(payrollRunId);
    return refund.save();
  }

  // GET PENDING REFUNDS
  async getPendingRefunds() {
    return this.refundModel
      .find({ status: RefundStatus.PENDING })
      .populate('employeeId claimId disputeId')
      .exec();
  }

  // PAYROLL REPORT: DEPARTMENT (REQ-PY-38)
  async getDepartmentPayrollReport(departmentId: string) {
    const claims = await this.claimModel.find({
      departmentId,
      status: ClaimStatus.APPROVED,
    });
    const disputes = await this.disputeModel.find({
      departmentId,
      status: DisputeStatus.APPROVED,
    });
    return { claims, disputes };
  }
}
