import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppraisalRecord } from '../models/appraisal-record.schema';
import { AppraisalAssignment } from '../models/appraisal-assignment.schema';
import { AppraisalCycle } from '../models/appraisal-cycle.schema';
import { AppraisalTemplate } from '../models/appraisal-template.schema';
import { AppraisalDispute } from '../models/appraisal-dispute.schema';
import { AppraisalRecordStatus, AppraisalAssignmentStatus, AppraisalDisputeStatus } from '../enums/performance.enums';
import { ViewAppraisalDto } from '../dtos/view-appraisal.dto';
import { AcknowledgeAppraisalDto } from '../dtos/acknowledge-appraisal.dto';
import { GetAppraisalProgressDto } from '../dtos/get-appraisal-progress.dto';
import { SendReminderDto } from '../dtos/send-reminder.dto';
import { NotificationLog } from '../../time-management/models/notification-log.schema';
import { EmployeeProfile } from '../../employee-profile/models/employee-profile.schema';
import { Department } from '../../organization-structure/models/department.schema';

const DISPUTE_WINDOW_DAYS = 7;

@Injectable()
export class AppraisalService {
  constructor(
    @InjectModel(AppraisalRecord.name) private recordModel: Model<any>,
    @InjectModel(AppraisalAssignment.name) private assignmentModel: Model<any>,
    @InjectModel(AppraisalCycle.name) private cycleModel: Model<any>,
    @InjectModel(AppraisalTemplate.name) private templateModel: Model<any>,
    @InjectModel(AppraisalDispute.name) private disputeModel: Model<any>,
    @InjectModel(NotificationLog.name) private notificationModel: Model<any>,
    @InjectModel(EmployeeProfile.name) private employeeModel: Model<any>,
    @InjectModel(Department.name) private departmentModel: Model<any>,
  ) {}

  async view(dto: ViewAppraisalDto) {
    const record = await this.recordModel.findById(dto.appraisalRecordId).lean().exec() as any;
    if (!record) throw new NotFoundException('Appraisal record not found');

    if (record.employeeProfileId?.toString() !== dto.employeeId) {
      throw new ForbiddenException('You can only view your own appraisal');
    }

    if (!record.employeeViewedAt) {
      await this.recordModel.findByIdAndUpdate(dto.appraisalRecordId, { employeeViewedAt: new Date() });
    }

    const cycle = await this.cycleModel.findById(record.cycleId).lean().exec() as any;
    const template = await this.templateModel.findById(record.templateId).lean().exec() as any;
    const manager = await this.employeeModel.findById(record.managerProfileId).lean().exec() as any;

    const publishedAt = record.hrPublishedAt || record.managerSubmittedAt;
    const disputeDeadline = publishedAt ? new Date(publishedAt.getTime() + DISPUTE_WINDOW_DAYS * 24 * 60 * 60 * 1000) : null;
    const existingDispute = await this.disputeModel.findOne({ appraisalId: new Types.ObjectId(dto.appraisalRecordId) }).lean().exec() as any;

    return {
      appraisalId: record._id.toString(),
      cycleId: record.cycleId?.toString(),
      cycleName: cycle?.name || 'Unknown',
      templateName: template?.name || 'Unknown',
      appraisalDate: record.hrPublishedAt || record.managerSubmittedAt,
      managerName: manager ? `${manager.firstName} ${manager.lastName}` : 'Unknown',
      ratings: record.ratings || [],
      totalScore: record.totalScore || 0,
      overallRatingLabel: record.overallRatingLabel || '',
      ratingScaleType: template?.ratingScaleType || '',
      managerSummary: record.managerSummary || '',
      strengths: record.strengths || '',
      improvementAreas: record.improvementAreas || '',
      status: record.status,
      publishedAt: record.hrPublishedAt,
      viewedAt: record.employeeViewedAt,
      acknowledgedAt: record.employeeAcknowledgedAt,
      canRaiseDispute: record.status === AppraisalRecordStatus.HR_PUBLISHED && !existingDispute && disputeDeadline && new Date() < disputeDeadline,
      disputeDeadline,
      existingDisputeId: existingDispute?._id?.toString(),
    };
  }

