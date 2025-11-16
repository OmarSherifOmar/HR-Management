import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OffboardingRequest, OffboardingRequestDocument } from '../schemas/offboarding-request.schema';
import { CreateOffboardingRequestDto, UpdateOffboardingRequestDto, ApprovalDto } from '../dtos';
import { OffboardingStatus, ApprovalDecision } from '../enums';

@Injectable()
export class OffboardingService {
  constructor(
    @InjectModel(OffboardingRequest.name)
    private offboardingRequestModel: Model<OffboardingRequestDocument>,
  ) {}

  /**
   * Create a new offboarding request
   */
  async create(createDto: CreateOffboardingRequestDto): Promise<OffboardingRequestDocument> {
    const offboardingRequest = new this.offboardingRequestModel({
      ...createDto,
      status: OffboardingStatus.PENDING,
      submittedDate: new Date(),
      approvals: [],
    });
    return offboardingRequest.save();
  }

  /**
   * Get all offboarding requests
   */
  async findAll(): Promise<OffboardingRequestDocument[]> {
    return this.offboardingRequestModel
      .find()
      .populate('employeeId', 'firstName lastName email')
      .populate('submittedBy', 'firstName lastName')
      .sort({ submittedDate: -1 })
      .exec();
  }

  /**
   * Get offboarding request by ID
   */
  async findOne(id: string): Promise<OffboardingRequestDocument> {
    const request = await this.offboardingRequestModel
      .findById(id)
      .populate('employeeId', 'firstName lastName email department position')
      .populate('submittedBy', 'firstName lastName')
      .populate('approvals.approverId', 'firstName lastName')
      .exec();

    if (!request) {
      throw new NotFoundException(`Offboarding request with ID ${id} not found`);
    }

    return request;
  }

  /**
   * Get offboarding requests by employee ID
   */
  async findByEmployee(employeeId: string): Promise<OffboardingRequestDocument[]> {
    return this.offboardingRequestModel
      .find({ employeeId })
      .populate('submittedBy', 'firstName lastName')
      .sort({ submittedDate: -1 })
      .exec();
  }

  /**
   * Get offboarding requests by status
   */
  async findByStatus(status: OffboardingStatus): Promise<OffboardingRequestDocument[]> {
    return this.offboardingRequestModel
      .find({ status })
      .populate('employeeId', 'firstName lastName email')
      .populate('submittedBy', 'firstName lastName')
      .sort({ submittedDate: -1 })
      .exec();
  }

  /**
   * Update an offboarding request
   */
  async update(id: string, updateDto: UpdateOffboardingRequestDto): Promise<OffboardingRequestDocument> {
    const request = await this.offboardingRequestModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .populate('employeeId', 'firstName lastName email')
      .exec();

    if (!request) {
      throw new NotFoundException(`Offboarding request with ID ${id} not found`);
    }

    return request;
  }

  /**
   * Add approval to an offboarding request
   */
  async addApproval(id: string, approvalDto: ApprovalDto): Promise<OffboardingRequestDocument> {
    const request = await this.findOne(id);

    // Create approval entry
    const approval = {
      role: approvalDto.role,
      approverId: approvalDto.approverId,
      decision: approvalDto.decision,
      comments: approvalDto.comments,
      timestamp: new Date(),
    };

    request.approvals.push(approval as any);

    // Update status based on approvals
    if (approvalDto.decision === ApprovalDecision.REJECTED) {
      request.status = OffboardingStatus.CANCELLED;
    } else if (this.areAllApprovalsComplete(request)) {
      request.status = OffboardingStatus.IN_PROGRESS;
    }

    return request.save();
  }

  /**
   * Complete an offboarding request
   */
  async complete(id: string): Promise<OffboardingRequestDocument> {
    const request = await this.findOne(id);

    if (request.status === OffboardingStatus.COMPLETED) {
      throw new BadRequestException('Offboarding request is already completed');
    }

    request.status = OffboardingStatus.COMPLETED;
    request.completedDate = new Date();

    return request.save();
  }

  /**
   * Cancel an offboarding request
   */
  async cancel(id: string, reason?: string): Promise<OffboardingRequestDocument> {
    const request = await this.findOne(id);

    if (request.status === OffboardingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed offboarding request');
    }

    request.status = OffboardingStatus.CANCELLED;
    if (reason) {
      request.notes = request.notes ? `${request.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
    }

    return request.save();
  }

  /**
   * Delete an offboarding request
   */
  async remove(id: string): Promise<void> {
    const result = await this.offboardingRequestModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Offboarding request with ID ${id} not found`);
    }
  }

  /**
   * Check if all required approvals are complete
   */
  private areAllApprovalsComplete(request: OffboardingRequestDocument): boolean {
    // This is a simple check - you might want to implement more complex logic
    // based on your business requirements (e.g., required approval roles)
    return request.approvals.every(
      (approval) => approval.decision === ApprovalDecision.APPROVED,
    );
  }

  /**
   * Get offboarding statistics
   */
  async getStatistics(): Promise<any> {
    const total = await this.offboardingRequestModel.countDocuments();
    const pending = await this.offboardingRequestModel.countDocuments({ status: OffboardingStatus.PENDING });
    const inProgress = await this.offboardingRequestModel.countDocuments({ status: OffboardingStatus.IN_PROGRESS });
    const completed = await this.offboardingRequestModel.countDocuments({ status: OffboardingStatus.COMPLETED });
    const cancelled = await this.offboardingRequestModel.countDocuments({ status: OffboardingStatus.CANCELLED });

    return {
      total,
      pending,
      inProgress,
      completed,
      cancelled,
    };
  }
}

