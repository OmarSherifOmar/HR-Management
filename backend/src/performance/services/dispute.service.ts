import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppraisalDispute } from '../models/appraisal-dispute.schema';
import { AppraisalRecord } from '../models/appraisal-record.schema';
import { AppraisalAssignment } from '../models/appraisal-assignment.schema';
import { AppraisalCycle } from '../models/appraisal-cycle.schema';
import { AppraisalRecordStatus, AppraisalDisputeStatus } from '../enums/performance.enums';
import { CreateDisputeDto } from '../dtos/create-dispute.dto';
import { ResolveDisputeDto, DisputeDecision } from '../dtos/resolve-dispute.dto';
import { NotificationLog } from '../../time-management/models/notification-log.schema';
import { EmployeeProfile } from '../../employee-profile/models/employee-profile.schema';

const DISPUTE_WINDOW_DAYS = 7;

@Injectable()
export class DisputeService {
  constructor(
    @InjectModel(AppraisalDispute.name) private disputeModel: Model<any>,
    @InjectModel(AppraisalRecord.name) private recordModel: Model<any>,
    @InjectModel(AppraisalCycle.name) private cycleModel: Model<any>,
    @InjectModel(NotificationLog.name) private notificationModel: Model<any>,
    @InjectModel(EmployeeProfile.name) private employeeModel: Model<any>,
    @InjectModel(AppraisalAssignment.name) private assignmentModel: Model<any>,
  ) {}

  // Helper method to enrich a dispute with all related data
  private async enrichDispute(dispute: any) {
    const employee = await this.employeeModel.findById(dispute.raisedByEmployeeId).lean().exec() as any;
    const record = await this.recordModel.findById(dispute.appraisalId).lean().exec() as any;
    const cycle = await this.cycleModel.findById(dispute.cycleId).lean().exec() as any;
    
    return {
      ...dispute,
      id: dispute._id?.toString(),
      employeeId: dispute.raisedByEmployeeId?.toString(),
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
      appraisalRecord: record ? {
        id: record._id?.toString(),
        totalScore: record.totalScore,
        overallRatingLabel: record.overallRatingLabel,
        status: record.status,
        publishedAt: record.hrPublishedAt,
      } : null,
      cycleName: cycle?.name || 'Unknown Cycle',
      cycleId: dispute.cycleId?.toString(),
      createdAt: dispute.submittedAt || dispute.createdAt,
      resolvedAt: dispute.resolvedAt,
    };
  }

  async findAll() {
    console.log('[DisputeService] findAll - fetching all disputes');
    const disputes = await this.disputeModel.find({}).lean().exec() as any[];
    console.log('[DisputeService] findAll - found:', disputes.length);
    
    const enriched = await Promise.all(disputes.map(d => this.enrichDispute(d)));
    return enriched;
  }

  async findByManager(managerId: string) {
    console.log('[DisputeService] findByManager for:', managerId);
    
    // First, get ALL disputes for debugging
    const allDisputes = await this.disputeModel.find({}).lean().exec() as any[];
    console.log('[DisputeService] Total disputes in DB:', allDisputes.length);
    
    // Find all assignments where this person is the manager
    const assignments = await this.assignmentModel.find({
      managerProfileId: new Types.ObjectId(managerId)
    }).lean().exec() as any[];
    
    console.log('[DisputeService] Found assignments for manager:', assignments.length);
    
    if (assignments.length === 0) {
      console.log('[DisputeService] No assignments found, returning all disputes for manager view');
      const enriched = await Promise.all(allDisputes.map(d => this.enrichDispute(d)));
      return enriched;
    }
    
    // Get the employee IDs from these assignments
    const employeeIds = assignments.map(a => a.employeeProfileId);
    console.log('[DisputeService] Employee IDs from assignments:', employeeIds.map(id => id?.toString()));
    
    // Find disputes raised by these employees
    const disputes = await this.disputeModel.find({
      raisedByEmployeeId: { $in: employeeIds }
    }).lean().exec() as any[];
    
    console.log('[DisputeService] Found disputes:', disputes.length);
    
    const enriched = await Promise.all(disputes.map(d => this.enrichDispute(d)));
    return enriched;
  }