  async acknowledge(dto: AcknowledgeAppraisalDto) {
    const record = await this.recordModel.findById(dto.appraisalRecordId).exec();
    if (!record) throw new NotFoundException('Appraisal record not found');
    if (record.employeeProfileId?.toString() !== dto.employeeId) throw new ForbiddenException('You can only acknowledge your own appraisal');
    if (record.status !== AppraisalRecordStatus.HR_PUBLISHED) throw new BadRequestException('Only published appraisals can be acknowledged');
    if (record.employeeAcknowledgedAt) throw new BadRequestException('Appraisal already acknowledged');

    const now = new Date();
    record.employeeAcknowledgedAt = now;
    record.employeeAcknowledgementComment = dto.comment;
    await record.save();

    await this.assignmentModel.findByIdAndUpdate(record.assignmentId, { status: AppraisalAssignmentStatus.ACKNOWLEDGED });

    const template = await this.templateModel.findById(record.templateId).lean().exec() as any;
    await this.employeeModel.findByIdAndUpdate(dto.employeeId, {
      lastAppraisalRecordId: record._id,
      lastAppraisalCycleId: record.cycleId,
      lastAppraisalTemplateId: record.templateId,
      lastAppraisalDate: record.hrPublishedAt || now,
      lastAppraisalScore: record.totalScore,
      lastAppraisalRatingLabel: record.overallRatingLabel,
      lastAppraisalScaleType: template?.ratingScaleType,
      lastDevelopmentPlanSummary: record.improvementAreas,
    });

    await this.notificationModel.create({ to: record.managerProfileId, type: 'APPRAISAL_ACKNOWLEDGED', message: 'Employee has acknowledged their appraisal' });

    return { success: true, appraisalId: record._id.toString(), acknowledgedAt: now, message: 'Appraisal acknowledged. Profile updated.', profileUpdated: true };
  }

  async getProgress(dto: GetAppraisalProgressDto) {
    const cycle = await this.cycleModel.findById(dto.cycleId).lean().exec() as any;
    if (!cycle) throw new NotFoundException('Appraisal cycle not found');

    const deptFilter: any = {};
    if (dto.departmentId) {
      deptFilter.departmentId = new Types.ObjectId(dto.departmentId);
    } else if (dto.departmentIds?.length) {
      deptFilter.departmentId = { $in: dto.departmentIds.map(id => new Types.ObjectId(id)) };
    }

    const assignments = await this.assignmentModel.find({
      cycleId: new Types.ObjectId(dto.cycleId),
      ...deptFilter,
    }).lean().exec() as any[];

    const departmentIds = [...new Set(assignments.map(a => a.departmentId?.toString()))].filter(Boolean);
    const departments = await this.departmentModel.find({
      _id: { $in: departmentIds.map(id => new Types.ObjectId(id)) },
    }).lean().exec() as any[];
    const deptMap = new Map(departments.map(d => [d._id.toString(), d]));

    const departmentProgress: any[] = [];
    const deptAssignments = new Map<string, any[]>();

    for (const assignment of assignments) {
      const deptId = assignment.departmentId?.toString();
      if (!deptId) continue;
      if (!deptAssignments.has(deptId)) deptAssignments.set(deptId, []);
      deptAssignments.get(deptId)!.push(assignment);
    }

    for (const [deptId, deptAssigns] of deptAssignments) {
      const dept = deptMap.get(deptId);
      const total = deptAssigns.length;
      departmentProgress.push({
        departmentId: deptId,
        departmentName: dept?.name || 'Unknown',
        totalAssignments: total,
        notStarted: deptAssigns.filter(a => a.status === AppraisalAssignmentStatus.NOT_STARTED).length,
        inProgress: deptAssigns.filter(a => a.status === AppraisalAssignmentStatus.IN_PROGRESS).length,
        submitted: deptAssigns.filter(a => a.status === AppraisalAssignmentStatus.SUBMITTED).length,
        published: deptAssigns.filter(a => a.status === AppraisalAssignmentStatus.PUBLISHED).length,
        acknowledged: deptAssigns.filter(a => a.status === AppraisalAssignmentStatus.ACKNOWLEDGED).length,
        completionPercentage: total > 0 ? Math.round(((deptAssigns.filter(a => a.status === AppraisalAssignmentStatus.PUBLISHED || a.status === AppraisalAssignmentStatus.ACKNOWLEDGED).length) / total) * 100) : 0,
      });
    }

    const now = new Date();
    return {
      cycleId: cycle._id.toString(),
      cycleName: cycle.name,
      cycleStatus: cycle.status,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      totalAssignments: assignments.length,
      pendingCount: assignments.filter(a => a.status !== AppraisalAssignmentStatus.PUBLISHED && a.status !== AppraisalAssignmentStatus.ACKNOWLEDGED).length,
      submittedCount: assignments.filter(a => a.status === AppraisalAssignmentStatus.SUBMITTED).length,
      publishedCount: assignments.filter(a => a.status === AppraisalAssignmentStatus.PUBLISHED).length,
      completionPercentage: assignments.length > 0
        ? Math.round((assignments.filter(a => a.status === AppraisalAssignmentStatus.PUBLISHED || a.status === AppraisalAssignmentStatus.ACKNOWLEDGED).length / assignments.length) * 100)
        : 0,
      departments: departmentProgress.map(dp => ({
        departmentId: dp.departmentId,
        departmentName: dp.departmentName,
        pending: dp.notStarted + dp.inProgress,
        submitted: dp.submitted,
        published: dp.published,
      })),
    };
  }

