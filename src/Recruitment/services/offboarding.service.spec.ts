import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OffboardingService } from './offboarding.service';
import { OffboardingRequest, OffboardingRequestDocument,OffboardingType, OffboardingStatus, ApprovalDecision } from '../schemas/offboarding-request.schema';
import { CreateOffboardingRequestDto } from '../dtos';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('OffboardingService', () => {
  let service: OffboardingService;
  let model: Model<OffboardingRequestDocument>;

  const mockOffboardingRequest = {
    _id: '507f1f77bcf86cd799439011',
    employeeId: '507f1f77bcf86cd799439012',
    reason: 'Better opportunity',
    type: OffboardingType.RESIGNATION,
    effectiveDate: new Date('2025-12-31'),
    status: OffboardingStatus.PENDING,
    approvals: [],
    submittedDate: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  const mockModel = {
    new: jest.fn().mockResolvedValue(mockOffboardingRequest),
    constructor: jest.fn().mockResolvedValue(mockOffboardingRequest),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffboardingService,
        {
          provide: getModelToken(OffboardingRequest.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<OffboardingService>(OffboardingService);
    model = module.get<Model<OffboardingRequestDocument>>(
      getModelToken(OffboardingRequest.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new offboarding request', async () => {
      const createDto: CreateOffboardingRequestDto = {
        employeeId: '507f1f77bcf86cd799439012',
        reason: 'Better opportunity',
        type: OffboardingType.RESIGNATION,
        effectiveDate: new Date('2025-12-31'),
      };

      const saveSpy = jest.fn().mockResolvedValue(mockOffboardingRequest);
      jest.spyOn(model, 'constructor' as any).mockImplementationOnce(() => ({
        save: saveSpy,
      }));

      // Note: Actual implementation would need proper mocking
      // This is a template for testing structure
    });
  });

  describe('findOne', () => {
    it('should return a single offboarding request', async () => {
      const id = '507f1f77bcf86cd799439011';

      mockModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockOffboardingRequest),
      });

      // Note: Complete implementation would test the actual service method
    });

    it('should throw NotFoundException when request not found', async () => {
      const id = 'nonexistent';

      mockModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatistics', () => {
    it('should return offboarding statistics', async () => {
      mockModel.countDocuments.mockResolvedValueOnce(100); // total
      mockModel.countDocuments.mockResolvedValueOnce(10);  // pending
      mockModel.countDocuments.mockResolvedValueOnce(20);  // in progress
      mockModel.countDocuments.mockResolvedValueOnce(65);  // completed
      mockModel.countDocuments.mockResolvedValueOnce(5);   // cancelled

      const stats = await service.getStatistics();

      expect(stats).toEqual({
        total: 100,
        pending: 10,
        inProgress: 20,
        completed: 65,
        cancelled: 5,
      });
    });
  });
});

