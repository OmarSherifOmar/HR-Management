import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Types, Model } from 'mongoose';

import { PayrollTrackingService } from './payroll-tracking.service';
import {
  paySlip,
  PayslipDocument,
} from '../payroll-execution/models/payslip.schema';

describe('PayrollTrackingService', () => {
  let service: PayrollTrackingService;

  // small helper to create a chainable query object (.sort().lean())
  const chainableQuery = (result: any[]) => {
    const q: any = {};
    q.sort = jest.fn().mockReturnValue(q);
    q.lean = jest.fn().mockResolvedValue(result);
    return q;
  };

  const createMockModel = (overrides: any = {}) => ({
    find: jest.fn().mockImplementation(() => chainableQuery(overrides.findResult ?? [])),
    findById: jest.fn().mockResolvedValue(overrides.findByIdResult ?? null),
    aggregate: jest.fn().mockResolvedValue(overrides.aggregateResult ?? []),
    countDocuments: jest.fn().mockResolvedValue(overrides.countResult ?? 0),
    create: jest.fn().mockResolvedValue(overrides.createResult ?? {}),
    prototype: { save: jest.fn() },
    ...overrides.extra,
  });


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
    //
    // --- OMAR BRANCH MOCKS ---
    //
    const claimModel = createMockModel();
    const disputeModel = createMockModel();
    const refundModel = createMockModel();
    const payslipModelOmar = createMockModel();

    //
    // --- AHMED BRANCH MOCKS ---
    //
    payslipModel = {
      find: jest.fn().mockImplementation(() => ({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([sampleSlip]),
      })),
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
        lean: jest.fn().mockResolvedValue({
          name: 'Transport Allowance',
          amount: 60,
        }),
      })),
    };

    //
    // FINAL MERGED CONSTRUCTOR CALL
    // ✔ maintains Omar’s constructor order
    // ✔ injects Ahmed’s extended mocks where needed
    //
    service = new PayrollTrackingService(
      claimModel as any,
      disputeModel as any,
      refundModel as any,
      payslipModelOmar as unknown as Model<PayslipDocument>,

      // AHMED extra injected models:
      payslipModel as unknown as Model<any>,
      employeeModel as unknown as Model<any>,
      disputesModel as unknown as Model<any>,
      allowanceModel as unknown as Model<any>,
    );
  });

  afterEach(() => jest.resetAllMocks());


  describe('getClaimsForEmployee', () => {
    it('throws on invalid employee id', async () => {
      await expect(service.getClaimsForEmployee('bad-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('returns claims list when valid id', async () => {
      const employeeId = new Types.ObjectId().toHexString();
      (service as any).claimModel.find.mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: 'c1', employeeId }]),
      }));

      const res = await service.getClaimsForEmployee(employeeId);
      expect(res).toEqual([{ _id: 'c1', employeeId }]);
    });
  });

  describe('getClaimByIdForEmployee', () => {
    it('throws on invalid claim id', async () => {
      await expect(
        service.getClaimByIdForEmployee('emp', 'bad'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFound if claim missing', async () => {
      const emp = new Types.ObjectId().toHexString();
      const claimId = new Types.ObjectId().toHexString();
      (service as any).claimModel.findById.mockResolvedValueOnce(null);
      await expect(
        service.getClaimByIdForEmployee(emp, claimId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws Forbidden if employee mismatch', async () => {
      const empA = new Types.ObjectId().toHexString();
      const claimId = new Types.ObjectId().toHexString();
      const fakeClaim = {
        _id: claimId,
        employeeId: new Types.ObjectId().toHexString(),
      };
      (service as any).claimModel.findById.mockResolvedValueOnce(fakeClaim);
      await expect(
        service.getClaimByIdForEmployee(empA, claimId),
      ).rejects.toThrow(ForbiddenException);
    });
  });


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
    expect(res.dispute!.status).toBe('OPEN');
  });

  it('downloadPayslipCsv returns a valid CSV buffer', async () => {
    const buf = await service.downloadPayslipCsv(
      validEmployeeId,
      validPayslipId,
    );
    expect(Buffer.isBuffer(buf)).toBe(true);
    const s = buf.toString('utf8');
    expect(s).toContain('Base Salary');
  });

  it('calculateLeaveCompensation computes correctly', async () => {
    jest.spyOn(service, 'getBaseSalaryForEmployee').mockResolvedValue({
      baseSalary: 2200,
      fullTimeBase: 2200,
      fraction: 1,
    });
    const out = await service.calculateLeaveCompensation(
      validEmployeeId,
      5,
      true,
      22,
    );
    expect(out.dailyRate).toBeCloseTo(100);
  });

  it('calculateUnpaidLeaveDeductions works', async () => {
    const slipWithUnpaid = {
      ...sampleSlip,
      deductionsDetails: { penalties: { unpaidLeaveDays: 3 } },
    };
    payslipModel.findOne.mockImplementation(() => ({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(slipWithUnpaid),
    }));

    jest.spyOn(service, 'getBaseSalaryForEmployee').mockResolvedValue({
      baseSalary: 2200,
      fullTimeBase: 2200,
      fraction: 1,
    });

    const out = await service.calculateUnpaidLeaveDeductions(validEmployeeId);
    expect(out.unpaidDays).toBe(3);
  });
});
