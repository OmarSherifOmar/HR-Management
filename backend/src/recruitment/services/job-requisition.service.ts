import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JobRequisition, JobRequisitionDocument } from '../models/job-requisition.schema';
import { Model, Types } from 'mongoose';
import { CreateJobRequisitionDto } from '../dtos/create-job-requisition.dto';
import { UpdateJobRequisitionDto } from '../dtos/update-job-requisition.dto';

@Injectable()
export class JobRequisitionService {
  constructor(
    @InjectModel(JobRequisition.name)
    private jobReqModel: Model<JobRequisitionDocument>,
  ) {}

  // CREATE
  async create(dto: CreateJobRequisitionDto): Promise<JobRequisition> {
    try {
      const created = new this.jobReqModel({
        ...dto,
        templateId: dto.templateId ? new Types.ObjectId(dto.templateId) : undefined,
        hiringManagerId: new Types.ObjectId(dto.hiringManagerId),
      });

      return await created.save();
    } catch (error) {
      throw new BadRequestException(`Error creating job requisition: ${error.message}`);
    }
  }

  // GET ALL
  async findAll(): Promise<JobRequisition[]> {
    return this.jobReqModel
      .find()
      .populate('templateId')
      .populate('hiringManagerId')
      .exec();
  }

  // GET BY ID
  async findOne(id: string): Promise<JobRequisition> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid requisition ID');
    }

    const found = await this.jobReqModel
      .findById(id)
      .populate('templateId')
      .populate('hiringManagerId')
      .exec();

    if (!found) {
      throw new NotFoundException(`Job requisition with ID ${id} not found`);
    }

    return found;
  }

  // UPDATE
  async update(id: string, dto: UpdateJobRequisitionDto): Promise<JobRequisition> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid requisition ID');
    }

    const updated = await this.jobReqModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .populate('templateId')
      .populate('hiringManagerId')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Job requisition with ID ${id} not found`);
    }

    return updated;
  }

  // DELETE
  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid requisition ID');
    }

    const deleted = await this.jobReqModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException(`Job requisition with ID ${id} not found`);
    }

    return { message: 'Job requisition deleted successfully' };
  }

  // FIND BY STATUS
  async findByStatus(status: string): Promise<JobRequisition[]> {
    return this.jobReqModel
      .find({ publishStatus: status })
      .populate('templateId')
      .populate('hiringManagerId')
      .exec();
  }
}