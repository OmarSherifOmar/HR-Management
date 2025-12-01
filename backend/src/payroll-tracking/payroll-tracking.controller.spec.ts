// backend/src/payroll-tracking/payroll-tracking.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { PayrollTrackingController } from './payroll-tracking.controller';
import { PayrollTrackingService } from './payroll-tracking.service';

import {
  paySlip,
  PayslipDocument,
} from '../payroll-execution/models/payslip.schema';

describe('PayrollTrackingController', () => {
  let controller: PayrollTrackingController;
  let mockService: Partial<Record<keyof PayrollTrackingService, jest.Mock>>;

  beforeEach(async () => {
    mockService = {
      getClaimsForEmployee: jest.fn(),
      getClaimByIdForEmployee: jest.fn(),
      listTaxDocumentsForEmployee: jest.fn(),
      generatePayrollReport: jest.fn(),
      listDisputes: jest.fn(),
      updateDispute: jest.fn(),
      processRefund: jest.fn(),
      listClaims: jest.fn(),
      updateClaim: jest.fn(),
      managerApproveDispute: jest.fn(),
      transparencySummary: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollTrackingController],
      providers: [{ provide: PayrollTrackingService, useValue: mockService }],
    }).compile();

    controller = module.get<PayrollTrackingController>(PayrollTrackingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // EMPLOYEE routes (controller method names)
  it('getMyClaims -> calls service.getClaimsForEmployee', async () => {
    const user = { sub: new Types.ObjectId().toHexString() };
    const expected = [{ _id: 'c1', employeeId: user.sub }];
    (mockService.getClaimsForEmployee as jest.Mock).mockResolvedValueOnce(expected);

    const res = await controller.getMyClaims({ user } as any);
    expect(mockService.getClaimsForEmployee).toHaveBeenCalledWith(user.sub);
    expect(res).toEqual(expected);
  });

  it('getMyClaimById -> calls service.getClaimByIdForEmployee', async () => {
    const user = { sub: new Types.ObjectId().toHexString() };
    const claimId = new Types.ObjectId().toHexString();
    (mockService.getClaimByIdForEmployee as jest.Mock).mockResolvedValueOnce({ _id: claimId });

    const res = await controller.getMyClaimById({ user } as any, claimId);
    expect(mockService.getClaimByIdForEmployee).toHaveBeenCalledWith(user.sub, claimId);
    expect(res).toEqual({ _id: claimId });
  });

  it('getMyTaxDocs -> calls service.listTaxDocumentsForEmployee', async () => {
    const user = { sub: new Types.ObjectId().toHexString() };
    (mockService.listTaxDocumentsForEmployee as jest.Mock).mockResolvedValueOnce([{ payrollRunId: 'r1' }]);

    const res = await controller.getMyTaxDocs({ user } as any);
    expect(mockService.listTaxDocumentsForEmployee).toHaveBeenCalledWith(user.sub);
    expect(res).toEqual([{ payrollRunId: 'r1' }]);
  });

  // PAYROLL REPORT (controller method name is getPayrollReport)
  it('getPayrollReport -> forwards query to service.generatePayrollReport', async () => {
    const query = { month: 'run1' };
    (mockService.generatePayrollReport as jest.Mock).mockResolvedValueOnce([{ _id: 'run1', totalGross: 100 }]);

    const res = await controller.getPayrollReport(query as any);
    expect(mockService.generatePayrollReport).toHaveBeenCalledWith(query);
    expect(res).toEqual([{ _id: 'run1', totalGross: 100 }]);
  });

  // DISPUTES - list & patch
  it('listDisputes -> forwards status to service.listDisputes', async () => {
    (mockService.listDisputes as jest.Mock).mockResolvedValueOnce([{ _id: 'd1' }]);
    const res = await controller.listDisputes('OPEN');
    expect(mockService.listDisputes).toHaveBeenCalledWith({ status: 'OPEN' });
    expect(res).toEqual([{ _id: 'd1' }]);
  });

  it('patchDispute -> calls service.updateDispute', async () => {
    const user = { sub: 'u1', role: 'Payroll Specialist' };
    const dto = { note: 'note' };
    (mockService.updateDispute as jest.Mock).mockResolvedValueOnce({ _id: 'd1' });

    const res = await controller.patchDispute('d1', { user } as any, dto as any);
    expect(mockService.updateDispute).toHaveBeenCalledWith('d1', { userId: 'u1', role: 'Payroll Specialist' }, dto);
    expect(res).toEqual({ _id: 'd1' });
  });

  // REFUNDS
  it('processRefund -> calls service.processRefund', async () => {
    const user = { sub: new Types.ObjectId().toHexString(), role: 'Finance' };
    const dto = { linkedId: new Types.ObjectId().toHexString(), amount: 10 };
    (mockService.processRefund as jest.Mock).mockResolvedValueOnce({ _id: 'r1' });

    const res = await controller.processRefund({ user } as any, dto as any);
    expect(mockService.processRefund).toHaveBeenCalledWith({ userId: user.sub, role: user.role }, dto);
    expect(res).toEqual({ _id: 'r1' });
  });

  // Add any other controller method smoke tests similarly...
});

