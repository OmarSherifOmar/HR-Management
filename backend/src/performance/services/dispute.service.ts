import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppraisalDispute } from '../models/appraisal-dispute.schema';
import { AppraisalRecord } from '../models/appraisal-record.schema';
import { AppraisalRecordStatus, AppraisalDisputeStatus } from '../enums/performance.enums';
import { CreateDisputeDto } from '../dtos/create-dispute.dto';
import { ResolveDisputeDto, DisputeDecision } from '../dtos/resolve-dispute.dto';

const DISPUTE_WINDOW_DAYS = 7;

@Injectable()
export class DisputeService {
  constructor(
    @InjectModel(AppraisalDispute.name) private disputeModel: Model<any>,
    @InjectModel(AppraisalRecord.name) private recordModel: Model<any>,
    @InjectModel('NotificationLog') private notificationModel: Model<any>,
    @InjectModel('EmployeeProfile') private employeeModel: Model<any>,
  ) {}

  async create(dto: CreateDisputeDto) {
    const record = await this.recordModel.findById(dto.appraisalRecordId).lean().exec() as any;
    if (!record) throw new NotFoundException('Appraisal record not found');
    if (record.employeeProfileId?.toString() !== dto.raisedByEmployeeId) throw new ForbiddenException('You can only dispute your own appraisal');
    if (record.status !== AppraisalRecordStatus.HR_PUBLISHED) throw new BadRequestException('Only published appraisals can be disputed');

    const publishedAt = record.hrPublishedAt || record.managerSubmittedAt;
    if (publishedAt) {
      const deadline = new Date(publishedAt.getTime() + DISPUTE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      if (new Date() > deadline) throw new BadRequestException(`Dispute window expired. You had ${DISPUTE_WINDOW_DAYS} days.`);
    }

    const existingDispute = await this.disputeModel.findOne({ appraisalId: new Types.ObjectId(dto.appraisalRecordId) }).lean().exec();
    if (existingDispute) throw new BadRequestException('A dispute already exists for this appraisal');

    const now = new Date();
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

    await this.notificationModel.create({ to: record.managerProfileId, type: 'APPRAISAL_DISPUTE_RAISED', message: `Dispute raised: ${dto.reason}` });

    return { success: true, disputeId: dispute._id.toString(), appraisalId: dto.appraisalRecordId, status: AppraisalDisputeStatus.OPEN, submittedAt: now, message: 'Dispute filed successfully' };
  }

  async resolve(dto: ResolveDisputeDto) {
    const dispute = await this.disputeModel.findById(dto.disputeId).exec();
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

  async findByCycle(cycleId: string) {
    return this.disputeModel.find({ cycleId: new Types.ObjectId(cycleId) }).lean().exec();
  }

  async findById(disputeId: string) {
    const dispute = await this.disputeModel.findById(disputeId).lean().exec();
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }
}