  async sendReminders(dto: SendReminderDto, actorId?: string) {
    const cycle = await this.cycleModel.findById(dto.cycleId).lean().exec() as any;
    if (!cycle) throw new NotFoundException('Appraisal cycle not found');

    const employeesNotified: string[] = [];
    const failedNotifications: string[] = [];
    const message = dto.customMessage || `Reminder: Appraisal action required for cycle ${cycle.name}`;

    if (dto.departmentIds?.length) {
      for (const deptId of dto.departmentIds) {
        try {
          const dept = await this.departmentModel.findById(deptId).lean().exec() as any;
          if (!dept) {
            failedNotifications.push(`Department ${deptId} not found`);
            continue;
          }

          if (!dept.headPositionId) {
            failedNotifications.push(`Department ${dept.name} has no head position`);
            continue;
          }

          const manager = await this.employeeModel.findOne({
            primaryPositionId: dept.headPositionId,
            status: 'ACTIVE',
          }).lean().exec() as any;

          if (!manager) {
            failedNotifications.push(`No active employee in head position for ${dept.name}`);
            continue;
          }

          await this.notificationModel.create({
            to: manager._id,
            type: `APPRAISAL_${dto.reminderType}`,
            message: `${message} - Department: ${dept.name}`,
          });
          employeesNotified.push(manager._id.toString());
        } catch (err) {
          failedNotifications.push(`Error for department ${deptId}: ${err}`);
        }
      }
    }

    // Query pending assignments for reminders based on type
    const query: any = { cycleId: new Types.ObjectId(dto.cycleId) };

    switch (dto.reminderType) {
      case 'PENDING_ASSIGNMENT':
        query.status = { $in: [AppraisalAssignmentStatus.NOT_STARTED, AppraisalAssignmentStatus.IN_PROGRESS] };
        break;
      case 'OVERDUE_ASSIGNMENT':
        query.status = { $in: [AppraisalAssignmentStatus.NOT_STARTED, AppraisalAssignmentStatus.IN_PROGRESS] };
        break;
      case 'CYCLE_ENDING_SOON':
        query.status = { $ne: AppraisalAssignmentStatus.ACKNOWLEDGED };
        break;
    }

    if (dto.departmentIds?.length) {
      query.departmentId = { $in: dto.departmentIds.map(id => new Types.ObjectId(id)) };
    }

    const assignments = await this.assignmentModel.find(query).lean().exec() as any[];
    const uniqueManagerIds = [...new Set(assignments.map(a => a.managerProfileId?.toString()).filter(Boolean))];

    for (const managerId of uniqueManagerIds) {
      try {
        await this.notificationModel.create({
          to: new Types.ObjectId(managerId),
          type: `APPRAISAL_${dto.reminderType}`,
          message,
        });
        employeesNotified.push(managerId);
      } catch (err) {
        failedNotifications.push(`Error notifying manager ${managerId}: ${err}`);
      }
    }

    return { remindersSent: employeesNotified.length, employeesNotified, failedNotifications, message: `Sent ${employeesNotified.length} reminders` };
  }

  async getMyAppraisals(employeeId?: string) {
    if (!employeeId) throw new BadRequestException('Employee ID is required');

    console.log('[getMyAppraisals] Fetching appraisals for employee:', employeeId);

    const records = await this.recordModel.find({
      employeeProfileId: new Types.ObjectId(employeeId),
    }).populate('cycleId').populate('managerProfileId').lean().exec() as any[];

    console.log('[getMyAppraisals] Found records:', records.length);

    return records.map(record => ({
      _id: record._id.toString(),
      id: record._id.toString(),
      cycleId: record.cycleId?._id?.toString() || record.cycleId?.toString(),
      cycleName: record.cycleId?.name || 'Unknown Cycle',
      managerId: record.managerProfileId?._id?.toString() || record.managerProfileId?.toString(),
      managerName: record.managerProfileId?.firstName ? 
        `${record.managerProfileId.firstName} ${record.managerProfileId.lastName}` : 
        'Unknown Manager',
      templateId: record.templateId?.toString(),
      ratings: record.ratings,
      comments: record.managerSummary,
      developmentNotes: record.improvementAreas,
      publishedAt: record.hrPublishedAt,
      acknowledgedAt: record.employeeAcknowledgedAt,
      status: record.status,
      totalScore: record.totalScore,
      overallRatingLabel: record.overallRatingLabel,
      strengths: record.strengths,
      improvementAreas: record.improvementAreas,
    }));
  }

  async acknowledgeAppraisal(appraisalId: string, employeeId?: string, comment?: string) {
    const record = await this.recordModel.findById(appraisalId).exec() as any;
    if (!record) throw new NotFoundException('Appraisal record not found');

    if (record.employeeProfileId?.toString() !== employeeId) {
      throw new BadRequestException('You are not authorized to acknowledge this appraisal');
    }

    record.employeeAcknowledgedAt = new Date();
    record.employeeViewedAt = new Date();
    if (comment) record.employeeAcknowledgementComment = comment;
    
    await record.save();

    return {
      success: true,
      appraisalId: record._id.toString(),
      acknowledgedAt: record.employeeAcknowledgedAt,
      message: 'Appraisal acknowledged successfully',
    };
  }
}
