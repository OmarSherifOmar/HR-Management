import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  ApplicationStatusHistory,
  ApplicationStatusHistoryDocument,
} from './models/application-history.schema';
import { CreateApplicationStatusHistoryDto } from './dtos/create-application-status-history.dto';
import { UpdateApplicationStatusHistoryDto } from './dtos/update-application-status-history.dto';
import { Application, ApplicationDocument } from './models/application.schema';
import { CreateApplicationDto, UpdateApplicationDto } from './dtos/create-application.dto';
import { AssessmentResult, AssessmentResultDocument } from './models/assessment-result.schema';
import { CreateAssessmentResultDto } from './dtos/create-assessment-result.dto';
import { UpdateAssessmentResultDto } from './dtos/update-assessment-result.dto';
import {
  ClearanceChecklist,
  ClearanceChecklistDocument,
} from './models/clearance-checklist.schema';
import { CreateClearanceChecklistDto } from './dtos/create-clearance-checklist.dto';
import { UpdateDepartmentSignoffDto } from './dtos/update-department-signoff.dto';
import { UpdateAssetReturnDto } from './dtos/update-asset-return.dto';
import { ApprovalStatus } from './enums/approval-status.enum';
import { Department } from './enums/department.enum';
import { Contract, ContractDocument } from './models/contract.schema';
import { CreateContractDto } from './dtos/create-contract.dto';
import { UpdateContractDto } from './dtos/update-contract.dto';
import { Document, DocumentDocument } from './models/document.schema';
import { CreateDocumentDto } from './dtos/create-document.dto';
import { UpdateDocumentDto } from './dtos/update-document.dto';
import { Interview, InterviewDocument } from './models/interview.schema';
import { CreateInterviewDto, UpdateInterviewDto } from './dtos/create-interview.dto';
import { JobRequisition, JobRequisitionDocument } from './models/job-requisition.schema';
import { CreateJobRequisitionDto } from './dtos/create-job-requisition.dto';
import { UpdateJobRequisitionDto } from './dtos/update-job-requisition.dto';
import { JobTemplate, JobTemplateDocument } from './models/job-template.schema';
import { CreateJobTemplateDto, UpdateJobTemplateDto } from './dtos/create-job-template.dto';
import {
  OffboardingProcess,
  OffboardingProcessDocument,
} from './models/offboarding-process.schema';
import { CreateOffboardingProcessDto } from './dtos/create-offboarding-process.dto';
import { UpdateOffboardingProcessDto } from './dtos/update-offboarding-process.dto';
import { OffboardingStatus } from './enums/offboarding-status.enum';
import { Offer, OfferDocument } from './models/offer.schema';
import { CreateOfferDto, UpdateOfferDto} from './dtos/create-offer.dto';
import { CreateReferralDto } from './dtos/create-referral.dto';
import { UpdateReferralDto } from './dtos/update-referral.dto';
import { Referral, ReferralDocument } from './models/referral.schema';
import {
  ResignationRequest,
  ResignationRequestDocument,
} from './models/resignation-request.schema';
import { CreateResignationRequestDto } from './dtos/create-resignation-request.dto';
import { UpdateResignationRequestDto } from './dtos/update-resignation-request.dto';
import { ResignationStatus } from './enums/resignation-status.enum';
import {
  TerminationRequest,
  TerminationRequestDocument,
} from './models/termination-request.schema';
import { CreateTerminationRequestDto } from './dtos/create-termination-request.dto';
import { UpdateTerminationRequestDto } from './dtos/update-termination-request.dto';
import { TerminationStatus } from './enums/termination-status.enum';

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

@Injectable()
export class ClearanceChecklistService {
  constructor(
    @InjectModel(ClearanceChecklist.name)
    private readonly checklistModel: Model<ClearanceChecklistDocument>,
    // TODO: Inject AssetManagementService when available
    // private readonly assetManagementService: AssetManagementService,
  ) {}

