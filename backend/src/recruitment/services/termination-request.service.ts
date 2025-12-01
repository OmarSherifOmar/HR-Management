import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TerminationRequest,
  TerminationRequestDocument,
} from '../models/termination-request.schema';
import { CreateTerminationRequestDto } from '../dtos/create-termination-request.dto';
import { UpdateTerminationRequestDto } from '../dtos/update-termination-request.dto';
import { TerminationStatus } from '../enums/termination-status.enum';
// TODO: Import PerformanceService when available
// import { PerformanceService } from '../../performance/performance.service';

/**
 * Service for OFF-001
 * HR Manager initiates termination reviews based on warnings and performance data
 */
@Injectable()
export class TerminationRequestService {
  constructor(
    @InjectModel(TerminationRequest.name)
    private readonly terminationModel: Model<TerminationRequestDocument>,
    // TODO: Inject PerformanceService when available
    // private readonly performanceService: PerformanceService,
  ) {}

  /**
   * OFF-001: HR Manager initiates termination review
   * Based on warnings and performance data/manager requests
   */
  async create(
    dto: CreateTerminationRequestDto,
  ): Promise<TerminationRequestDocument> {
    const termination = new this.terminationModel({
      ...dto,
      status: TerminationStatus.PENDING,
    });
    return termination.save();
  }

  /**
   * Get performance data for termination decision
   * TODO: Integrate with PerformanceService for actual performance data
   */
  async getEmployeePerformanceData(employeeId: string): Promise<{
    performanceHistory: any[];
    warningRecords: any[];
    hasTerminationWarnings: boolean;
  }> {
    // TODO: Call PerformanceService to get performance and warning data
    // Example implementation when PerformanceService is ready:
    // const [performanceHistory, warningRecords, hasTerminationWarnings] =
    //   await Promise.all([
    //     this.performanceService.getPerformanceHistory(employeeId),
    //     this.performanceService.getWarningRecords(employeeId),
    //     this.performanceService.hasTerminationWarnings(employeeId),
    //   ]);

    // For now, return empty data (ready for integration)
    console.log(`Performance data requested for employee ${employeeId}`);
    return {
      performanceHistory: [],
      warningRecords: [],
      hasTerminationWarnings: false,
    };
  }

  async findAll(): Promise<TerminationRequestDocument[]> {
    return this.terminationModel
      .find()
      .populate('employeeId')
      .populate('contractId')
      .exec();
  }

  async findOne(id: string): Promise<TerminationRequestDocument> {
    const termination = await this.terminationModel
      .findById(id)
      .populate('employeeId')
      .populate('contractId')
      .exec();

    if (!termination) {
      throw new NotFoundException(`Termination request with id "${id}" not found`);
    }

    return termination;
  }

  async findByEmployee(employeeId: string): Promise<TerminationRequestDocument[]> {
    return this.terminationModel
      .find({ employeeId })
      .populate('employeeId')
      .populate('contractId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    id: string,
    dto: UpdateTerminationRequestDto,
  ): Promise<TerminationRequestDocument> {
    const updated = await this.terminationModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('employeeId')
      .populate('contractId')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Termination request with id "${id}" not found`);
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.terminationModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Termination request with id "${id}" not found`);
    }
  }

  /**
   * Get termination requests pending review
   */
  async findPendingRequests(): Promise<TerminationRequestDocument[]> {
    return this.terminationModel
      .find({
        status: { $in: [TerminationStatus.PENDING, TerminationStatus.UNDER_REVIEW] },
      })
      .populate('employeeId')
      .populate('contractId')
      .sort({ createdAt: 1 })
      .exec();
  }
}

