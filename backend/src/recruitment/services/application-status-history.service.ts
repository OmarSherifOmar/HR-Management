import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  ApplicationStatusHistory,
  ApplicationStatusHistoryDocument,
} from '../models/application-history.schema';
import { CreateApplicationStatusHistoryDto } from '../dtos/create-application-status-history.dto';
import { UpdateApplicationStatusHistoryDto } from '../dtos/update-application-status-history.dto';

@Injectable()
export class ApplicationStatusHistoryService {
  constructor(
    @InjectModel(ApplicationStatusHistory.name)
    private readonly historyModel: Model<ApplicationStatusHistoryDocument>,
  ) {}

  async create(
    dto: CreateApplicationStatusHistoryDto,
  ): Promise<ApplicationStatusHistoryDocument> {
    const created = new this.historyModel(dto);
    return created.save();
  }

  async findAll(): Promise<ApplicationStatusHistoryDocument[]> {
    return this.historyModel
      .find()
      .populate('applicationId')
      .populate('changedBy')
      .exec();
  }

  async findOne(id: string): Promise<ApplicationStatusHistoryDocument> {
    const doc = await this.historyModel
      .findById(id)
      .populate('applicationId')
      .populate('changedBy')
      .exec();

    if (!doc) {
      throw new NotFoundException(
        `ApplicationStatusHistory with id "${id}" not found`,
      );
    }

    return doc;
  }

  async findByApplication(
    applicationId: string,
  ): Promise<ApplicationStatusHistoryDocument[]> {
    return this.historyModel
      .find({ applicationId })
      .sort({ createdAt: 1 })
      .populate('applicationId')
      .populate('changedBy')
      .exec();
  }

  async update(
    id: string,
    dto: UpdateApplicationStatusHistoryDto,
  ): Promise<ApplicationStatusHistoryDocument> {
    const updated = await this.historyModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(
        `ApplicationStatusHistory with id "${id}" not found`,
      );
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.historyModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(
        `ApplicationStatusHistory with id "${id}" not found`,
      );
    }
  }
}