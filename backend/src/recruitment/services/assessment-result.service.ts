import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AssessmentResult, AssessmentResultDocument } from '../models/assessment-result.schema';
import { CreateAssessmentResultDto } from '../dtos/create-assessment-result.dto';
import { UpdateAssessmentResultDto } from '../dtos/update-assessment-result.dto';

@Injectable()
export class AssessmentResultService {
  constructor(
    @InjectModel(AssessmentResult.name)
    private assessmentModel: Model<AssessmentResultDocument>,
  ) {}

  // CREATE
  async create(dto: CreateAssessmentResultDto): Promise<AssessmentResult> {
    try {
      const created = new this.assessmentModel({
        ...dto,
        interviewId: new Types.ObjectId(dto.interviewId),
        interviewerId: new Types.ObjectId(dto.interviewerId),
      });
      return await created.save();
    } catch (error) {
      throw new BadRequestException(`Error creating assessment result: ${error.message}`);
    }
  }

  // FIND ALL
  async findAll(): Promise<AssessmentResult[]> {
    return this.assessmentModel
      .find()
      .populate('interviewId')
      .populate('interviewerId')
      .exec();
  }

  // FIND BY ID
  async findOne(id: string): Promise<AssessmentResult> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid assessment result ID');
    }

    const result = await this.assessmentModel
      .findById(id)
      .populate('interviewId')
      .populate('interviewerId')
      .exec();

    if (!result) {
      throw new NotFoundException(`Assessment result with ID ${id} not found`);
    }

    return result;
  }

  // UPDATE
  async update(id: string, dto: UpdateAssessmentResultDto): Promise<AssessmentResult> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid assessment result ID');
    }

    const updated = await this.assessmentModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('interviewId')
      .populate('interviewerId')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Assessment result with ID ${id} not found`);
    }

    return updated;
  }

  // DELETE
  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid assessment result ID');
    }

    const deleted = await this.assessmentModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Assessment result with ID ${id} not found`);
    }

    return { message: 'Assessment result deleted successfully' };
  }

  // FIND BY INTERVIEW
  async findByInterview(interviewId: string): Promise<AssessmentResult[]> {
    if (!Types.ObjectId.isValid(interviewId)) {
      throw new BadRequestException('Invalid interview ID');
    }

    return this.assessmentModel
      .find({ interviewId: new Types.ObjectId(interviewId) })
      .populate('interviewId')
      .populate('interviewerId')
      .exec();
  }
}