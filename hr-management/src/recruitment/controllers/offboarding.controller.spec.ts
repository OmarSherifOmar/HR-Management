import { Test, TestingModule } from '@nestjs/testing';
import { OffboardingController } from './offboarding.controller';
import { OffboardingService } from '../services/offboarding.service';
import { CreateOffboardingRequestDto, UpdateOffboardingRequestDto, ApprovalDto } from '../dtos';
import { OffboardingType, OffboardingStatus, ApprovalDecision } from '../schemas/offboarding-request.schema' ;

describe('OffboardingController', () => {
  let controller: OffboardingController;
  let service: OffboardingService;

  const mockOffboardingService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByEmployee: jest.fn(),
    findByStatus: jest.fn(),
    update: jest.fn(),
    addApproval: jest.fn(),
    complete: jest.fn(),
    cancel: jest.fn(),
    remove: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OffboardingController],
      providers: [
        {
          provide: OffboardingService,
          useValue: mockOffboardingService,
        },
      ],
    }).compile();

    controller = module.get<OffboardingController>(OffboardingController);
    service = module.get<OffboardingService>(OffboardingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an offboarding request', async () => {
      const createDto: CreateOffboardingRequestDto = {
        employeeId: '507f1f77bcf86cd799439011',
        reason: 'Better opportunity',
        type: OffboardingType.RESIGNATION,
        effectiveDate: new Date('2025-12-31'),
      };

      const expectedResult = {
        _id: '507f1f77bcf86cd799439012',
        ...createDto,
        status: OffboardingStatus.PENDING,
      };

      mockOffboardingService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return all offboarding requests', async () => {
      const expectedResult = [
        {
          _id: '1',
          employeeId: '507f1f77bcf86cd799439011',
          status: OffboardingStatus.PENDING,
        },
      ];

      mockOffboardingService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should filter by status when provided', async () => {
      const status = OffboardingStatus.PENDING;
      const expectedResult = [
        {
          _id: '1',
          status: OffboardingStatus.PENDING,
        },
      ];

      mockOffboardingService.findByStatus.mockResolvedValue(expectedResult);

      const result = await controller.findAll(status);

      expect(service.findByStatus).toHaveBeenCalledWith(status);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single offboarding request', async () => {
      const id = '507f1f77bcf86cd799439011';
      const expectedResult = {
        _id: id,
        status: OffboardingStatus.PENDING,
      };

      mockOffboardingService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update an offboarding request', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateOffboardingRequestDto = {
        status: OffboardingStatus.IN_PROGRESS,
      };

      const expectedResult = {
        _id: id,
        ...updateDto,
      };

      mockOffboardingService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('addApproval', () => {
    it('should add approval to an offboarding request', async () => {
      const id = '507f1f77bcf86cd799439011';
      const approvalDto: ApprovalDto = {
        role: 'HR Manager',
        approverId: '507f1f77bcf86cd799439012',
        decision: ApprovalDecision.APPROVED,
        comments: 'Approved',
      };

      const expectedResult = {
        _id: id,
        approvals: [approvalDto],
      };

      mockOffboardingService.addApproval.mockResolvedValue(expectedResult);

      const result = await controller.addApproval(id, approvalDto);

      expect(service.addApproval).toHaveBeenCalledWith(id, approvalDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('complete', () => {
    it('should complete an offboarding request', async () => {
      const id = '507f1f77bcf86cd799439011';
      const expectedResult = {
        _id: id,
        status: OffboardingStatus.COMPLETED,
        completedDate: new Date(),
      };

      mockOffboardingService.complete.mockResolvedValue(expectedResult);

      const result = await controller.complete(id);

      expect(service.complete).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('cancel', () => {
    it('should cancel an offboarding request', async () => {
      const id = '507f1f77bcf86cd799439011';
      const reason = 'Employee decided to stay';
      const expectedResult = {
        _id: id,
        status: OffboardingStatus.CANCELLED,
      };

      mockOffboardingService.cancel.mockResolvedValue(expectedResult);

      const result = await controller.cancel(id, reason);

      expect(service.cancel).toHaveBeenCalledWith(id, reason);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete an offboarding request', async () => {
      const id = '507f1f77bcf86cd799439011';

      mockOffboardingService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toBeUndefined();
    });
  });

  describe('getStatistics', () => {
    it('should return offboarding statistics', async () => {
      const expectedResult = {
        total: 100,
        pending: 10,
        inProgress: 20,
        completed: 65,
        cancelled: 5,
      };

      mockOffboardingService.getStatistics.mockResolvedValue(expectedResult);

      const result = await controller.getStatistics();

      expect(service.getStatistics).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });
});

