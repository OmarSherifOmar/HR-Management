import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobTemplate, JobTemplateDocument } from '../models/job-template.schema';
import { CreateJobTemplateDto, UpdateJobTemplateDto } from '../dtos/create-job-template.dto';

@Injectable()
export class JobTemplateService {
  constructor(
    @InjectModel(JobTemplate.name) 
    private jobTemplateModel: Model<JobTemplateDocument>,
  ) {}

  async create(createJobTemplateDto: CreateJobTemplateDto): Promise<JobTemplate> {
    const createdJobTemplate = new this.jobTemplateModel(createJobTemplateDto);
    return createdJobTemplate.save();
  }

  async findAll(): Promise<JobTemplate[]> {
    return this.jobTemplateModel.find().exec();
  }

  async findOne(id: string): Promise<JobTemplate> {
    const jobTemplate = await this.jobTemplateModel.findById(id).exec();
    if (!jobTemplate) {
      throw new NotFoundException(`JobTemplate with ID ${id} not found`);
    }
    return jobTemplate;
  }

  async update(id: string, updateJobTemplateDto: UpdateJobTemplateDto): Promise<JobTemplate> {
    const existingJobTemplate = await this.jobTemplateModel
      .findByIdAndUpdate(id, updateJobTemplateDto, { new: true })
      .exec();
    
    if (!existingJobTemplate) {
      throw new NotFoundException(`JobTemplate with ID ${id} not found`);
    }
    return existingJobTemplate;
  }

  async remove(id: string): Promise<void> {
    const result = await this.jobTemplateModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`JobTemplate with ID ${id} not found`);
    }
  }

  async findByDepartment(department: string): Promise<JobTemplate[]> {
    return this.jobTemplateModel.find({ department }).exec();
  }
}