  /**
   * OFF-006: HR Manager creates offboarding checklist for asset recovery
   */
  async create(
    dto: CreateClearanceChecklistDto,
  ): Promise<ClearanceChecklistDocument> {
    // Initialize department signoffs for all departments
    const departmentSignoffs = Object.values(Department).map((dept) => ({
      department: dept,
      status: ApprovalStatus.PENDING,
    }));

    // TODO: Get assigned assets from AssetManagementService
    // Example implementation when AssetManagementService is ready:
    // const assignedAssets = await this.assetManagementService.getAssignedAssets(
    //   dto.employeeId,
    // );
    // const assets = assignedAssets.map((asset) => ({
    //   assetId: asset.assetId,
    //   name: asset.name,
    //   type: asset.type,
    //   returned: false,
    // }));

    // For now, initialize with empty assets array (ready for integration)
    const assets = [];

    const checklist = new this.checklistModel({
      ...dto,
      departmentSignoffs,
      assets,
      allAssetsReturned: assets.length === 0,
      allSignoffsCompleted: false,
    });

    return checklist.save();
  }

  async findAll(): Promise<ClearanceChecklistDocument[]> {
    return this.checklistModel
      .find()
      .populate('offboardingProcessId')
      .populate('employeeId')
      .exec();
  }

  async findOne(id: string): Promise<ClearanceChecklistDocument> {
    const checklist = await this.checklistModel
      .findById(id)
      .populate('offboardingProcessId')
      .populate('employeeId')
      .exec();

    if (!checklist) {
      throw new NotFoundException(`Clearance checklist with id "${id}" not found`);
    }

    return checklist;
  }

  async findByOffboardingProcess(
    offboardingProcessId: string,
  ): Promise<ClearanceChecklistDocument | null> {
    return this.checklistModel
      .findOne({ offboardingProcessId })
      .populate('offboardingProcessId')
      .populate('employeeId')
      .exec();
  }

  /**
   * OFF-010: HR Manager obtains multi-department exit clearance sign-offs
   */
  async updateDepartmentSignoff(
    id: string,
    dto: UpdateDepartmentSignoffDto,
  ): Promise<ClearanceChecklistDocument> {
    const checklist = await this.checklistModel.findById(id);

    if (!checklist) {
      throw new NotFoundException(`Clearance checklist with id "${id}" not found`);
    }

    // Find and update the department signoff
    const signoffIndex = checklist.departmentSignoffs.findIndex(
      (s) => s.department === dto.department,
    );

    if (signoffIndex === -1) {
      throw new NotFoundException(
        `Department signoff for ${dto.department} not found`,
      );
    }

    checklist.departmentSignoffs[signoffIndex] = {
      ...checklist.departmentSignoffs[signoffIndex],
      status: dto.status,
      comments: dto.comments,
      signedOffBy: dto.signedOffBy as any,
      signedOffAt: new Date(),
    };

    // Check if all signoffs are completed
    const allCompleted = checklist.departmentSignoffs.every(
      (s) => s.status !== ApprovalStatus.PENDING,
    );
    checklist.allSignoffsCompleted = allCompleted;

    if (allCompleted && checklist.allAssetsReturned) {
      checklist.completedAt = new Date();
    }

    return checklist.save();
  }

