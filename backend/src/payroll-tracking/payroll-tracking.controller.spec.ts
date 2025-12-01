/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

import { PayrollTrackingController } from './payroll-tracking.controller';
import { PayrollTrackingService } from './payroll-tracking.service';
import { Role } from '../auth/decorators/roles.decorator';
import { ClaimStatus, DisputeStatus } from './enums/payroll-tracking-enum';

describe('PayrollTrackingController', () => {
  let controller: PayrollTrackingController;
  const mockService = {
    // Claims
    createClaim: jest.fn(),
    getClaimsForEmployee: jest.fn(),
    getClaimByIdForEmployee: jest.fn(),
    listClaims: jest.fn(),
    updateClaim: jest.fn(),
    claimSpecialistDecision: jest.fn(),
    claimManagerDecision: jest.fn(),
    getApprovedClaims: jest.fn(),
    createRefundForClaim: jest.fn(),
    createExpenseRefundForClaim: jest.fn(),

    // Disputes
    createDispute: jest.fn(),
    listDisputes: jest.fn(),
    updateDispute: jest.fn(),
    disputeSpecialistDecision: jest.fn(),
    disputeManagerDecision: jest.fn(),
    managerApproveDispute: jest.fn(),
    getApprovedDisputes: jest.fn(),
    createRefundForDispute: jest.fn(),

    processRefund: jest.fn(),

    // Reports
    generatePayrollReport: jest.fn(),
    getDepartmentPayrollReport: jest.fn(),
    transparencySummary: jest.fn(),

    // Payslips
    getPayslipsForEmployee: jest.fn(),
    getPayslipById: jest.fn(),
    downloadPayslipCsv: jest.fn(),
    listTaxDocumentsForEmployee: jest.fn(),

    // Compensation
    getBaseSalaryForEmployee: jest.fn(),
    calculateLeaveCompensation: jest.fn(),
    calculateCommuteCompensation: jest.fn(),
    calculateTaxBreakdown: jest.fn(),
    calculateInsuranceBreakdown: jest.fn(),
    calculateMisconductDeductions: jest.fn(),
    calculateUnpaidLeaveDeductions: jest.fn(),
  };

  const createMockRequest = (user?: {
    sub?: string;
    id?: string;
    roles?: string[];
    role?: string;
  }) => ({
    user,
  });

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollTrackingController],
      providers: [
        {
          provide: PayrollTrackingService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PayrollTrackingController>(
      PayrollTrackingController,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // =========================================================================
  // CLAIMS TESTS
  // =========================================================================
  describe('createClaim', () => {
    const validUserId = new Types.ObjectId().toString();

    it('should create claim when employeeId matches user', async () => {
      const dto = {
        employeeId: validUserId,
        description: 'Medical claim',
        claimType: 'medical',
        amount: 500,
      };
      const req = createMockRequest({ sub: validUserId });

      mockService.createClaim.mockResolvedValue({ _id: 'claim1', ...dto });

      const result = await controller.createClaim(dto, req as any);

      expect(mockService.createClaim).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('_id');
    });

    it('should create claim when user is HR/Admin and employeeId differs', async () => {
      const otherUserId = new Types.ObjectId().toString();
      const dto = {
        employeeId: otherUserId,
        description: 'Medical claim',
        claimType: 'medical',
        amount: 500,
      };
      const req = createMockRequest({
        sub: validUserId,
        roles: [Role.HR_MANAGER],
      });

      mockService.createClaim.mockResolvedValue({ _id: 'claim1', ...dto });

      await controller.createClaim(dto, req as any);

      expect(mockService.createClaim).toHaveBeenCalledWith(dto);
    });

    it('should throw BadRequestException when employeeId does not match and not HR', async () => {
      const otherUserId = new Types.ObjectId().toString();
      const dto = {
        employeeId: otherUserId,
        description: 'Medical claim',
        claimType: 'medical',
        amount: 500,
      };
      const req = createMockRequest({
        sub: validUserId,
        role: Role.DEPARTMENT_EMPLOYEE,
      });

      await expect(controller.createClaim(dto, req as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getMyClaims', () => {
    it('should return claims for authenticated user', async () => {
      const userId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const mockClaims = [{ _id: 'claim1' }, { _id: 'claim2' }];

      mockService.getClaimsForEmployee.mockResolvedValue(mockClaims);

      const result = await controller.getMyClaims(req as any);

      expect(mockService.getClaimsForEmployee).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockClaims);
    });

    it('should throw ForbiddenException when user ID missing', async () => {
      const req = createMockRequest({});

      await expect(controller.getMyClaims(req as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getMyClaimById', () => {
    it('should return specific claim for authenticated user', async () => {
      const userId = new Types.ObjectId().toString();
      const claimId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const mockClaim = { _id: claimId, employeeId: userId };

      mockService.getClaimByIdForEmployee.mockResolvedValue(mockClaim);

      const result = await controller.getMyClaimById(req as any, claimId);

      expect(mockService.getClaimByIdForEmployee).toHaveBeenCalledWith(
        userId,
        claimId,
      );
      expect(result).toEqual(mockClaim);
    });

    it('should throw ForbiddenException when user ID missing', async () => {
      const claimId = new Types.ObjectId().toString();
      const req = createMockRequest({});

      await expect(
        controller.getMyClaimById(req as any, claimId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listClaims', () => {
    it('should list all claims', async () => {
      const mockClaims = [{ _id: 'claim1' }, { _id: 'claim2' }];
      mockService.listClaims.mockResolvedValue(mockClaims);

      const result = await controller.listClaims();

      expect(mockService.listClaims).toHaveBeenCalledWith({
        status: undefined,
      });
      expect(result).toEqual(mockClaims);
    });

    it('should filter claims by status', async () => {
      const mockClaims = [{ _id: 'claim1', status: ClaimStatus.APPROVED }];
      mockService.listClaims.mockResolvedValue(mockClaims);

      const result = await controller.listClaims(ClaimStatus.APPROVED);

      expect(mockService.listClaims).toHaveBeenCalledWith({
        status: ClaimStatus.APPROVED,
      });
      expect(result).toEqual(mockClaims);
    });
  });

  describe('patchClaim', () => {
    it('should update claim with user context', async () => {
      const userId = new Types.ObjectId().toString();
      const claimId = new Types.ObjectId().toString();
      const req = createMockRequest({
        sub: userId,
        role: 'PAYROLL_SPECIALIST',
      });
      const dto = { status: ClaimStatus.APPROVED };

      mockService.updateClaim.mockResolvedValue({ _id: claimId, ...dto });

      await controller.patchClaim(claimId, req as any, dto);

      expect(mockService.updateClaim).toHaveBeenCalledWith(
        claimId,
        { userId, role: 'PAYROLL_SPECIALIST' },
        dto,
      );
    });
  });

  describe('claimSpecialistDecision', () => {
    it('should call service with specialist decision', async () => {
      const userId = new Types.ObjectId().toString();
      const claimId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const body = { action: 'approve' as const, comment: 'Approved' };

      mockService.claimSpecialistDecision.mockResolvedValue({ _id: claimId });

      await controller.claimSpecialistDecision(claimId, body, req as any);

      expect(mockService.claimSpecialistDecision).toHaveBeenCalledWith(
        claimId,
        'approve',
        userId,
        'Approved',
        undefined,
      );
    });
  });

  describe('claimManagerDecision', () => {
    it('should call service with manager decision', async () => {
      const userId = new Types.ObjectId().toString();
      const claimId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const body = { action: 'reject' as const, comment: 'Rejected' };

      mockService.claimManagerDecision.mockResolvedValue({ _id: claimId });

      await controller.claimManagerDecision(claimId, body, req as any);

      expect(mockService.claimManagerDecision).toHaveBeenCalledWith(
        claimId,
        'reject',
        userId,
        'Rejected',
      );
    });
  });

  describe('getApprovedClaims', () => {
    it('should return approved claims', async () => {
      const mockClaims = [{ _id: 'claim1', status: ClaimStatus.APPROVED }];
      mockService.getApprovedClaims.mockResolvedValue(mockClaims);

      const result = await controller.getApprovedClaims();

      expect(mockService.getApprovedClaims).toHaveBeenCalled();
      expect(result).toEqual(mockClaims);
    });
  });

  // =========================================================================
  // DISPUTES TESTS
  // =========================================================================
  describe('createDispute', () => {
    const validUserId = new Types.ObjectId().toString();
    const validPayslipId = new Types.ObjectId().toString();

    it('should create dispute when employeeId matches user', async () => {
      const dto = {
        employeeId: validUserId,
        payslipId: validPayslipId,
        description: 'Wrong deduction',
      };
      const req = createMockRequest({ sub: validUserId });

      mockService.createDispute.mockResolvedValue({ _id: 'dispute1', ...dto });

      await controller.createDispute(dto, req as any);

      expect(mockService.createDispute).toHaveBeenCalledWith(dto);
    });

    it('should throw BadRequestException when employeeId does not match and not HR', async () => {
      const otherUserId = new Types.ObjectId().toString();
      const dto = {
        employeeId: otherUserId,
        payslipId: validPayslipId,
        description: 'Wrong deduction',
      };
      const req = createMockRequest({
        sub: validUserId,
        role: Role.DEPARTMENT_EMPLOYEE,
      });

      await expect(controller.createDispute(dto, req as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listDisputes', () => {
    it('should list all disputes', async () => {
      const mockDisputes = [{ _id: 'dispute1' }, { _id: 'dispute2' }];
      mockService.listDisputes.mockResolvedValue(mockDisputes);

      const result = await controller.listDisputes();

      expect(mockService.listDisputes).toHaveBeenCalledWith({
        status: undefined,
      });
      expect(result).toEqual(mockDisputes);
    });

    it('should filter disputes by status', async () => {
      const mockDisputes = [
        { _id: 'dispute1', status: DisputeStatus.APPROVED },
      ];
      mockService.listDisputes.mockResolvedValue(mockDisputes);

      const result = await controller.listDisputes(DisputeStatus.APPROVED);

      expect(mockService.listDisputes).toHaveBeenCalledWith({
        status: DisputeStatus.APPROVED,
      });
      expect(result).toEqual(mockDisputes);
    });
  });

  describe('patchDispute', () => {
    it('should update dispute with user context', async () => {
      const userId = new Types.ObjectId().toString();
      const disputeId = new Types.ObjectId().toString();
      const req = createMockRequest({
        sub: userId,
        role: 'PAYROLL_SPECIALIST',
      });
      const dto = { status: DisputeStatus.APPROVED };

      mockService.updateDispute.mockResolvedValue({ _id: disputeId, ...dto });

      await controller.patchDispute(disputeId, req as any, dto);

      expect(mockService.updateDispute).toHaveBeenCalledWith(
        disputeId,
        { userId, role: 'PAYROLL_SPECIALIST' },
        dto,
      );
    });
  });

  describe('managerApprove', () => {
    it('should approve dispute by manager', async () => {
      const userId = new Types.ObjectId().toString();
      const disputeId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });

      mockService.managerApproveDispute.mockResolvedValue({
        _id: disputeId,
        status: DisputeStatus.APPROVED,
      });

      await controller.managerApprove(disputeId, req as any);

      expect(mockService.managerApproveDispute).toHaveBeenCalledWith(
        disputeId,
        userId,
      );
    });
  });

  describe('addDisputeNote', () => {
    it('should add note to dispute', async () => {
      const userId = new Types.ObjectId().toString();
      const disputeId = new Types.ObjectId().toString();
      const req = createMockRequest({
        sub: userId,
        role: 'PAYROLL_SPECIALIST',
      });
      const body = { note: 'Investigation complete' };

      mockService.updateDispute.mockResolvedValue({ _id: disputeId });

      await controller.addDisputeNote(disputeId, req as any, body);

      expect(mockService.updateDispute).toHaveBeenCalledWith(
        disputeId,
        { userId, role: 'PAYROLL_SPECIALIST' },
        { note: body.note },
      );
    });
  });

  // =========================================================================
  // REFUNDS TESTS
  // =========================================================================
  describe('processRefund', () => {
    it('should process refund', async () => {
      const userId = new Types.ObjectId().toString();
      const linkedId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId, role: 'FINANCE_STAFF' });
      const dto = { linkedId, amount: 100, reason: 'Refund' };

      mockService.processRefund.mockResolvedValue({ _id: 'refund1' });

      await controller.processRefund(req as any, dto);

      expect(mockService.processRefund).toHaveBeenCalledWith(
        { userId, role: 'FINANCE_STAFF' },
        dto,
      );
    });
  });

  describe('createRefundForClaim', () => {
    it('should create refund for claim', async () => {
      const userId = new Types.ObjectId().toString();
      const claimId = new Types.ObjectId().toString();
      const employeeId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const dto = { amount: 100, reason: 'Approved claim refund', employeeId };

      mockService.createRefundForClaim.mockResolvedValue({ _id: 'refund1' });

      await controller.createRefundForClaim(claimId, dto, req as any);

      expect(mockService.createRefundForClaim).toHaveBeenCalledWith(
        claimId,
        dto,
        userId,
      );
    });
  });

  describe('createRefundForDispute', () => {
    it('should create refund for dispute', async () => {
      const userId = new Types.ObjectId().toString();
      const disputeId = new Types.ObjectId().toString();
      const employeeId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const dto = {
        amount: 100,
        reason: 'Approved dispute refund',
        employeeId,
      };

      mockService.createRefundForDispute.mockResolvedValue({ _id: 'refund1' });

      await controller.createRefundForDispute(disputeId, dto, req as any);

      expect(mockService.createRefundForDispute).toHaveBeenCalledWith(
        disputeId,
        dto,
        userId,
      );
    });
  });

  // =========================================================================
  // REPORTS & TRANSPARENCY TESTS
  // =========================================================================
  describe('getPayrollReport', () => {
    it('should generate payroll report', async () => {
      const mockReport = [{ _id: 'run1', totalGross: 50000 }];
      mockService.generatePayrollReport.mockResolvedValue(mockReport);

      const result = await controller.getPayrollReport({});

      expect(mockService.generatePayrollReport).toHaveBeenCalled();
      expect(result).toEqual(mockReport);
    });
  });

  describe('getDepartmentReport', () => {
    it('should get department payroll report', async () => {
      const departmentId = new Types.ObjectId().toString();
      const mockReport = { departmentId, totalPayroll: 100000 };

      mockService.getDepartmentPayrollReport.mockResolvedValue(mockReport);

      const result = await controller.getDepartmentReport(departmentId);

      expect(mockService.getDepartmentPayrollReport).toHaveBeenCalledWith(
        departmentId,
      );
      expect(result).toEqual(mockReport);
    });
  });

  describe('getTransparency', () => {
    it('should return transparency summary', async () => {
      const mockSummary = {
        totalPayslips: 100,
        totalDisputes: 10,
        totalClaims: 20,
        pendingDisputes: 5,
        pendingClaims: 8,
        refundsProcessed: 15,
      };

      mockService.transparencySummary.mockResolvedValue(mockSummary);

      const result = await controller.getTransparency();

      expect(mockService.transparencySummary).toHaveBeenCalled();
      expect(result).toEqual(mockSummary);
    });
  });

  // =========================================================================
  // PAYSLIPS TESTS
  // =========================================================================
  describe('getMyPayslips', () => {
    it('should return payslips for authenticated user', async () => {
      const userId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const mockPayslips = [{ _id: 'slip1' }, { _id: 'slip2' }];

      mockService.getPayslipsForEmployee.mockResolvedValue(mockPayslips);

      const result = await controller.getMyPayslips(req as any);

      expect(mockService.getPayslipsForEmployee).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockPayslips);
    });

    it('should throw ForbiddenException when user ID missing', () => {
      const req = createMockRequest({});

      expect(() => controller.getMyPayslips(req as any)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getMyPayslip', () => {
    it('should return specific payslip', async () => {
      const userId = new Types.ObjectId().toString();
      const payslipId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const mockPayslip = { _id: payslipId, netPay: 4500 };

      mockService.getPayslipById.mockResolvedValue(mockPayslip);

      const result = await controller.getMyPayslip(req as any, payslipId);

      expect(mockService.getPayslipById).toHaveBeenCalledWith(
        userId,
        payslipId,
      );
      expect(result).toEqual(mockPayslip);
    });

    it('should throw ForbiddenException when user ID missing', () => {
      const payslipId = new Types.ObjectId().toString();
      const req = createMockRequest({});

      expect(() => controller.getMyPayslip(req as any, payslipId)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getMyTaxDocs', () => {
    it('should return tax documents', async () => {
      const userId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const mockDocs = [{ payrollRunId: 'run1', taxYear: 2024 }];

      mockService.listTaxDocumentsForEmployee.mockResolvedValue(mockDocs);

      const result = await controller.getMyTaxDocs(req as any);

      expect(mockService.listTaxDocumentsForEmployee).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual(mockDocs);
    });
  });

  // =========================================================================
  // COMPENSATION ENDPOINTS TESTS
  // =========================================================================
  describe('getMyBaseSalary', () => {
    it('should return base salary', async () => {
      const userId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const mockSalary = { baseSalary: 5000, grade: 'Senior' };

      mockService.getBaseSalaryForEmployee.mockResolvedValue(mockSalary);

      const result = await controller.getMyBaseSalary(req as any);

      expect(mockService.getBaseSalaryForEmployee).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockSalary);
    });

    it('should throw ForbiddenException when user ID missing', async () => {
      const req = createMockRequest({});

      await expect(controller.getMyBaseSalary(req as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getMyLeaveCompensation', () => {
    it('should calculate leave compensation', async () => {
      const userId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const mockCompensation = { amount: 1500, days: 5 };

      mockService.calculateLeaveCompensation.mockResolvedValue(
        mockCompensation,
      );

      const result = await controller.getMyLeaveCompensation(
        req as any,
        '5',
        'true',
        '22',
      );

      expect(mockService.calculateLeaveCompensation).toHaveBeenCalledWith(
        userId,
        5,
        true,
        22,
      );
      expect(result).toEqual(mockCompensation);
    });

    it('should throw ForbiddenException when user ID missing', async () => {
      const req = createMockRequest({});

      await expect(
        controller.getMyLeaveCompensation(req as any, '5'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when remainingDays missing', async () => {
      const userId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });

      await expect(
        controller.getMyLeaveCompensation(req as any, ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for negative remainingDays', async () => {
      const userId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });

      await expect(
        controller.getMyLeaveCompensation(req as any, '-5'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMyCommuteCompensation', () => {
    it('should return commute compensation', async () => {
      const userId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const mockCompensation = { amount: 200 };

      mockService.calculateCommuteCompensation.mockResolvedValue(
        mockCompensation,
      );

      const result = await controller.getMyCommuteCompensation(req as any);

      expect(mockService.calculateCommuteCompensation).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual(mockCompensation);
    });
  });

  describe('getMyTaxDeductions', () => {
    it('should return tax deductions breakdown', async () => {
      const userId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const mockDeductions = { total: 500, items: [] };

      mockService.calculateTaxBreakdown.mockResolvedValue(mockDeductions);

      const result = await controller.getMyTaxDeductions(req as any);

      expect(mockService.calculateTaxBreakdown).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockDeductions);
    });
  });

  describe('getMyInsuranceDeductions', () => {
    it('should return insurance deductions breakdown', async () => {
      const userId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const mockDeductions = { total: 300, items: [] };

      mockService.calculateInsuranceBreakdown.mockResolvedValue(mockDeductions);

      const result = await controller.getMyInsuranceDeductions(req as any);

      expect(mockService.calculateInsuranceBreakdown).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual(mockDeductions);
    });
  });

  describe('getMyMisconductDeductions', () => {
    it('should return misconduct deductions', async () => {
      const userId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const mockDeductions = { total: 100, items: [] };

      mockService.calculateMisconductDeductions.mockResolvedValue(
        mockDeductions,
      );

      const result = await controller.getMyMisconductDeductions(req as any);

      expect(mockService.calculateMisconductDeductions).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual(mockDeductions);
    });
  });

  describe('getMyUnpaidLeaveDeductions', () => {
    it('should return unpaid leave deductions', async () => {
      const userId = new Types.ObjectId().toString();
      const req = createMockRequest({ sub: userId });
      const mockDeductions = { total: 250, days: 2 };

      mockService.calculateUnpaidLeaveDeductions.mockResolvedValue(
        mockDeductions,
      );

      const result = await controller.getMyUnpaidLeaveDeductions(req as any);

      expect(mockService.calculateUnpaidLeaveDeductions).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual(mockDeductions);
    });
  });
});
