import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ResignationRequest,
  ResignationRequestDocument,
} from '../models/resignation-request.schema';
import { CreateResignationRequestDto } from '../dtos/create-resignation-request.dto';
import { UpdateResignationRequestDto } from '../dtos/update-resignation-request.dto';
import { ResignationStatus } from '../enums/resignation-status.enum';

/**
 * Service for OFF-018 & OFF-019
 * Employee Resignation Request and Tracking
 */
@Injectable()
export class ResignationRequestService {
  constructor(
    @InjectModel(ResignationRequest.name)
    private readonly resignationModel: Model<ResignationRequestDocument>,
  ) {}

  /**
   * OFF-018: Employee requests a Resignation with reasoning
   */
  async create(
    dto: CreateResignationRequestDto,
  ): Promise<ResignationRequestDocument> {
    const resignation = new this.resignationModel({
      ...dto,
      status: ResignationStatus.SUBMITTED,
    });
    return resignation.save();
  }

  async findAll(): Promise<ResignationRequestDocument[]> {
    return this.resignationModel
      .find()
      .populate('employeeId')
      .populate('reviewedBy')
      .populate('contractId')
      .exec();
  }

  async findOne(id: string): Promise<ResignationRequestDocument> {
    const resignation = await this.resignationModel
      .findById(id)
      .populate('employeeId')
      .populate('reviewedBy')
      .populate('contractId')
      .exec();

    if (!resignation) {
      throw new NotFoundException(`Resignation request with id "${id}" not found`);
    }

    return resignation;
  }

  /**
   * OFF-019: Employee tracks resignation request status
   */
  async findByEmployee(employeeId: string): Promise<ResignationRequestDocument[]> {
    return this.resignationModel
      .find({ employeeId })
      .populate('employeeId')
      .populate('reviewedBy')
      .populate('contractId')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * HR/Manager reviews and updates resignation request
   */
  async update(
    id: string,
    dto: UpdateResignationRequestDto,
    reviewedBy?: string,
  ): Promise<ResignationRequestDocument> {
    const updateData: any = { ...dto };

    if (reviewedBy) {
      updateData.reviewedBy = reviewedBy;
      updateData.reviewedAt = new Date();
    }

    const updated = await this.resignationModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('employeeId')
      .populate('reviewedBy')
      .populate('contractId')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Resignation request with id "${id}" not found`);
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.resignationModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Resignation request with id "${id}" not found`);
    }
  }

  /**
   * Get resignation requests pending review
   */
  async findPendingRequests(): Promise<ResignationRequestDocument[]> {
    return this.resignationModel
      .find({
        status: { $in: [ResignationStatus.SUBMITTED, ResignationStatus.UNDER_REVIEW] },
      })
      .populate('employeeId')
      .populate('contractId')
      .sort({ createdAt: 1 })
      .exec();
  }
}