  /**
   * OFF-006: Mark asset as returned
   */
  async updateAssetReturn(
    id: string,
    dto: UpdateAssetReturnDto,
  ): Promise<ClearanceChecklistDocument> {
    const checklist = await this.checklistModel.findById(id);

    if (!checklist) {
      throw new NotFoundException(`Clearance checklist with id "${id}" not found`);
    }

    // Find and update the asset
    const assetIndex = checklist.assets.findIndex(
      (a) => a.assetId === dto.assetId,
    );

    if (assetIndex === -1) {
      throw new NotFoundException(`Asset with id "${dto.assetId}" not found`);
    }

    checklist.assets[assetIndex].returned = dto.returned;
    checklist.assets[assetIndex].condition = dto.condition;
    checklist.assets[assetIndex].returnedAt = new Date();

    // TODO: Update asset in AssetManagementService
    // Example implementation when AssetManagementService is ready:
    // if (dto.returned) {
    //   await this.assetManagementService.markAssetReturned(
    //     dto.assetId,
    //     checklist.employeeId.toString(),
    //     dto.condition || '',
    //   );
    // }

    // For now, just log the asset return (ready for integration)
    if (dto.returned) {
      console.log(`Asset ${dto.assetId} marked as returned for employee ${checklist.employeeId}`);
    }

    // Check if all assets are returned
    const allReturned = checklist.assets.every((a) => a.returned);
    checklist.allAssetsReturned = allReturned;

    if (allReturned && checklist.allSignoffsCompleted) {
      checklist.completedAt = new Date();
    }

    return checklist.save();
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.checklistModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Clearance checklist with id "${id}" not found`);
    }
  }

  /**
   * Get clearance status summary
   */
  async getClearanceStatus(id: string): Promise<{
    totalSignoffs: number;
    completedSignoffs: number;
    pendingSignoffs: number;
    totalAssets: number;
    returnedAssets: number;
    pendingAssets: number;
    isComplete: boolean;
  }> {
    const checklist = await this.findOne(id);

    const completedSignoffs = checklist.departmentSignoffs.filter(
      (s) => s.status !== ApprovalStatus.PENDING,
    ).length;

    const returnedAssets = checklist.assets.filter((a) => a.returned).length;

    return {
      totalSignoffs: checklist.departmentSignoffs.length,
      completedSignoffs,
      pendingSignoffs: checklist.departmentSignoffs.length - completedSignoffs,
      totalAssets: checklist.assets.length,
      returnedAssets,
      pendingAssets: checklist.assets.length - returnedAssets,
      isComplete: checklist.allAssetsReturned && checklist.allSignoffsCompleted,
    };
  }
}

@Injectable()
export class ContractService {
  constructor(
    @InjectModel(Contract.name)
    private contractModel: Model<ContractDocument>,
  ) {}

  // CREATE
  async create(dto: CreateContractDto): Promise<Contract> {
    try {
      const created = new this.contractModel({
        ...dto,
        offerId: new Types.ObjectId(dto.offerId),
        documentId: dto.documentId ? new Types.ObjectId(dto.documentId) : undefined,
      });

      return await created.save();
    } catch (error) {
      throw new BadRequestException(`Error creating contract: ${error.message}`);
    }
  }

  // GET ALL
  async findAll(): Promise<Contract[]> {
    return this.contractModel
      .find()
      .populate('offerId')
      .populate('documentId')
      .exec();
  }

  // GET ONE
  async findOne(id: string): Promise<Contract> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid contract ID');
    }

    const contract = await this.contractModel
      .findById(id)
      .populate('offerId')
      .populate('documentId')
      .exec();

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }

  // UPDATE
  async update(id: string, dto: UpdateContractDto): Promise<Contract> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid contract ID');
    }

    const updated = await this.contractModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('offerId')
      .populate('documentId')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return updated;
  }

  // DELETE
  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid contract ID');
    }

    const deleted = await this.contractModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return { message: 'Contract deleted successfully' };
  }

  // GET CONTRACT BY OFFER ID
  async findByOffer(offerId: string): Promise<Contract[]> {
    if (!Types.ObjectId.isValid(offerId)) {
      throw new BadRequestException('Invalid offer ID');
    }

    return await this.contractModel
      .find({ offerId: new Types.ObjectId(offerId) })
      .populate('offerId')
      .populate('documentId')
      .exec();
  }
}

@Injectable()
export class DocumentService {
  constructor(
    @InjectModel(Document.name)
    private documentModel: Model<DocumentDocument>,
  ) {}

  // CREATE
  async create(dto: CreateDocumentDto): Promise<Document> {
    try {
      const created = new this.documentModel({
        ...dto,
        ownerId: dto.ownerId ? new Types.ObjectId(dto.ownerId) : undefined,
      });

      return await created.save();
    } catch (error) {
      throw new BadRequestException(`Error creating document: ${error.message}`);
    }
  }

  // GET ALL
  async findAll(): Promise<Document[]> {
    return this.documentModel
      .find()
      .populate('ownerId')
      .exec();
  }

  // GET ONE
  async findOne(id: string): Promise<Document> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const found = await this.documentModel
      .findById(id)
      .populate('ownerId')
      .exec();

    if (!found) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return found;
  }

  // FIND BY OWNER
  async findByOwner(ownerId: string): Promise<Document[]> {
    if (!Types.ObjectId.isValid(ownerId)) {
      throw new BadRequestException('Invalid owner ID');
    }

    return this.documentModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .populate('ownerId')
      .exec();
  }

  // UPDATE
  async update(id: string, dto: UpdateDocumentDto): Promise<Document> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const updated = await this.documentModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('ownerId')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return updated;
  }

  // DELETE
  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const deleted = await this.documentModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return { message: 'Document deleted successfully' };
  }
}

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


@Injectable()
export class OffboardingProcessService {
  constructor(
    @InjectModel(OffboardingProcess.name)
    private readonly offboardingModel: Model<OffboardingProcessDocument>,
    private readonly clearanceService: ClearanceChecklistService,
    // TODO: Inject TimeManagementService when available
    // private readonly timeManagementService: TimeManagementService,
    // TODO: Inject PayrollExecutionService when available
    // private readonly payrollExecutionService: PayrollExecutionService,
  ) {}

  async create(
    dto: CreateOffboardingProcessDto,
  ): Promise<OffboardingProcessDocument> {
    const offboarding = new this.offboardingModel({
      ...dto,
      status: OffboardingStatus.INITIATED,
      accessRevoked: false,
      settlementTriggered: false,
    });

    return offboarding.save();
  }

  async findAll(): Promise<OffboardingProcessDocument[]> {
    return this.offboardingModel
      .find()
      .populate('employeeId')
      .populate('resignationRequestId')
      .populate('terminationRequestId')
      .populate('clearanceChecklistId')
      .populate('initiatedBy')
      .populate('accessRevokedBy')
      .exec();
  }

  async findOne(id: string): Promise<OffboardingProcessDocument> {
    const offboarding = await this.offboardingModel
      .findById(id)
      .populate('employeeId')
      .populate('resignationRequestId')
      .populate('terminationRequestId')
      .populate('clearanceChecklistId')
      .populate('initiatedBy')
      .populate('accessRevokedBy')
      .exec();

    if (!offboarding) {
      throw new NotFoundException(`Offboarding process with id "${id}" not found`);
    }

    return offboarding;
  }

  async findByEmployee(employeeId: string): Promise<OffboardingProcessDocument[]> {
    return this.offboardingModel
      .find({ employeeId })
      .populate('resignationRequestId')
      .populate('terminationRequestId')
      .populate('clearanceChecklistId')
      .populate('initiatedBy')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    id: string,
    dto: UpdateOffboardingProcessDto,
  ): Promise<OffboardingProcessDocument> {
    const updated = await this.offboardingModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('employeeId')
      .populate('resignationRequestId')
      .populate('terminationRequestId')
      .populate('clearanceChecklistId')
      .populate('initiatedBy')
      .populate('accessRevokedBy')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Offboarding process with id "${id}" not found`);
    }

    return updated;
  }

  /**
   * OFF-007: System Admin revokes system and account access upon termination
   * TODO: Integrate with TimeManagementService for actual access revocation
   */
  async revokeAccess(
    id: string,
    revokedBy: string,
  ): Promise<OffboardingProcessDocument> {
    const offboarding = await this.findOne(id);

    if (offboarding.accessRevoked) {
      throw new Error('Access already revoked for this offboarding process');
    }

    // TODO: Call TimeManagementService to revoke system access
    // Example implementation when TimeManagementService is ready:
    // await this.timeManagementService.revokeSystemAccess(
    //   offboarding.employeeId.toString(),
    //   revokedBy,
    // );

    // TODO: Verify access revocation through TimeManagementService
    // Example implementation when TimeManagementService is ready:
    // const verified = await this.timeManagementService.verifyAccessRevocation(
    //   offboarding.employeeId.toString(),
    // );
    // if (!verified) {
    //   throw new Error('Failed to verify access revocation');
    // }

    // For now, mark as revoked (ready for integration)
    console.log(`Access revocation requested for employee ${offboarding.employeeId} by ${revokedBy}`);

    // Update offboarding process
    offboarding.accessRevoked = true;
    offboarding.accessRevokedAt = new Date();
    offboarding.accessRevokedBy = revokedBy as any;
    offboarding.status = OffboardingStatus.ACCESS_REVOKED;

    return offboarding.save();
  }

  /**
   * OFF-013: HR Manager sends offboarding notification to trigger benefits termination and final pay calc
   * TODO: Integrate with PayrollExecutionService for actual settlement processing
   */
  async triggerFinalSettlement(
    id: string,
  ): Promise<OffboardingProcessDocument> {
    const offboarding = await this.findOne(id);

    if (offboarding.settlementTriggered) {
      throw new Error('Settlement already triggered for this offboarding process');
    }

    if (!offboarding.accessRevoked) {
      throw new Error('Access must be revoked before triggering final settlement');
    }

    // TODO: Call PayrollExecutionService to trigger benefits termination
    // Example implementation when PayrollExecutionService is ready:
    // await this.payrollExecutionService.triggerBenefitsTermination(
    //   offboarding.employeeId.toString(),
    //   offboarding.effectiveDate,
    // );

    // TODO: Call PayrollExecutionService to trigger final pay calculation
    // Example implementation when PayrollExecutionService is ready:
    // await this.payrollExecutionService.triggerFinalPayCalculation(
    //   offboarding.employeeId.toString(),
    // );

    // TODO: Call PayrollExecutionService to calculate final settlement
    // Example implementation when PayrollExecutionService is ready:
    // const settlement = await this.payrollExecutionService.calculateFinalSettlement(
    //   offboarding.employeeId.toString(),
    //   offboarding.effectiveDate,
    // );
    // console.log('Final settlement calculated:', settlement);

    // For now, log the trigger (ready for integration)
    console.log(`Final settlement triggered for employee ${offboarding.employeeId} with effective date ${offboarding.effectiveDate}`);

    // Update offboarding process
    offboarding.settlementTriggered = true;
    offboarding.settlementTriggeredAt = new Date();
    offboarding.status = OffboardingStatus.SETTLEMENT_TRIGGERED;

    return offboarding.save();
  }

  /**
   * Complete the offboarding process
   */
  async complete(id: string): Promise<OffboardingProcessDocument> {
    const offboarding = await this.findOne(id);

    // Verify all steps are completed
    if (!offboarding.accessRevoked) {
      throw new Error('Access must be revoked before completing offboarding');
    }

    if (!offboarding.settlementTriggered) {
      throw new Error('Settlement must be triggered before completing offboarding');
    }

    // Check clearance checklist if it exists
    if (offboarding.clearanceChecklistId) {
      const clearance = await this.clearanceService.findOne(
        offboarding.clearanceChecklistId.toString(),
      );

      if (!clearance.allAssetsReturned || !clearance.allSignoffsCompleted) {
        throw new Error('Clearance checklist must be completed before finishing offboarding');
      }
    }

    // Mark as completed
    offboarding.status = OffboardingStatus.COMPLETED;
    offboarding.completedAt = new Date();

    return offboarding.save();
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.offboardingModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Offboarding process with id "${id}" not found`);
    }
  }

  /**
   * Get offboarding process summary
   */
  async getOffboardingSummary(id: string): Promise<{
    process: OffboardingProcessDocument;
    clearanceStatus?: any;
    activeAccounts?: any[];
  }> {
    const process = await this.findOne(id);

    const result: any = { process };

    // Get clearance status if checklist exists
    if (process.clearanceChecklistId) {
      result.clearanceStatus = await this.clearanceService.getClearanceStatus(
        process.clearanceChecklistId.toString(),
      );
    }

    // TODO: Get active accounts from TimeManagementService if access not revoked
    // Example implementation when TimeManagementService is ready:
    // if (!process.accessRevoked) {
    //   result.activeAccounts = await this.timeManagementService.getActiveAccounts(
    //     process.employeeId.toString(),
    //   );
    // }

    return result;
  }
}


@Injectable()
export class OfferService {
  constructor(
    @InjectModel(Offer.name) 
    private offerModel: Model<OfferDocument>,
  ) {}

  // CREATE
  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    try {
      // Check if offer already exists for this application
      const existingOffer = await this.offerModel.findOne({
        applicationId: new Types.ObjectId(createOfferDto.applicationId)
      }).exec();

      if (existingOffer) {
        throw new ConflictException('An offer already exists for this application');
      }

      const createdOffer = new this.offerModel(createOfferDto);
      return await createdOffer.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Error creating offer: ${error.message}`);
    }
  }

  // READ - ALL
  async findAll(): Promise<Offer[]> {
    try {
      return await this.offerModel.find()
        .populate('applicationId')
        .populate('candidateId')
        .populate('hrEmployeeId')
        .populate('approvers.employeeId')
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching offers: ${error.message}`);
    }
  }

  // READ - ONE
  async findOne(id: string): Promise<Offer> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid offer ID format');
    }

    const offer = await this.offerModel.findById(id)
      .populate('applicationId')
      .populate('candidateId')
      .populate('hrEmployeeId')
      .populate('approvers.employeeId')
      .exec();
    
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }
    return offer;
  }

  // UPDATE
  async update(id: string, updateOfferDto: UpdateOfferDto): Promise<Offer> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid offer ID format');
    }

    try {
      const existingOffer = await this.offerModel
        .findByIdAndUpdate(id, updateOfferDto, { new: true, runValidators: true })
        .populate('applicationId')
        .populate('candidateId')
        .populate('hrEmployeeId')
        .populate('approvers.employeeId')
        .exec();
      
      if (!existingOffer) {
        throw new NotFoundException(`Offer with ID ${id} not found`);
      }
      return existingOffer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error updating offer: ${error.message}`);
    }
  }

  // DELETE
  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid offer ID format');
    }

    const result = await this.offerModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }

    return { message: 'Offer deleted successfully' };
  }

  // FIND BY CANDIDATE
  async findByCandidate(candidateId: string): Promise<Offer[]> {
    if (!Types.ObjectId.isValid(candidateId)) {
      throw new BadRequestException('Invalid candidate ID format');
    }

    try {
      return await this.offerModel.find({ 
        candidateId: new Types.ObjectId(candidateId) 
      })
      .populate('applicationId')
      .populate('hrEmployeeId')
      .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching candidate offers: ${error.message}`);
    }
  }

  // FIND BY APPLICATION
  async findByApplication(applicationId: string): Promise<Offer[]> {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestException('Invalid application ID format');
    }

    try {
      return await this.offerModel.find({ 
        applicationId: new Types.ObjectId(applicationId) 
      })
      .populate('candidateId')
      .populate('hrEmployeeId')
      .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching application offers: ${error.message}`);
    }
  }

  // ADD APPROVER
  async addApprover(offerId: string, approverData: any): Promise<Offer> {
    if (!Types.ObjectId.isValid(offerId)) {
      throw new BadRequestException('Invalid offer ID format');
    }

    // Validate approver data
    if (!approverData.employeeId || !Types.ObjectId.isValid(approverData.employeeId)) {
      throw new BadRequestException('Invalid employee ID in approver data');
    }

    if (!approverData.role || !approverData.status) {
      throw new BadRequestException('Approver data must include role and status');
    }

    // Check if approver already exists
    const existingApprover = await this.offerModel.findOne({
      _id: new Types.ObjectId(offerId),
      'approvers.employeeId': new Types.ObjectId(approverData.employeeId)
    }).exec();

    if (existingApprover) {
      throw new ConflictException('This employee is already an approver for this offer');
    }

    // Convert employeeId to ObjectId
    const approverDataWithObjectId = {
      ...approverData,
      employeeId: new Types.ObjectId(approverData.employeeId),
      actionDate: approverData.actionDate || new Date()
    };

    const updatedOffer = await this.offerModel.findByIdAndUpdate(
      offerId,
      { $push: { approvers: approverDataWithObjectId } },
      { new: true }
    )
    .populate('approvers.employeeId')
    .exec();

    if (!updatedOffer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    return updatedOffer;
  }

  // UPDATE APPROVER STATUS
  async updateApproverStatus(
    offerId: string, 
    employeeId: string, 
    status: string, 
    comment?: string
  ): Promise<Offer> {
    if (!Types.ObjectId.isValid(offerId)) {
      throw new BadRequestException('Invalid offer ID format');
    }
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const updateData: any = {
      'approvers.$.status': status,
      'approvers.$.actionDate': new Date()
    };

    if (comment !== undefined) {
      updateData['approvers.$.comment'] = comment;
    }

    const updatedOffer = await this.offerModel.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(offerId), 
        'approvers.employeeId': new Types.ObjectId(employeeId) 
      },
      { $set: updateData },
      { new: true }
    )
    .populate('applicationId')
    .populate('candidateId')
    .populate('hrEmployeeId')
    .populate('approvers.employeeId')
    .exec();

    if (!updatedOffer) {
      throw new NotFoundException(`Offer with ID ${offerId} or approver with ID ${employeeId} not found`);
    }

    return updatedOffer;
  }

  // REMOVE APPROVER
  async removeApprover(offerId: string, employeeId: string): Promise<Offer> {
    if (!Types.ObjectId.isValid(offerId) || !Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid ID format');
    }

    const updatedOffer = await this.offerModel.findByIdAndUpdate(
      offerId,
      { 
        $pull: { 
          approvers: { employeeId: new Types.ObjectId(employeeId) } 
        } 
      },
      { new: true }
    )
    .populate('approvers.employeeId')
    .exec();

    if (!updatedOffer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    return updatedOffer;
  }

  // UPDATE APPLICANT RESPONSE
  async updateApplicantResponse(
    offerId: string, 
    response: string, 
    signedAt?: Date
  ): Promise<Offer> {
    if (!Types.ObjectId.isValid(offerId)) {
      throw new BadRequestException('Invalid offer ID format');
    }

    const updateData: any = {
      applicantResponse: response
    };

    if (signedAt) {
      updateData.candidateSignedAt = signedAt;
    } else if (response === 'accepted') {
      updateData.candidateSignedAt = new Date();
    }

    const updatedOffer = await this.offerModel.findByIdAndUpdate(
      offerId,
      { $set: updateData },
      { new: true }
    )
    .populate('applicationId')
    .populate('candidateId')
    .populate('hrEmployeeId')
    .exec();

    if (!updatedOffer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    return updatedOffer;
  }

  // ADD SIGNATURES
  async addSignature(offerId: string, signatureType: 'hr' | 'manager', signedAt?: Date): Promise<Offer> {
    if (!Types.ObjectId.isValid(offerId)) {
      throw new BadRequestException('Invalid offer ID format');
    }

    const updateField = signatureType === 'hr' ? 'hrSignedAt' : 'managerSignedAt';
    const updateData = {
      [updateField]: signedAt || new Date()
    };

    const updatedOffer = await this.offerModel.findByIdAndUpdate(
      offerId,
      { $set: updateData },
      { new: true }
    ).exec();

    if (!updatedOffer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    return updatedOffer;
  }

  // GET OFFERS BY STATUS
  async findByStatus(status: string): Promise<Offer[]> {
    try {
      return await this.offerModel.find({ finalStatus: status })
        .populate('applicationId')
        .populate('candidateId')
        .populate('hrEmployeeId')
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching offers by status: ${error.message}`);
    }
  }

  // GET PENDING APPROVAL OFFERS
  async findPendingApproval(): Promise<Offer[]> {
    try {
      return await this.offerModel.find({
        'approvers.status': 'pending',
        finalStatus: 'pending'
      })
      .populate('applicationId')
      .populate('candidateId')
      .populate('hrEmployeeId')
      .populate('approvers.employeeId')
      .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching pending approval offers: ${error.message}`);
    }
  }
}

@Injectable()
export class ReferralService {
  constructor(
    @InjectModel(Referral.name)
    private referralModel: Model<ReferralDocument>,
  ) {}

  // CREATE
  async create(dto: CreateReferralDto): Promise<Referral> {
    try {
      const data = new this.referralModel({
        ...dto,
        referringEmployeeId: new Types.ObjectId(dto.referringEmployeeId),
        candidateId: new Types.ObjectId(dto.candidateId),
      });

      return await data.save();
    } catch (error) {
      throw new BadRequestException(`Error creating referral: ${error.message}`);
    }
  }

  // GET ALL
  async findAll(): Promise<Referral[]> {
    return this.referralModel
      .find()
      .populate('referringEmployeeId')
      .populate('candidateId')
      .exec();
  }

  // GET BY ID
  async findOne(id: string): Promise<Referral> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid referral ID');
    }

    const ref = await this.referralModel
      .findById(id)
      .populate('referringEmployeeId')
      .populate('candidateId')
      .exec();

    if (!ref) throw new NotFoundException(`Referral with ID ${id} not found`);

    return ref;
  }

  // UPDATE
  async update(id: string, dto: UpdateReferralDto): Promise<Referral> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid referral ID');
    }

    const updated = await this.referralModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .populate('referringEmployeeId')
      .populate('candidateId')
      .exec();

    if (!updated) throw new NotFoundException(`Referral with ID ${id} not found`);

    return updated;
  }

  // DELETE
  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid referral ID');
    }

    const deleted = await this.referralModel.findByIdAndDelete(id).exec();

    if (!deleted) throw new NotFoundException(`Referral with ID ${id} not found`);

    return { message: 'Referral deleted successfully' };
  }

  // FIND REFERRALS BY EMPLOYEE
  async findByEmployee(employeeId: string) {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID');
    }

    return this.referralModel
      .find({ referringEmployeeId: new Types.ObjectId(employeeId) })
      .populate('candidateId')
      .exec();
  }

  // FIND REFERRALS BY CANDIDATE
  async findByCandidate(candidateId: string) {
    if (!Types.ObjectId.isValid(candidateId)) {
      throw new BadRequestException('Invalid candidate ID');
    }

    return this.referralModel
      .find({ candidateId: new Types.ObjectId(candidateId) })
      .populate('referringEmployeeId')
      .exec();
  }
}

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