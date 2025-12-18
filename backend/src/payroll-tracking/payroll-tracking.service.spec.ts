import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { PayrollTrackingService } from './payroll-tracking.service';
import { claims as ClaimClass } from './models/claims.schema';
import { disputes as DisputeClass } from './models/disputes.schema';
import { refunds as RefundClass } from './models/refunds.schema';
import { paySlip } from '../payroll-execution/models/payslip.schema';
import { EmployeeProfile } from '../employee-profile/models/employee-profile.schema';
import { allowance } from '../payroll-configuration/models/allowance.schema';
import { ClaimStatus, DisputeStatus } from './enums/payroll-tracking-enum';

describe('PayrollTrackingService', () => {
  let service: PayrollTrackingService;

  // Mock models
  const mockClaimModel = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockDisputeModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockRefundModel = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockPayslipModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  };

  const mockEmployeeModel = {
    find: jest.fn(),
    findById: jest.fn(),
  };

  const mockAllowanceModel = {
    find: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollTrackingService,
        { provide: getModelToken(ClaimClass.name), useValue: mockClaimModel },
        {
          provide: getModelToken(DisputeClass.name),
          useValue: mockDisputeModel,
        },
        { provide: getModelToken(RefundClass.name), useValue: mockRefundModel },
        { provide: getModelToken(paySlip.name), useValue: mockPayslipModel },
        {
          provide: getModelToken(EmployeeProfile.name),
          useValue: mockEmployeeModel,
        },
        {
          provide: getModelToken(allowance.name),
          useValue: mockAllowanceModel,
        },
      ],
    }).compile();

    service = module.get<PayrollTrackingService>(PayrollTrackingService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================================================
  // CLAIMS TESTS
  // =========================================================================
  describe('getClaimsForEmployee', () => {
    const validEmployeeId = new Types.ObjectId().toString();

    it('should return claims for a valid employee id', async () => {
      const mockClaims = [
        { _id: 'claim1', employeeId: validEmployeeId, status: 'UNDER_REVIEW' },
        { _id: 'claim2', employeeId: validEmployeeId, status: 'APPROVED' },
      ];

      mockClaimModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockClaims),
        }),
      });

      const result = await service.getClaimsForEmployee(validEmployeeId);

      expect(result).toEqual(mockClaims);
      expect(mockClaimModel.find).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid employee id', async () => {
      await expect(service.getClaimsForEmployee('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getClaimByIdForEmployee', () => {
    const validEmployeeId = new Types.ObjectId().toString();
    const validClaimId = new Types.ObjectId().toString();

    it('should return claim when employee owns it', async () => {
      const mockClaim = {
        _id: validClaimId,
        employeeId: new Types.ObjectId(validEmployeeId),
        status: ClaimStatus.UNDER_REVIEW,
        toObject: jest.fn().mockReturnValue({
          _id: validClaimId,
          employeeId: validEmployeeId,
        }),
      };

      mockClaimModel.findById.mockResolvedValue(mockClaim);

      const result = await service.getClaimByIdForEmployee(
        validEmployeeId,
        validClaimId,
      );

      expect(result).toBeDefined();
      expect(mockClaimModel.findById).toHaveBeenCalledWith(validClaimId);
    });

    it('should throw BadRequestException for invalid claim id', async () => {
      await expect(
        service.getClaimByIdForEmployee(validEmployeeId, 'invalid-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when claim does not exist', async () => {
      mockClaimModel.findById.mockResolvedValue(null);

      await expect(
        service.getClaimByIdForEmployee(validEmployeeId, validClaimId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when employee does not own claim', async () => {
      const otherEmployeeId = new Types.ObjectId().toString();
      const mockClaim = {
        _id: validClaimId,
        employeeId: new Types.ObjectId(otherEmployeeId),
        status: ClaimStatus.UNDER_REVIEW,
      };

      mockClaimModel.findById.mockResolvedValue(mockClaim);

      await expect(
        service.getClaimByIdForEmployee(validEmployeeId, validClaimId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listClaims', () => {
    it('should return all claims when no filter provided', async () => {
      const mockClaims = [{ _id: 'claim1' }, { _id: 'claim2' }];

      mockClaimModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockClaims),
        }),
      });

      const result = await service.listClaims();

      expect(result).toEqual(mockClaims);
      expect(mockClaimModel.find).toHaveBeenCalledWith({});
    });

    it('should filter claims by status', async () => {
      const mockClaims = [{ _id: 'claim1', status: ClaimStatus.APPROVED }];

      mockClaimModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockClaims),
        }),
      });

      const result = await service.listClaims({ status: ClaimStatus.APPROVED });

      expect(result).toEqual(mockClaims);
      expect(mockClaimModel.find).toHaveBeenCalledWith({
        status: ClaimStatus.APPROVED,
      });
    });

    it('should throw BadRequestException for invalid status', async () => {
      await expect(
        service.listClaims({ status: 'INVALID_STATUS' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateClaim', () => {
    const validClaimId = new Types.ObjectId().toString();
    const updater = {
      userId: new Types.ObjectId().toString(),
      role: 'PAYROLL_SPECIALIST',
    };

    it('should update claim status', async () => {
      const mockClaim = {
        _id: validClaimId,
        status: ClaimStatus.UNDER_REVIEW,
        notes: [] as { note?: string }[],
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: validClaimId,
          status: ClaimStatus.APPROVED,
        }),
      };

      mockClaimModel.findById.mockResolvedValue(mockClaim);

      await service.updateClaim(validClaimId, updater, {
        status: ClaimStatus.APPROVED,
      });
      expect(mockClaim.status).toBe(ClaimStatus.APPROVED);
      expect(mockClaim.save).toHaveBeenCalled();
    });

    it('should add note to claim', async () => {
      const mockClaim = {
        _id: validClaimId,
        status: ClaimStatus.UNDER_REVIEW,
        resolutionComment: '',
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: validClaimId,
          resolutionComment: 'Test note',
        }),
      };

      mockClaimModel.findById.mockResolvedValue(mockClaim);

      await service.updateClaim(validClaimId, updater, { note: 'Test note' });

      expect(mockClaim.resolutionComment).toContain('Test note');
      expect(mockClaim.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid claim id', async () => {
      await expect(
        service.updateClaim('invalid-id', updater, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when claim does not exist', async () => {
      mockClaimModel.findById.mockResolvedValue(null);

      await expect(
        service.updateClaim(validClaimId, updater, {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // DISPUTES TESTS
  // =========================================================================
  describe('listDisputes', () => {
    it('should return all disputes when no filter provided', async () => {
      const mockDisputes = [{ _id: 'dispute1' }, { _id: 'dispute2' }];

      mockDisputeModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockDisputes),
        }),
      });

      const result = await service.listDisputes();

      expect(result).toEqual(mockDisputes);
      expect(mockDisputeModel.find).toHaveBeenCalledWith({});
    });

    it('should filter disputes by status', async () => {
      const mockDisputes = [
        { _id: 'dispute1', status: DisputeStatus.APPROVED },
      ];

      mockDisputeModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockDisputes),
        }),
      });

      const result = await service.listDisputes({
        status: DisputeStatus.APPROVED,
      });

      expect(result).toEqual(mockDisputes);
      expect(mockDisputeModel.find).toHaveBeenCalledWith({
        status: DisputeStatus.APPROVED,
      });
    });

    it('should throw BadRequestException for invalid status', async () => {
      await expect(
        service.listDisputes({ status: 'INVALID_STATUS' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateDispute', () => {
    const validDisputeId = new Types.ObjectId().toString();
    const updater = {
      userId: new Types.ObjectId().toString(),
      role: 'PAYROLL_SPECIALIST',
    };

    it('should update dispute status', async () => {
      const mockDispute = {
        _id: validDisputeId,
        status: DisputeStatus.UNDER_REVIEW,
        resolutionNotes: [] as { note?: string; role?: string }[],
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: validDisputeId,
          status: DisputeStatus.APPROVED,
        }),
      };

      mockDisputeModel.findById.mockResolvedValue(mockDispute);

      await service.updateDispute(validDisputeId, updater, {
        status: DisputeStatus.APPROVED,
      });

      expect(mockDispute.status).toBe(DisputeStatus.APPROVED);
      expect(mockDispute.save).toHaveBeenCalled();
    });

    it('should add note to dispute', async () => {
      const mockDispute = {
        _id: validDisputeId,
        status: DisputeStatus.UNDER_REVIEW,
        resolutionComment: '',
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: validDisputeId,
          resolutionComment: 'Test note',
        }),
      };

      mockDisputeModel.findById.mockResolvedValue(mockDispute);

      await service.updateDispute(validDisputeId, updater, {
        note: 'Test note',
      });

      expect(mockDispute.resolutionComment).toContain('Test note');
      expect(mockDispute.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid dispute id', async () => {
      await expect(
        service.updateDispute('invalid-id', updater, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when dispute does not exist', async () => {
      mockDisputeModel.findById.mockResolvedValue(null);

      await expect(
        service.updateDispute(validDisputeId, updater, {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('managerApproveDispute', () => {
    const validDisputeId = new Types.ObjectId().toString();
    const managerId = new Types.ObjectId().toString();

    it('should approve dispute and add manager note', async () => {
      const mockDispute = {
        _id: validDisputeId,
        status: DisputeStatus.UNDER_REVIEW,
        resolutionComment: '',
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: validDisputeId,
          status: DisputeStatus.APPROVED,
        }),
      };

      mockDisputeModel.findById.mockResolvedValue(mockDispute);

      await service.managerApproveDispute(validDisputeId, managerId);

      expect(mockDispute.status).toBe(DisputeStatus.APPROVED);
      expect(mockDispute.resolutionComment).toContain('Payroll Manager');
      expect(mockDispute.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid dispute id', async () => {
      await expect(
        service.managerApproveDispute('invalid-id', managerId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when dispute does not exist', async () => {
      mockDisputeModel.findById.mockResolvedValue(null);

      await expect(
        service.managerApproveDispute(validDisputeId, managerId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // TRANSPARENCY & REPORTS TESTS
  // =========================================================================
  describe('transparencySummary', () => {
    it('should return transparency summary counts', async () => {
      mockPayslipModel.countDocuments.mockResolvedValue(100);
      mockDisputeModel.countDocuments
        .mockResolvedValueOnce(20) // totalDisputes
        .mockResolvedValueOnce(5); // pendingDisputes
      mockClaimModel.countDocuments
        .mockResolvedValueOnce(30) // totalClaims
        .mockResolvedValueOnce(10); // pendingClaims
      mockRefundModel.countDocuments.mockResolvedValue(15);

      const result = await service.transparencySummary();

      expect(result).toEqual({
        totalPayslips: 100,
        totalDisputes: 20,
        totalClaims: 30,
        pendingDisputes: 5,
        pendingClaims: 10,
        refundsProcessed: 15,
      });
    });
  });

  describe('generatePayrollReport', () => {
    it('should generate aggregated payroll report', async () => {
      const mockReport = [
        { _id: 'run1', totalGross: 50000, totalNet: 40000, count: 10 },
      ];

      mockPayslipModel.aggregate.mockResolvedValue(mockReport);

      const result = await service.generatePayrollReport({});

      expect(result).toEqual(mockReport);
      expect(mockPayslipModel.aggregate).toHaveBeenCalled();
    });

    it('should filter by month when provided', async () => {
      const mockReport = [
        { _id: 'run1', totalGross: 25000, totalNet: 20000, count: 5 },
      ];

      mockPayslipModel.aggregate.mockResolvedValue(mockReport);

      const monthId = new Types.ObjectId().toString();
      const result = await service.generatePayrollReport({ month: monthId });

      expect(result).toEqual(mockReport);
    });
  });

  // =========================================================================
  // REFUNDS TESTS
  // =========================================================================
  describe('processRefund', () => {
    const actor = {
      userId: new Types.ObjectId().toString(),
      role: 'FINANCE_STAFF',
    };
    const validLinkedId = new Types.ObjectId().toString();

    it('should process refund for dispute', async () => {
      const mockDispute = {
        _id: validLinkedId,
        employeeId: new Types.ObjectId(),
        status: DisputeStatus.UNDER_REVIEW,
        resolutionNotes: [],
        save: jest.fn().mockResolvedValue(true),
      };

      const mockRefund = {
        _id: 'refund1',
        toObject: jest.fn().mockReturnValue({ _id: 'refund1' }),
      };

      mockDisputeModel.findById.mockResolvedValue(mockDispute);
      mockClaimModel.findById.mockResolvedValue(null);
      mockRefundModel.create.mockResolvedValue(mockRefund);

      await service.processRefund(actor, {
        linkedId: validLinkedId,
        amount: 100,
        reason: 'Refund for dispute',
      });

      expect(mockRefundModel.create).toHaveBeenCalled();
      expect(mockDispute.status).toBe(DisputeStatus.APPROVED);
      expect(mockDispute.save).toHaveBeenCalled();
    });

    it('should process refund for claim when no dispute found', async () => {
      const mockClaim = {
        _id: validLinkedId,
        employeeId: new Types.ObjectId(),
        status: ClaimStatus.UNDER_REVIEW,
        notes: [],
        save: jest.fn().mockResolvedValue(true),
      };

      const mockRefund = {
        _id: 'refund1',
        toObject: jest.fn().mockReturnValue({ _id: 'refund1' }),
      };

      mockDisputeModel.findById.mockResolvedValue(null);
      mockClaimModel.findById.mockResolvedValue(mockClaim);
      mockRefundModel.create.mockResolvedValue(mockRefund);

      await service.processRefund(actor, {
        linkedId: validLinkedId,
        amount: 100,
        reason: 'Refund for claim',
      });

      expect(mockRefundModel.create).toHaveBeenCalled();
      expect(mockClaim.status).toBe(ClaimStatus.APPROVED);
      expect(mockClaim.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid linked id', async () => {
      await expect(
        service.processRefund(actor, {
          linkedId: 'invalid-id',
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when no dispute or claim found', async () => {
      mockDisputeModel.findById.mockResolvedValue(null);
      mockClaimModel.findById.mockResolvedValue(null);

      await expect(
        service.processRefund(actor, {
          linkedId: validLinkedId,
          amount: 100,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // PAYSLIPS TESTS
  // =========================================================================
  describe('getPayslipsForEmployee', () => {
    const validEmployeeId = new Types.ObjectId().toString();

    it('should return formatted payslips for employee', async () => {
      const mockSlips = [
        {
          _id: 'slip1',
          createdAt: new Date('2024-01-15'),
          paymentStatus: 'PAID',
          totalGrossSalary: 5000,
          totaDeductions: 500,
          netPay: 4500,
        },
      ];

      mockPayslipModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockSlips),
        }),
      });

      const result = await service.getPayslipsForEmployee(validEmployeeId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('_id');
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('netPay');
    });
  });

  describe('listTaxDocumentsForEmployee', () => {
    it('should return empty array when employeeId is null', async () => {
      const result = await service.listTaxDocumentsForEmployee(null);
      expect(result).toEqual([]);
    });

    it('should return tax documents for valid employee', async () => {
      const validEmployeeId = new Types.ObjectId().toString();
      const mockSlips = [
        {
          _id: 'slip1',
          payrollRunId: 'run1',
          createdAt: new Date('2024-01-15'),
          deductionsDetails: {
            taxes: [{ amount: 100 }, { amount: 200 }],
          },
        },
      ];

      mockPayslipModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockSlips),
        }),
      });

      const result = await service.listTaxDocumentsForEmployee(validEmployeeId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('payrollRunId');
      expect(result[0]).toHaveProperty('taxYear');
      expect(result[0]).toHaveProperty('totalTaxWithheld');
    });
  });

  describe('getPayslipById', () => {
    const validEmployeeId = new Types.ObjectId().toString();
    const validSlipId = new Types.ObjectId().toString();

    it('should return detailed payslip', async () => {
      const mockSlip = {
        _id: validSlipId,
        createdAt: new Date('2024-01-15'),
        paymentStatus: 'PAID',
        totalGrossSalary: 5000,
        totaDeductions: 500,
        netPay: 4500,
        earningsDetails: { baseSalary: 4000 },
        deductionsDetails: { taxes: [{ amount: 500 }] },
      };

      mockPayslipModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockSlip),
      });

      mockEmployeeModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: validEmployeeId,
            contractType: 'FULL_TIME',
          }),
        }),
      });

      mockDisputeModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await service.getPayslipById(validEmployeeId, validSlipId);

      expect(result).toHaveProperty('_id');
      expect(result).toHaveProperty('netPay');
      expect(result).toHaveProperty('baseSalary');
    });

    it('should throw NotFoundException when payslip not found', async () => {
      mockPayslipModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.getPayslipById(validEmployeeId, validSlipId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // BASE SALARY TESTS
  // =========================================================================
  describe('getBaseSalaryForEmployee', () => {
    const validEmployeeId = new Types.ObjectId().toString();

    it('should return base salary info', async () => {
      const mockEmployee = {
        _id: validEmployeeId,
        contractType: 'FULL_TIME',
        workType: 'ON_SITE',
        payGradeId: {
          baseSalary: 5000,
          grade: 'Senior',
        },
      };

      mockEmployeeModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockEmployee),
        }),
      });

      const result = await service.getBaseSalaryForEmployee(validEmployeeId);

      expect(result).toHaveProperty('baseSalary');
    });

    it('should throw NotFoundException when employee not found', async () => {
      mockEmployeeModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.getBaseSalaryForEmployee(validEmployeeId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
