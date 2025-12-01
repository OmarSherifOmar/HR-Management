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
import { disputes, disputesDocument } from './models/disputes.schema';
import {
  allowance,
  allowanceDocument,
} from '../payroll-configuration/models/allowance.schema';

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
    @InjectModel(disputes.name)
    private readonly disputesModel: Model<disputesDocument>,
    @InjectModel(allowance.name)
    private readonly allowanceModel: Model<allowanceDocument>,
  ) {}

  // ---------------------------------------------------------
  // 1️⃣ GET ALL PAYSLIPS FOR AN EMPLOYEE (summary list)
  // ---------------------------------------------------------
  async getPayslipsForEmployee(employeeId: string) {
    const slips = await this.payslipModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .lean<LeanPayslip[]>();

    return slips.map((slip) => ({
      _id: slip._id,
      month: slip.createdAt.toISOString().slice(0, 7),
      generatedAt: slip.createdAt,
      paymentStatus: slip.paymentStatus,
      grossSalary: slip.totalGrossSalary,
      totalDeductions: slip.totaDeductions ?? 0,
      netPay: slip.netPay,
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

    // include dispute details if any
    const dispute = await this.disputesModel
      .findOne({ payslipId: slip._id })
      .lean<{
        disputeId?: string;
        status?: string;
        description?: string;
        resolutionComment?: string | null;
        rejectionReason?: string | null;
        updatedAt?: Date | null;
      }>();

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
      // Dispute information (if any)
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
  // ---------------------------------------------------------
  // 4️⃣ GET BASE SALARY FOR EMPLOYEE (FROM CONTRACT / PAYGRADE)
  // ---------------------------------------------------------
  async getBaseSalaryForEmployee(employeeId: string) {
    const employee = await this.employeeModel
      .findById(employeeId)
      .populate({ path: 'payGradeId' })
      .lean<{
        contractType?: string;
        workType?: string;
        partTimePercentage?: number;
        workFraction?: number;
        payGradeId?: { baseSalary?: number } | null;
      }>();

    if (!employee) throw new NotFoundException('Employee not found');

    // Try to read base salary from linked pay grade first
    const payGradeDoc = employee.payGradeId;
    let fullTimeBase: number | null = null;

    if (payGradeDoc && typeof payGradeDoc.baseSalary === 'number') {
      fullTimeBase = payGradeDoc.baseSalary;
    }

    // Fallback to most recent payslip baseSalary
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

    // Determine fraction for part-time employees. Support a custom percentage
    // if present (e.g. `partTimePercentage` or `workFraction`), otherwise
    // assume 50% for PART_TIME contract/work types.
    let fraction = 1;
    const partPerc = employee.partTimePercentage ?? employee.workFraction;

    const isPartTimeContract =
      typeof employee.contractType === 'string' &&
      employee.contractType.includes('PART');
    const isPartTimeWork =
      typeof employee.workType === 'string' &&
      employee.workType.includes('PART');

    if (isPartTimeContract || isPartTimeWork) {
      if (typeof partPerc === 'number' && partPerc > 0 && partPerc <= 1) {
        fraction = partPerc;
      } else if (typeof partPerc === 'number' && partPerc > 1) {
        fraction = partPerc / 100;
      } else {
        fraction = 0.5; // reasonable default when not configured
      }
    }

    const computedBase = Math.round(fullTimeBase * fraction * 100) / 100;

    return {
      baseSalary: computedBase,
      fullTimeBase,
      fraction,
    };
  }

  // ---------------------------------------------------------
  // 5️⃣ CALCULATE LEAVE COMPENSATION / ENCASHMENT
  // - `remainingDays`: number of unused leave days to convert
  // - `encash`: boolean; when false we still compute monetary equivalent
  // - `workingDaysPerMonth`: override for daily rate calculation (defaults to 22)
  // ---------------------------------------------------------
  async calculateLeaveCompensation(
    employeeId: string,
    remainingDays: number,
    encash = true,
    workingDaysPerMonth?: number,
  ) {
    // Validate input
    if (remainingDays <= 0) {
      return {
        remainingDays,
        encash,
        dailyRate: 0,
        compensation: 0,
        note: 'No remaining days to convert',
      };
    }

    // Get employee base salary (takes contract fraction into account)
    const salaryInfo = await this.getBaseSalaryForEmployee(employeeId);
    const baseSalary =
      typeof salaryInfo.baseSalary === 'number' ? salaryInfo.baseSalary : 0;

    // Default working days per month (common business assumption)
    const workDays =
      typeof workingDaysPerMonth === 'number' && workingDaysPerMonth > 0
        ? workingDaysPerMonth
        : 22;

    // Daily rate: divide base salary by working days per month
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

  // ---------------------------------------------------------
  // 6️⃣ CALCULATE COMMUTE / TRANSPORTATION COMPENSATION
  // - Look for transport-related allowances on the latest payslip
  // - Fallback to a configured allowance document if available
  // - Returns monthly amount, annual equivalent, and breakdown
  // ---------------------------------------------------------
  async calculateCommuteCompensation(employeeId: string) {
    // Find latest payslip
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

    // Fallback to allowance config if nothing found on payslip
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
        // ignore errors
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

  // ---------------------------------------------------------
  // 7️⃣ CALCULATE TAX BREAKDOWN / DETAILED DEDUCTIONS
  // - Reads latest payslip deductions and returns structured tax items
  // - Each item may include: name, amount, base, rate, rule/reference (if present)
  // ---------------------------------------------------------
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
        // Treat item as a safe keyed record to avoid unsafe `any` access
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

        // Normalize rule/reference into a safe string | null
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
          // safe stringify that handles circular references and provides a small fallback summary
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

        // Safely produce a human-friendly name string to avoid '[object Object]'
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

  // ---------------------------------------------------------
  // 8️⃣ CALCULATE INSURANCE BREAKDOWN / ITEMIZED CONTRIBUTIONS
  // - Extracts `deductionsDetails.insurances` from latest payslip
  // - Returns employee share, employer share (if present), base, rate and any rule/reference
  // ---------------------------------------------------------
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
        // Use a specific named-function type guard instead of the broad `Function` type
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
          // Attempt a small, readable summary for objects
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
            // ignore and fall through
          }

          // If we cannot produce a meaningful string representation without
          // risking the default "[object Object]" result, return null to
          // indicate that no safe string could be produced.
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

  // ---------------------------------------------------------
  // 9️⃣ CALCULATE MISCONDUCT / UNAPPROVED ABSENTEEISM DEDUCTIONS
  // - Scans latest payslip for `deductionsDetails.penalties` and other deduction
  //   items that indicate misconduct or unapproved absenteeism and returns
  //   an itemized list with amounts, reasons and any rule/reference.
  // ---------------------------------------------------------
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
        // avoid unsafe spread of an any[] by iterating and treating each item as unknown
        for (const p of penalties as unknown[]) {
          candidates.push(p);
        }
      } else {
        candidates.push(penalties as unknown);
      }
    }

    // also scan deductions array for items that look like misconduct/absence
    if (Array.isArray(otherDeductions)) {
      // avoid unsafe spread of an any[] by iterating and treating each item as unknown
      for (const d of otherDeductions as unknown[]) {
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
      // derive a name/label/value fields safely
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

      // Heuristic: include items that have matching keywords in name or type, or explicit unpaidLeaveDays
      let include = false;
      if (typeof nameStr === 'string') {
        for (const kw of keywords) {
          if (nameStr.includes(kw)) {
            include = true;
            break;
          }
        }
      }

      // if penalty object has unpaidLeaveDays numeric field include
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

  // ---------------------------------------------------------
  // 🔟 CALCULATE UNPAID LEAVE DEDUCTIONS
  // - Reads unpaid leave days from latest payslip penalties and
  //   computes the monetary deduction based on employee base salary
  // ---------------------------------------------------------
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

    // Try to read unpaidLeaveDays from penalties (could be object or array)
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
          // also check named entries
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
            // if amount present and no explicit days, consider 1 day count as heuristic
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

    // Also check for explicit unpaidLeaveDays at top-level inside deductionsDetails.penalties
    if (unpaidDays === 0) {
      const top = latestSlip.deductionsDetails?.penalties;
      // only consider `top` when it's a plain object (not an array of penalties)
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

    // If still zero, attempt to detect unpaid leave via named deduction items
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
          // Safely extract name/label/type without unsafe any member access
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
              // heuristic: if there's an amount and no days, treat it as 1 day
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

    // Compute monetary deduction using base salary and default working days per month
    const salaryInfo = await this.getBaseSalaryForEmployee(employeeId);
    const baseSalary =
      typeof salaryInfo.baseSalary === 'number' ? salaryInfo.baseSalary : 0;
    const workingDaysPerMonth = 22;
    const dailyRate =
      Math.round((baseSalary / workingDaysPerMonth) * 100) / 100;
    const deduction = Math.round(dailyRate * unpaidDays * 100) / 100;

    // Build related penalty items list for display
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
}
