import { Types, Model } from 'mongoose';
import { PayrollTrackingService } from './payroll-tracking.service';

describe('PayrollTrackingService', () => {
  let service: PayrollTrackingService;

  // mocks for injected models (typed jest mocks to avoid `any` unsafe access)
  let payslipModel: { find: jest.Mock; findOne: jest.Mock };
  let employeeModel: { findById: jest.Mock };
  let disputesModel: { findOne: jest.Mock };
  let allowanceModel: { findOne: jest.Mock };

  const validEmployeeId = new Types.ObjectId().toHexString();
  const validPayslipId = new Types.ObjectId().toHexString();

  type SampleSlipType = {
    _id: string;
    employeeId: string;
    createdAt: Date;
    paymentStatus: string;
    netPay: number;
    totalGrossSalary: number;
    totaDeductions: number;
    earningsDetails: {
      baseSalary: number;
      allowances: { name: string; amount: number }[];
    };
    deductionsDetails: {
      taxes: {
        name: string;
        amount: number;
        base: number;
        rate: number;
        rule?: string;
      }[];
      insurances: {
        name: string;
        employee: number;
        employer: number;
        base: number;
        rate: number;
      }[];
      // penalties can be either an object with unpaidLeaveDays or an array of named penalties
      penalties:
        | { unpaidLeaveDays?: number }
        | { name: string; amount: number }[];
    };
  };

  const sampleSlip: SampleSlipType = {
    _id: validPayslipId,
    employeeId: validEmployeeId,
    createdAt: new Date('2025-10-15T00:00:00.000Z'),
    paymentStatus: 'PAID',
    netPay: 800,
    totalGrossSalary: 1000,
    totaDeductions: 200,
    earningsDetails: {
      baseSalary: 1000,
      allowances: [{ name: 'Transport Allowance', amount: 50 }],
    },
    deductionsDetails: {
      taxes: [
        {
          name: 'Income Tax',
          amount: 100,
          base: 1000,
          rate: 10,
          rule: 'Law XYZ',
        },
      ],
      insurances: [
        { name: 'Pension', employee: 20, employer: 30, base: 1000, rate: 2 },
      ],
      penalties: { unpaidLeaveDays: 2 },
    },
  };

  beforeEach(() => {
    // default mocks that return the sampleSlip for find/findOne calls
    payslipModel = {
      find: jest.fn().mockImplementation(() => ({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([sampleSlip]),
      })),
      // always return the sampleSlip for findOne to avoid ObjectId matching issues
      findOne: jest.fn().mockImplementation(() => ({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(sampleSlip),
      })),
    };

    const employeeObj = {
      contractType: 'FULL_TIME',
      workType: 'FULL_TIME',
      partTimePercentage: undefined,
      workFraction: undefined,
      payGradeId: { baseSalary: 1200 },
    };

    employeeModel = {
      findById: jest.fn().mockImplementation(() => ({
        // support both .lean() and .populate(...).lean()
        lean: jest.fn().mockResolvedValue(employeeObj),
        populate: jest.fn().mockImplementation(() => ({
          lean: jest.fn().mockResolvedValue(employeeObj),
        })),
      })),
    };

    disputesModel = {
      findOne: jest.fn().mockImplementation(() => ({
        lean: jest.fn().mockResolvedValue({
          disputeId: 'd1',
          status: 'OPEN',
          description: 'Test dispute',
        }),
      })),
    };

    allowanceModel = {
      findOne: jest.fn().mockImplementation(() => ({
        lean: jest
          .fn()
          .mockResolvedValue({ name: 'Transport Allowance', amount: 60 }),
      })),
    };

    service = new PayrollTrackingService(
      payslipModel as unknown as Model<any>,
      employeeModel as unknown as Model<any>,
      disputesModel as unknown as Model<any>,
      allowanceModel as unknown as Model<any>,
    );
  });

  afterEach(() => jest.resetAllMocks());

  it('getPayslipsForEmployee returns a summary list', async () => {
    const res = await service.getPayslipsForEmployee(validEmployeeId);
    expect(Array.isArray(res)).toBe(true);
    expect(res[0]).toMatchObject({
      _id: validPayslipId,
      paymentStatus: 'PAID',
      netPay: 800,
    });
  });

  it('getPayslipById returns full payslip details and dispute', async () => {
    const res = await service.getPayslipById(validEmployeeId, validPayslipId);
    expect(res._id).toBe(validPayslipId);
    expect(res.baseSalary).toBe(1000);
    expect(res.taxes).toBeDefined();
    expect(res.dispute).toBeDefined();
    expect(res.dispute!.status).toBe('OPEN');
  });

  it('downloadPayslipCsv returns a Buffer with expected fields', async () => {
    const buf = await service.downloadPayslipCsv(
      validEmployeeId,
      validPayslipId,
    );
    expect(Buffer.isBuffer(buf)).toBe(true);
    const s = buf.toString('utf8');
    expect(s).toContain('Base Salary');
    expect(s).toContain('Gross Salary');
  });

  it('getBaseSalaryForEmployee returns pay grade base and fraction', async () => {
    const res = await service.getBaseSalaryForEmployee(validEmployeeId);
    expect(res.fullTimeBase).toBe(1200);
    expect(res.baseSalary).toBeGreaterThan(0);
  });

  it('calculateLeaveCompensation computes daily rate and compensation', async () => {
    // stub getBaseSalaryForEmployee to return a known base
    jest.spyOn(service, 'getBaseSalaryForEmployee').mockResolvedValue({
      baseSalary: 2200,
      fullTimeBase: 2200,
      fraction: 1,
    } as { baseSalary: number; fullTimeBase: number; fraction: number });
    const out = await service.calculateLeaveCompensation(
      validEmployeeId,
      5,
      true,
      22,
    );
    expect(out.dailyRate).toBeCloseTo(100, 2);
    expect(out.compensation).toBeCloseTo(500, 2);
  });

  it('calculateCommuteCompensation finds allowance on payslip', async () => {
    const out = await service.calculateCommuteCompensation(validEmployeeId);
    expect(out.monthlyTransportAllowance).toBe(50);
    expect(out.breakdown[0].source).toBe('payslip');
  });

  it('calculateCommuteCompensation falls back to config when none present', async () => {
    // make latest payslip not include transport allowances
    const slipNoTransport = {
      ...sampleSlip,
      earningsDetails: {
        baseSalary: 1000,
        allowances: [{ name: 'Other', amount: 10 }],
      },
    };
    payslipModel.findOne.mockImplementation(() => ({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(slipNoTransport),
    }));
    const out = await service.calculateCommuteCompensation(validEmployeeId);
    expect(out.monthlyTransportAllowance).toBe(60);
    expect(out.breakdown[0].source).toBe('config');
  });

  it('calculateTaxBreakdown extracts taxes and rules', async () => {
    const out = await service.calculateTaxBreakdown(validEmployeeId);
    expect(out.taxes.length).toBeGreaterThan(0);
    expect(out.taxes[0].rule).toBeDefined();
    expect(out.totalTax).toBe(100);
  });

  it('calculateInsuranceBreakdown returns employee and employer totals', async () => {
    const out = await service.calculateInsuranceBreakdown(validEmployeeId);
    expect(out.insurances.length).toBeGreaterThan(0);
    expect(out.totalEmployeeContributions).toBe(20);
    expect(out.totalEmployerContributions).toBe(30);
  });

  it('calculateMisconductDeductions detects penalties and returns items', async () => {
    // put a penalty entry into penalties array to simulate named penalty
    const slipWithPenalty = {
      ...sampleSlip,
      deductionsDetails: {
        ...sampleSlip.deductionsDetails,
        penalties: [{ name: 'Unapproved Absence', amount: 40 }],
      },
    };
    payslipModel.findOne.mockImplementation(() => ({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(slipWithPenalty),
    }));
    const out = await service.calculateMisconductDeductions(validEmployeeId);
    expect(out.items.length).toBeGreaterThan(0);
    expect(out.total).toBeGreaterThan(0);
  });

  it('calculateUnpaidLeaveDeductions reads unpaidLeaveDays and computes deduction', async () => {
    // ensure penalties object with unpaidLeaveDays numeric
    const slipWithUnpaid = {
      ...sampleSlip,
      deductionsDetails: {
        ...sampleSlip.deductionsDetails,
        penalties: { unpaidLeaveDays: 3 },
      },
    };
    payslipModel.findOne.mockImplementation(() => ({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(slipWithUnpaid),
    }));
    // stub base salary retrieval
    jest.spyOn(service, 'getBaseSalaryForEmployee').mockResolvedValue({
      baseSalary: 2200,
      fullTimeBase: 2200,
      fraction: 1,
    } as { baseSalary: number; fullTimeBase: number; fraction: number });
    const out = await service.calculateUnpaidLeaveDeductions(validEmployeeId);
    expect(out.unpaidDays).toBe(3);
    // daily rate = 2200 / 22 = 100 => deduction = 300
    expect(out.deduction).toBeCloseTo(300, 2);
  });
});
