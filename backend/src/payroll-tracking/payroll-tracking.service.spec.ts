// backend/src/payroll-tracking/payroll-tracking.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

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

  beforeEach(async () => {
    const claimModel = createMockModel();
    const disputeModel = createMockModel();
    const refundModel = createMockModel();
    const payslipModel = createMockModel();

    // instantiate the service with mock Models (constructor order must match real service)
    service = new PayrollTrackingService(
      claimModel as any,
      disputeModel as any,
      refundModel as any,
      payslipModel as unknown as Model<PayslipDocument>,
    );
  });

  describe('getClaimsForEmployee', () => {
    it('throws on invalid employee id', async () => {
      await expect(service.getClaimsForEmployee('bad-id')).rejects.toThrow(BadRequestException);
    });

    it('returns claims list when valid id', async () => {
      const employeeId = new Types.ObjectId().toHexString();
      (service as any).claimModel.find.mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: 'c1', employeeId }]),
      }));

      const res = await service.getClaimsForEmployee(employeeId);
      expect(res).toEqual([{ _id: 'c1', employeeId }]);
      expect((service as any).claimModel.find).toHaveBeenCalledWith({ employeeId });
    });
  });

  describe('getClaimByIdForEmployee', () => {
    it('throws on invalid claim id', async () => {
      await expect(service.getClaimByIdForEmployee('emp', 'bad')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFound if claim missing', async () => {
      const emp = new Types.ObjectId().toHexString();
      const claimId = new Types.ObjectId().toHexString();
      (service as any).claimModel.findById.mockResolvedValueOnce(null);
      await expect(service.getClaimByIdForEmployee(emp, claimId)).rejects.toThrow(NotFoundException);
    });

    it('throws Forbidden if employee mismatch', async () => {
      const empA = new Types.ObjectId().toHexString();
      const claimId = new Types.ObjectId().toHexString();
      const fakeClaim = { _id: claimId, employeeId: new Types.ObjectId().toHexString() };
      (service as any).claimModel.findById.mockResolvedValueOnce(fakeClaim);
      await expect(service.getClaimByIdForEmployee(empA, claimId)).rejects.toThrow(ForbiddenException);
    });

    it('returns claim when owner matches', async () => {
      const emp = new Types.ObjectId().toHexString();
      const claimId = new Types.ObjectId().toHexString();
      const fakeClaim = { _id: claimId, employeeId: emp };
      (service as any).claimModel.findById.mockResolvedValueOnce(fakeClaim);
      const out = await service.getClaimByIdForEmployee(emp, claimId);
      expect(out._id).toBe(claimId);
    });
  });

  describe('listTaxDocumentsForEmployee', () => {
    it('throws on invalid id', async () => {
      await expect(service.listTaxDocumentsForEmployee('bad')).rejects.toThrow(BadRequestException);
    });

    it('returns mapped payslip summary', async () => {
      const emp = new Types.ObjectId().toHexString();
      const sample = [{ payrollRunId: 'r1', totalGrossSalary: 1200, netPay: 1000, createdAt: new Date() }];
      (service as any).payslipModel.find.mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(sample),
      }));

      const res = await service.listTaxDocumentsForEmployee(emp);
      expect(res[0]).toMatchObject({ payrollRunId: 'r1', gross: 1200, net: 1000 });
    });
  });

  describe('generatePayrollReport', () => {
    it('calls aggregate and returns result', async () => {
      (service as any).payslipModel.aggregate.mockResolvedValueOnce([{ _id: 'run1', totalGross: 200 }]);
      const res = await service.generatePayrollReport({ month: undefined } as any);
      expect(res).toEqual([{ _id: 'run1', totalGross: 200 }]);
    });
  });

  describe('listDisputes & updateDispute', () => {
    it('listDisputes returns array', async () => {
      (service as any).disputeModel.find.mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: 'd1' }]),
      }));
      const res = await service.listDisputes();
      expect(res).toEqual([{ _id: 'd1' }]);
    });

    it('updateDispute appends note and saves', async () => {
      const id = new Types.ObjectId().toHexString();
      const mockDispute: any = { _id: id, resolutionNotes: [], save: jest.fn() };
      (service as any).disputeModel.findById.mockResolvedValueOnce(mockDispute);

      const out = await service.updateDispute(id, { userId: 'u1', role: 'Payroll Specialist' }, { note: 'hi' } as any);
      expect(mockDispute.save).toHaveBeenCalled();
      expect(out.resolutionNotes.length).toBe(1);
    });
  });

  describe('processRefund', () => {
    it('throws on invalid linkedId', async () => {
      await expect(service.processRefund({ userId: 'u1', role: 'Finance' }, { linkedId: 'bad' } as any)).rejects.toThrow(BadRequestException);
    });

    it('creates refund and updates dispute', async () => {
      const linkedId = new Types.ObjectId().toHexString();
      const mockDispute: any = { _id: linkedId, employeeId: 'e1', resolutionNotes: [], status: undefined, save: jest.fn() };
      (service as any).disputeModel.findById.mockResolvedValueOnce(mockDispute);
      (service as any).claimModel.findById.mockResolvedValueOnce(null);
      const created = { _id: 'r1', toObject: () => ({ _id: 'r1' }) };
      (service as any).refundModel.create.mockResolvedValueOnce(created);

      const financeUserId = new Types.ObjectId().toHexString();
      const res = await service.processRefund({ userId: financeUserId, role: 'Finance' }, { linkedId, amount: 50 } as any);

      expect((service as any).refundModel.create).toHaveBeenCalled();
      expect(mockDispute.status).toBeDefined();
      expect(mockDispute.save).toHaveBeenCalled();
      expect(res._id).toBe('r1');
    });
  });
});

