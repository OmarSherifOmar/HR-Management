import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument } from '../models/application.schema';
import { CreateApplicationDto, UpdateApplicationDto } from '../dtos/create-application.dto';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application.name) 
    private applicationModel: Model<ApplicationDocument>,
  ) {}

  // CREATE - Submit new application
  async create(createApplicationDto: CreateApplicationDto): Promise<Application> {
    try {
      // Check if application already exists for this candidate and requisition
      const existingApplication = await this.applicationModel.findOne({
        candidateId: new Types.ObjectId(createApplicationDto.candidateId),
        requisitionId: new Types.ObjectId(createApplicationDto.requisitionId)
      }).exec();

      if (existingApplication) {
        throw new ConflictException('Application already exists for this candidate and job requisition');
      }

      const createdApplication = new this.applicationModel(createApplicationDto);
      return await createdApplication.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Error creating application: ${error.message}`);
    }
  }

  // READ - Get all applications
  async findAll(): Promise<Application[]> {
    try {
      return await this.applicationModel.find()
        .populate('candidateId')
        .populate('requisitionId')
        .populate('assignedHr')
        .sort({ createdAt: -1 }) // Latest first
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching applications: ${error.message}`);
    }
  }

  // READ - Get application by ID
  async findOne(id: string): Promise<Application> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid application ID format');
    }

    const application = await this.applicationModel.findById(id)
      .populate('candidateId')
      .populate('requisitionId')
      .populate('assignedHr')
      .exec();
    
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    return application;
  }

  // UPDATE - Update application
  async update(id: string, updateApplicationDto: UpdateApplicationDto): Promise<Application> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid application ID format');
    }

    try {
      const existingApplication = await this.applicationModel
        .findByIdAndUpdate(id, updateApplicationDto, { 
          new: true, 
          runValidators: true 
        })
        .populate('candidateId')
        .populate('requisitionId')
        .populate('assignedHr')
        .exec();
      
      if (!existingApplication) {
        throw new NotFoundException(`Application with ID ${id} not found`);
      }
      return existingApplication;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error updating application: ${error.message}`);
    }
  }

  // DELETE - Remove application
  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid application ID format');
    }

    const result = await this.applicationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return { message: 'Application deleted successfully' };
  }

  // FIND BY CANDIDATE - Get all applications for a candidate
  async findByCandidate(candidateId: string): Promise<Application[]> {
    if (!Types.ObjectId.isValid(candidateId)) {
      throw new BadRequestException('Invalid candidate ID format');
    }

    try {
      return await this.applicationModel.find({ 
        candidateId: new Types.ObjectId(candidateId) 
      })
      .populate('requisitionId')
      .populate('assignedHr')
      .sort({ createdAt: -1 })
      .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching candidate applications: ${error.message}`);
    }
  }

  // FIND BY REQUISITION - Get all applications for a job requisition
  async findByRequisition(requisitionId: string): Promise<Application[]> {
    if (!Types.ObjectId.isValid(requisitionId)) {
      throw new BadRequestException('Invalid requisition ID format');
    }

    try {
      return await this.applicationModel.find({ 
        requisitionId: new Types.ObjectId(requisitionId) 
      })
      .populate('candidateId')
      .populate('assignedHr')
      .sort({ createdAt: -1 })
      .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching requisition applications: ${error.message}`);
    }
  }

  // FIND BY HR - Get all applications assigned to an HR
  async findByHr(hrId: string): Promise<Application[]> {
    if (!Types.ObjectId.isValid(hrId)) {
      throw new BadRequestException('Invalid HR ID format');
    }

    try {
      return await this.applicationModel.find({ 
        assignedHr: new Types.ObjectId(hrId) 
      })
      .populate('candidateId')
      .populate('requisitionId')
      .sort({ createdAt: -1 })
      .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching HR assigned applications: ${error.message}`);
    }
  }

  // UPDATE STAGE - Update application stage
  async updateStage(id: string, stage: string): Promise<Application> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid application ID format');
    }

    // Validate stage
    const validStages = ['screening', 'interview', 'offer', 'hired', 'rejected'];
    if (!validStages.includes(stage)) {
      throw new BadRequestException(`Invalid stage: ${stage}. Must be one of: ${validStages.join(', ')}`);
    }

    const updatedApplication = await this.applicationModel.findByIdAndUpdate(
      id,
      { currentStage: stage },
      { new: true }
    )
    .populate('candidateId')
    .populate('requisitionId')
    .populate('assignedHr')
    .exec();

    if (!updatedApplication) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return updatedApplication;
  }

  // UPDATE STATUS - Update application status
  async updateStatus(id: string, status: string): Promise<Application> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid application ID format');
    }

    // Validate status
    const validStatuses = ['submitted', 'under_review', 'shortlisted', 'interviewing', 'offer_extended', 'hired', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updatedApplication = await this.applicationModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
    .populate('candidateId')
    .populate('requisitionId')
    .populate('assignedHr')
    .exec();

    if (!updatedApplication) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return updatedApplication;
  }

  // ASSIGN HR - Assign HR to application
  async assignHr(id: string, hrId: string): Promise<Application> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid application ID format');
    }
    if (!Types.ObjectId.isValid(hrId)) {
      throw new BadRequestException('Invalid HR ID format');
    }

    const updatedApplication = await this.applicationModel.findByIdAndUpdate(
      id,
      { assignedHr: new Types.ObjectId(hrId) },
      { new: true }
    )
    .populate('candidateId')
    .populate('requisitionId')
    .populate('assignedHr')
    .exec();

    if (!updatedApplication) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return updatedApplication;
  }

  // GET APPLICATIONS BY STATUS
  async findByApplicationStatus(status: string): Promise<Application[]> {
    // Validate status
    const validStatuses = ['submitted', 'under_review', 'shortlisted', 'interviewing', 'offer_extended', 'hired', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    try {
      return await this.applicationModel.find({ status })
        .populate('candidateId')
        .populate('requisitionId')
        .populate('assignedHr')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching applications by status: ${error.message}`);
    }
  }

  // GET APPLICATIONS BY STAGE
  async findByApplicationStage(stage: string): Promise<Application[]> {
    // Validate stage
    const validStages = ['screening', 'interview', 'offer', 'hired', 'rejected'];
    if (!validStages.includes(stage)) {
      throw new BadRequestException(`Invalid stage: ${stage}. Must be one of: ${validStages.join(', ')}`);
    }

    try {
      return await this.applicationModel.find({ currentStage: stage })
        .populate('candidateId')
        .populate('requisitionId')
        .populate('assignedHr')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching applications by stage: ${error.message}`);
    }
  }

  // GET APPLICATION STATISTICS
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byStage: Record<string, number>;
  }> {
    try {
      const total = await this.applicationModel.countDocuments().exec();
      
      const statusCounts = await this.applicationModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      
      const stageCounts = await this.applicationModel.aggregate([
        { $group: { _id: '$currentStage', count: { $sum: 1 } } }
      ]);

      const byStatus: Record<string, number> = {};
      statusCounts.forEach(item => {
        byStatus[item._id] = item.count;
      });

      const byStage: Record<string, number> = {};
      stageCounts.forEach(item => {
        byStage[item._id] = item.count;
      });

      return {
        total,
        byStatus,
        byStage
      };
    } catch (error) {
      throw new BadRequestException(`Error fetching application statistics: ${error.message}`);
    }
  }

  // BULK UPDATE STATUS
  async bulkUpdateStatus(applicationIds: string[], status: string): Promise<{ modifiedCount: number }> {
    // Validate status
    const validStatuses = ['submitted', 'under_review', 'shortlisted', 'interviewing', 'offer_extended', 'hired', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate all IDs
    for (const id of applicationIds) {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Invalid application ID: ${id}`);
      }
    }

    const objectIds = applicationIds.map(id => new Types.ObjectId(id));

    const result = await this.applicationModel.updateMany(
      { _id: { $in: objectIds } },
      { $set: { status } }
    ).exec();

    return { modifiedCount: result.modifiedCount };
  }

  // CHECK IF APPLICATION EXISTS
  async applicationExists(candidateId: string, requisitionId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(candidateId) || !Types.ObjectId.isValid(requisitionId)) {
      return false;
    }

    const existingApplication = await this.applicationModel.findOne({
      candidateId: new Types.ObjectId(candidateId),
      requisitionId: new Types.ObjectId(requisitionId)
    }).exec();

    return !!existingApplication;
  }
}