  async findByCycle(cycleId: string) {
    const disputes = await this.disputeModel.find({ cycleId: new Types.ObjectId(cycleId) }).lean().exec() as any[];
    const enriched = await Promise.all(disputes.map(d => this.enrichDispute(d)));
    return enriched;
  }

  async findById(disputeId: string) {
    const dispute = await this.disputeModel.findById(disputeId).lean().exec() as any;
    if (!dispute) throw new NotFoundException('Dispute not found');
    return this.enrichDispute(dispute);
  }

  async findByEmployee(employeeId?: string) {
    if (!employeeId) throw new BadRequestException('Employee ID is required');
    const disputes = await this.disputeModel.find({ raisedByEmployeeId: new Types.ObjectId(employeeId) }).lean().exec() as any[];
    const enriched = await Promise.all(disputes.map(d => this.enrichDispute(d)));
    return enriched;
  }

  async create(dto: CreateDisputeDto) {
    console.log('[DisputeService] create called with:', JSON.stringify(dto));
    
    try {
      // Validate that appraisalRecordId is a valid ObjectId
      if (!Types.ObjectId.isValid(dto.appraisalRecordId)) {
        throw new BadRequestException('Invalid appraisal record ID format');
      }
      
      if (!dto.raisedByEmployeeId || !Types.ObjectId.isValid(dto.raisedByEmployeeId)) {
        throw new BadRequestException('Invalid employee ID format');
      }

      const record = await this.recordModel.findById(dto.appraisalRecordId).exec() as any;
      console.log('[DisputeService] Found record:', record ? 'yes' : 'no', 'status:', record?.status);
      
      if (!record) throw new NotFoundException('Appraisal record not found');
      
      // Check if record is published
      if (record.status !== AppraisalRecordStatus.HR_PUBLISHED) {
        throw new BadRequestException(`Only published appraisals can be disputed. Current status: ${record.status}`);
      }

      // Check dispute window
      const publishedAt = record.hrPublishedAt || record.managerSubmittedAt;
      if (publishedAt) {
        const publishDate = new Date(publishedAt);
        const deadline = new Date(publishDate.getTime() + DISPUTE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        if (new Date() > deadline) {
          throw new BadRequestException(`Dispute window expired. You had ${DISPUTE_WINDOW_DAYS} days from ${publishDate.toISOString()}.`);
        }
      }

      // Check if dispute already exists
      const existingDispute = await this.disputeModel.findOne({ 
        appraisalId: new Types.ObjectId(dto.appraisalRecordId) 
      }).lean().exec();
      if (existingDispute) throw new BadRequestException('A dispute already exists for this appraisal');

      // Fetch assignment to ensure it exists and get required data
      const assignment = await this.assignmentModel.findById(record.assignmentId).exec() as any;
      if (!assignment) {
        throw new NotFoundException('Associated assignment not found');
      }

      // Fetch cycle data
      const cycle = await this.cycleModel.findById(record.cycleId).lean().exec() as any;
      if (!cycle) {
        throw new NotFoundException('Associated cycle not found');
      }

      const now = new Date();
      
      console.log('[DisputeService] Creating dispute with data:', {
        appraisalId: dto.appraisalRecordId,
        assignmentId: record.assignmentId?.toString(),
        cycleId: record.cycleId?.toString(),
        raisedByEmployeeId: dto.raisedByEmployeeId,
        reason: dto.reason,
      });

      const dispute = await this.disputeModel.create({
        _id: new Types.ObjectId(),
        appraisalId: new Types.ObjectId(dto.appraisalRecordId),
        assignmentId: record.assignmentId,
        cycleId: record.cycleId,
        raisedByEmployeeId: new Types.ObjectId(dto.raisedByEmployeeId),
        reason: dto.reason,
        details: dto.details,
        submittedAt: now,
        status: AppraisalDisputeStatus.OPEN,
      } as any);
      
      console.log('[DisputeService] Dispute created:', dispute._id?.toString());

      // Send notification to manager
      if (record.managerProfileId) {
        try {
          await this.notificationModel.create({ 
            to: record.managerProfileId, 
            type: 'APPRAISAL_DISPUTE_RAISED', 
            message: `Dispute raised for employee appraisal: ${dto.reason}` 
          });
          console.log('[DisputeService] Notification sent to manager:', record.managerProfileId?.toString());
        } catch (notifError) {
          console.error('[DisputeService] Failed to create notification (non-fatal):', notifError);
        }
      }

      // Send notification to employee
      if (record.employeeProfileId) {
        try {
          await this.notificationModel.create({ 
            to: record.employeeProfileId, 
            type: 'APPRAISAL_DISPUTE_RAISED', 
            message: `A dispute has been filed against your appraisal` 
          });
          console.log('[DisputeService] Notification sent to employee');
        } catch (notifError) {
          console.error('[DisputeService] Failed to create employee notification (non-fatal):', notifError);
        }
      }

      return { 
        success: true, 
        disputeId: dispute._id.toString(), 
        appraisalId: dto.appraisalRecordId, 
        status: AppraisalDisputeStatus.OPEN, 
        submittedAt: now, 
        message: 'Dispute filed successfully' 
      };
    } catch (error) {
      console.error('[DisputeService] Error creating dispute:', error);
      throw error;
    }
  }

  async resolve(dto: ResolveDisputeDto) {
    const dispute = await this.disputeModel.findById(new Types.ObjectId(dto.disputeId)).exec();
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status === AppraisalDisputeStatus.ADJUSTED || dispute.status === AppraisalDisputeStatus.REJECTED) {
      throw new BadRequestException('Dispute already resolved');
    }

    const record = await this.recordModel.findById(dispute.appraisalId).exec();
    if (!record) throw new NotFoundException('Appraisal record not found');

    const previousScore = record.totalScore;
    const previousStatus = dispute.status;
    const now = new Date();
    let ratingChanged = false;
    let profileUpdated = false;

    dispute.resolvedByEmployeeId = new Types.ObjectId(dto.resolvedByEmployeeId);
    dispute.resolvedAt = now;
    dispute.resolutionSummary = dto.resolutionSummary;
    dispute.decision = dto.decision;

    if (dto.decision === DisputeDecision.DENY) {
      dispute.status = AppraisalDisputeStatus.REJECTED;
    } else if (dto.decision === DisputeDecision.APPROVE_CHANGE) {
      dispute.status = AppraisalDisputeStatus.ADJUSTED;
      ratingChanged = true;
      if (dto.newTotalScore !== undefined) record.totalScore = dto.newTotalScore;
      if (dto.newOverallRatingLabel) record.overallRatingLabel = dto.newOverallRatingLabel;
      if (dto.updatedRatings && record.ratings) {
        for (const rating of record.ratings) {
          if (dto.updatedRatings[rating.key] !== undefined) rating.ratingValue = dto.updatedRatings[rating.key];
        }
      }
      await record.save();
      await this.employeeModel.findByIdAndUpdate(record.employeeProfileId, { lastAppraisalScore: record.totalScore, lastAppraisalRatingLabel: record.overallRatingLabel });
      profileUpdated = true;
    }

    await dispute.save();
    await this.notificationModel.create({
      to: record.employeeProfileId,
      type: 'DISPUTE_RESOLVED',
      message: dto.decision === DisputeDecision.DENY ? `Dispute denied: ${dto.resolutionSummary}` : `Dispute approved, rating adjusted: ${dto.resolutionSummary}`,
    });

    return { success: true, disputeId: dto.disputeId, appraisalId: record._id.toString(), decision: dto.decision, previousStatus, newStatus: dispute.status, ratingChanged, previousScore, newScore: ratingChanged ? record.totalScore : undefined, resolvedAt: now, profileUpdated };
  }
}
