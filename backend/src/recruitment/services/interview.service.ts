import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Interview, InterviewDocument } from '../models/interview.schema';
import { CreateInterviewDto, UpdateInterviewDto } from '../dtos/create-interview.dto';

@Injectable()
export class InterviewService {
  constructor(
    @InjectModel(Interview.name) 
    private interviewModel: Model<InterviewDocument>,
  ) {}

  async create(createInterviewDto: CreateInterviewDto): Promise<Interview> {
    try {
      const createdInterview = new this.interviewModel(createInterviewDto);
      return await createdInterview.save();
    } catch (error) {
      throw new BadRequestException(`Error creating interview: ${error.message}`);
    }
  }

  async findAll(): Promise<Interview[]> {
    return this.interviewModel.find()
      .populate('applicationId')
      .populate('panel')
      .populate('feedbackId')
      .exec();
  }

  async findOne(id: string): Promise<Interview> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid interview ID format');
    }

    const interview = await this.interviewModel.findById(id)
      .populate('applicationId')
      .populate('panel')
      .populate('feedbackId')
      .exec();
    
    if (!interview) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }
    return interview;
  }

  async update(id: string, updateInterviewDto: UpdateInterviewDto): Promise<Interview> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid interview ID format');
    }

    const existingInterview = await this.interviewModel
      .findByIdAndUpdate(id, updateInterviewDto, { new: true })
      .populate('applicationId')
      .populate('panel')
      .populate('feedbackId')
      .exec();
    
    if (!existingInterview) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }
    return existingInterview;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid interview ID format');
    }

    const result = await this.interviewModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }
  }

  async findByApplication(applicationId: string): Promise<Interview[]> {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestException('Invalid application ID format');
    }

    return this.interviewModel.find({ applicationId: new Types.ObjectId(applicationId) })
      .populate('panel')
      .populate('feedbackId')
      .exec();
  }

  async findByStage(applicationId: string, stage: string): Promise<Interview[]> {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestException('Invalid application ID format');
    }

    return this.interviewModel.find({ 
      applicationId: new Types.ObjectId(applicationId),
      stage 
    })
    .populate('panel')
    .exec();
  }

  async findByPanelMember(panelMemberId: string): Promise<Interview[]> {
    if (!Types.ObjectId.isValid(panelMemberId)) {
      throw new BadRequestException('Invalid panel member ID format');
    }

    return this.interviewModel.find({ panel: new Types.ObjectId(panelMemberId) })
      .populate('applicationId')
      .exec();
  }

  async updateStatus(id: string, status: string): Promise<Interview> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid interview ID format');
    }

    const validStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updatedInterview = await this.interviewModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
    .populate('applicationId')
    .populate('panel')
    .populate('feedbackId')
    .exec();

    if (!updatedInterview) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }

    return updatedInterview;
  }
}