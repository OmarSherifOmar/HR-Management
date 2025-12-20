import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppraisalRecord } from './models/appraisal-record.schema';
import { AppraisalAssignment } from './models/appraisal-assignment.schema';
import { AppraisalCycle } from './models/appraisal-cycle.schema';
import { AppraisalTemplate } from './models/appraisal-template.schema';
import { AppraisalDispute } from './models/appraisal-dispute.schema';
import { AppraisalRecordStatus, AppraisalAssignmentStatus, AppraisalDisputeStatus, AppraisalCycleStatus } from './enums/performance.enums';
import { ViewAppraisalDto } from './dtos/view-appraisal.dto';
import { AcknowledgeAppraisalDto } from './dtos/acknowledge-appraisal.dto';
import { GetAppraisalProgressDto } from './dtos/get-appraisal-progress.dto';
import { SendReminderDto } from './dtos/send-reminder.dto';
import { CreateAssignmentDto, BulkAssignmentDto } from './dtos/create-assignment.dto';
import { SubmitAppraisalDto, PublishAppraisalDto, BulkPublishDto, SubmitAndPublishDto } from './dtos/submit-appraisal.dto';
import { CreateCycleDto, UpdateCycleDto } from './dtos/create-cycle.dto';
import { CreateDisputeDto } from './dtos/create-dispute.dto';
import { ResolveDisputeDto, DisputeDecision } from './dtos/resolve-dispute.dto';
import { CreateTemplateDto, UpdateTemplateDto } from './dtos/create-template.dto';
import { NotificationLog } from '../time-management/models/notification-log.schema';
import { EmployeeProfile } from '../employee-profile/models/employee-profile.schema';
import { Department } from '../organization-structure/models/department.schema';
import { Position } from '../organization-structure/models/position.schema';

const DISPUTE_WINDOW_DAYS = 7;

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(AppraisalRecord.name) private recordModel: Model<any>,
    @InjectModel(AppraisalAssignment.name) private assignmentModel: Model<any>,
    @InjectModel(AppraisalCycle.name) private cycleModel: Model<any>,
    @InjectModel(AppraisalTemplate.name) private templateModel: Model<any>,
    @InjectModel(AppraisalDispute.name) private disputeModel: Model<any>,
    @InjectModel(NotificationLog.name) private notificationModel: Model<any>,
    @InjectModel(EmployeeProfile.name) private employeeModel: Model<any>,
    @InjectModel(Department.name) private departmentModel: Model<any>,
    @InjectModel(Position.name) private positionModel: Model<any>,
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

  private toObjectId(fieldName: string, id?: string) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`${fieldName} is not a valid ObjectId`);
    }
    return new Types.ObjectId(id);
  }

  async findAll() {
    console.log('[findAll] Fetching all assignments');
    const assignments = await this.assignmentModel.find({}).lean().exec() as any[];
    console.log('[findAll] Total assignments:', assignments.length);
    
    const enriched = await Promise.all(assignments.map(async (a) => {
      const employee = await this.employeeModel.findById(a.employeeProfileId).lean().exec() as any;
      const manager = await this.employeeModel.findById(a.managerProfileId).lean().exec() as any;
      const template = await this.templateModel.findById(a.templateId).lean().exec() as any;
      const cycle = await this.cycleModel.findById(a.cycleId).lean().exec() as any;
      const record = a.latestAppraisalId 
        ? await this.recordModel.findById(a.latestAppraisalId).lean().exec() as any
        : null;
      
      return {
        ...a,
        _id: a._id?.toString(),
        latestAppraisalId: a.latestAppraisalId?.toString(),
        templateId: a.templateId?.toString(),
        cycleId: a.cycleId?.toString(),
        employeeProfileId: a.employeeProfileId?.toString(),
        managerProfileId: a.managerProfileId?.toString(),
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
        managerName: manager ? `${manager.firstName} ${manager.lastName}` : 'Unknown',
        employeeDetails: {
          employeeId: employee?._id?.toString(),
          firstName: employee?.firstName,
          lastName: employee?.lastName,
          position: employee?.positionTitle,
          department: employee?.departmentName,
        },
        template: {
          templateId: template?._id?.toString(),
          name: template?.name,
          description: template?.description,
          templateType: template?.templateType,
          ratingScale: template?.ratingScale,
          criteria: (template?.criteria || []).map((c: any) => ({
            key: c.key,
            title: c.title,
            description: c.details || c.description || '',
            weight: c.weight || 0,
            required: c.required !== false,
          })),
          instructions: template?.instructions,
        },
        templateName: template?.name || 'Unknown',
        cycleName: cycle?.name || 'Unknown',
        cycleStatus: cycle?.status,
        currentRecord: record ? {
          recordId: record._id?.toString(),
          status: record.status,
          ratings: record.ratings,
          totalScore: record.totalScore,
          managerSummary: record.managerSummary,
        } : null,
      };
    }));

    return enriched;
  }

  async create(dto: CreateAssignmentDto, actorId?: string) {
    const cycle = await this.cycleModel.findById(dto.cycleId).lean().exec() as any;
    if (!cycle) throw new NotFoundException('Cycle not found');

    const template = await this.templateModel.findById(dto.templateId).lean().exec() as any;
    if (!template) throw new NotFoundException('Template not found');

    // Validate IDs
    this.toObjectId('cycleId', dto.cycleId);
    this.toObjectId('templateId', dto.templateId);
    this.toObjectId('employeeProfileId', dto.employeeProfileId);
    this.toObjectId('managerProfileId', dto.managerProfileId);
    this.toObjectId('departmentId', dto.departmentId);
    if (dto.positionId) this.toObjectId('positionId', dto.positionId);

    const existing = await this.assignmentModel.findOne({
      cycleId: new Types.ObjectId(dto.cycleId),
      employeeProfileId: new Types.ObjectId(dto.employeeProfileId),
    }).lean().exec();

    if (existing) throw new BadRequestException('Assignment already exists for this employee in this cycle');

    const toCreate: any = {
      _id: new Types.ObjectId(),
      cycleId: new Types.ObjectId(dto.cycleId),
      templateId: new Types.ObjectId(dto.templateId),
      employeeProfileId: new Types.ObjectId(dto.employeeProfileId),
      managerProfileId: new Types.ObjectId(dto.managerProfileId),
      departmentId: new Types.ObjectId(dto.departmentId),
      positionId: dto.positionId ? new Types.ObjectId(dto.positionId) : undefined,
      status: AppraisalAssignmentStatus.NOT_STARTED,
      assignedAt: new Date(),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : cycle.managerDueDate,
    };

    const created = await this.assignmentModel.create(toCreate);

    await this.notificationModel.create({
      to: new Types.ObjectId(dto.managerProfileId),
      type: 'APPRAISAL_ASSIGNED',
      message: `You have been assigned to evaluate an employee for cycle "${cycle.name}"`,
    } as any);

    return created;
  }

  async bulkAssign(dto: BulkAssignmentDto, actorId?: string) {
    const cycle = await this.cycleModel.findById(dto.cycleId).lean().exec() as any;
    if (!cycle) throw new NotFoundException('Cycle not found');

    // Validate cycle ID
    this.toObjectId('cycleId', dto.cycleId);
    const created: any[] = [];
    const skipped: any[] = [];

    if (dto.departmentIds?.length) {
      for (const d of dto.departmentIds) this.toObjectId('departmentIds[]', d);
      for (const deptId of dto.departmentIds) {
        const dept = await this.departmentModel.findById(deptId).lean().exec() as any;
        if (!dept) { skipped.push({ departmentId: deptId, reason: 'Department not found' }); continue; }

        let templateId = dto.templateId;
        if (!templateId) {
          const ta = cycle.templateAssignments?.find((t: any) =>
            t.departmentIds?.some((d: any) => d.toString() === deptId)
          );
          templateId = ta?.templateId?.toString();
        }
        if (!templateId) { skipped.push({ departmentId: deptId, reason: 'No template assigned' }); continue; }

        let departmentManagerId: any = null;
        if (dept.headPositionId) {
          const headEmployee = await this.employeeModel.findOne({
            primaryPositionId: dept.headPositionId,
            status: 'ACTIVE',
          }).lean().exec() as any;
          if (headEmployee) departmentManagerId = headEmployee._id;
        }

        const positionsInDept = await this.positionModel.find({
          departmentId: new Types.ObjectId(deptId),
        }).lean().exec() as any[];
        const positionIds = positionsInDept.map((p: any) => p._id);

        const employees = await this.employeeModel.find({
          primaryPositionId: { $in: positionIds },
          status: 'ACTIVE',
        }).lean().exec() as any[];

        if (employees.length === 0) {
          skipped.push({ departmentId: deptId, reason: 'No active employees found in department' });
          continue;
        }

        for (const emp of employees) {
          const existing = await this.assignmentModel.findOne({
            cycleId: new Types.ObjectId(dto.cycleId),
            employeeProfileId: emp._id,
          }).lean().exec();

          if (existing) { skipped.push({ employeeId: emp._id.toString(), reason: 'Already assigned' }); continue; }

          const managerId = departmentManagerId || emp.supervisorPositionId;
          if (!managerId) { skipped.push({ employeeId: emp._id.toString(), employeeName: `${emp.firstName} ${emp.lastName}`, reason: 'No manager found' }); continue; }

          if (emp._id.toString() === departmentManagerId?.toString()) {
            skipped.push({ employeeId: emp._id.toString(), employeeName: `${emp.firstName} ${emp.lastName}`, reason: 'Employee is department head - needs different evaluator' });
            continue;
          }

          const assignment = await this.assignmentModel.create({
            _id: new Types.ObjectId(),
            cycleId: new Types.ObjectId(dto.cycleId),
            templateId: new Types.ObjectId(templateId),
            employeeProfileId: emp._id,
            managerProfileId: managerId,
            departmentId: new Types.ObjectId(deptId),
            positionId: emp.primaryPositionId,
            status: AppraisalAssignmentStatus.NOT_STARTED,
            assignedAt: new Date(),
            dueDate: dto.dueDate ? new Date(dto.dueDate) : cycle.managerDueDate,
          } as any);

          created.push(assignment);

          await this.notificationModel.create({
            to: managerId,
            type: 'APPRAISAL_ASSIGNED',
            message: `You have been assigned to evaluate ${emp.firstName} ${emp.lastName} for cycle "${cycle.name}"`,
          } as any);
        }
      }
    }

    if (dto.assignments?.length) {
      for (const a of dto.assignments) {
        this.toObjectId('assignment.employeeProfileId', a.employeeProfileId);
        this.toObjectId('assignment.managerProfileId', a.managerProfileId);
        this.toObjectId('assignment.departmentId', a.departmentId);
        if (a.positionId) this.toObjectId('assignment.positionId', a.positionId);

        const existing = await this.assignmentModel.findOne({
          cycleId: new Types.ObjectId(dto.cycleId),
          employeeProfileId: new Types.ObjectId(a.employeeProfileId),
        }).lean().exec();

        if (existing) { skipped.push({ employeeId: a.employeeProfileId, reason: 'Already assigned' }); continue; }

        const templateId = a.templateId || dto.templateId;
        if (!templateId) { skipped.push({ employeeId: a.employeeProfileId, reason: 'No template' }); continue; }

        const assignment = await this.assignmentModel.create({
          _id: new Types.ObjectId(),
          cycleId: new Types.ObjectId(dto.cycleId),
          templateId: new Types.ObjectId(templateId),
          employeeProfileId: new Types.ObjectId(a.employeeProfileId),
          managerProfileId: new Types.ObjectId(a.managerProfileId),
          departmentId: new Types.ObjectId(a.departmentId),
          positionId: a.positionId ? new Types.ObjectId(a.positionId) : undefined,
          status: AppraisalAssignmentStatus.NOT_STARTED,
          assignedAt: new Date(),
          dueDate: dto.dueDate ? new Date(dto.dueDate) : cycle.managerDueDate,
        } as any);

        created.push(assignment);

        await this.notificationModel.create({
          to: new Types.ObjectId(a.managerProfileId),
          type: 'APPRAISAL_ASSIGNED',
          message: `You have been assigned an appraisal for cycle "${cycle.name}"`,
        } as any);
      }
    }

    return { assignmentsCreated: created.length, skipped, createdAssignments: created };
  }

  async findByManager(managerId: string, cycleId?: string) {
    console.log('[findByManager] Called with managerId:', managerId, 'cycleId:', cycleId);
    
    const query: any = { managerProfileId: new Types.ObjectId(managerId) };
    if (cycleId) query.cycleId = new Types.ObjectId(cycleId);
    
    console.log('[findByManager] Query:', JSON.stringify(query));
    
    const assignments = await this.assignmentModel.find(query).lean().exec() as any[];
    console.log('[findByManager] Found assignments count:', assignments.length);
    
    // Debug: Check all assignments in the collection
    const allAssignments = await this.assignmentModel.find({}).lean().exec() as any[];
    console.log('[findByManager] Total assignments in DB:', allAssignments.length);
    if (allAssignments.length > 0) {
      console.log('[findByManager] Sample assignment managerProfileId:', allAssignments[0].managerProfileId?.toString());
      console.log('[findByManager] Looking for managerId:', managerId);
    }
    
    const enriched = await Promise.all(assignments.map(async (a) => {
      const employee = await this.employeeModel.findById(a.employeeProfileId).lean().exec() as any;
      const template = await this.templateModel.findById(a.templateId).lean().exec() as any;
      const cycle = await this.cycleModel.findById(a.cycleId).lean().exec() as any;
      const record = a.latestAppraisalId 
        ? await this.recordModel.findById(a.latestAppraisalId).lean().exec() as any
        : null;
      
      console.log('[findByManager] Template for assignment:', a._id?.toString(), 'template:', template?.name, 'criteria count:', template?.criteria?.length);
      
      return {
        ...a,
        _id: a._id?.toString(),
        templateId: a.templateId?.toString(), // Ensure templateId is a string
        cycleId: a.cycleId?.toString(),
        employeeProfileId: a.employeeProfileId?.toString(),
        managerProfileId: a.managerProfileId?.toString(),
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
        employeeDetails: {
          employeeId: employee?._id?.toString(),
          firstName: employee?.firstName,
          lastName: employee?.lastName,
          position: employee?.positionTitle,
          department: employee?.departmentName,
          hireDate: employee?.hireDate,
        },
        template: {
          templateId: template?._id?.toString(),
          name: template?.name,
          description: template?.description,
          templateType: template?.templateType,
          ratingScale: template?.ratingScale,
          criteria: (template?.criteria || []).map((c: any) => ({
            key: c.key,
            title: c.title,
            description: c.details || c.description || '',
            weight: c.weight || 0,
            required: c.required !== false,
          })),
          instructions: template?.instructions,
        },
        cycleName: cycle?.name || 'Unknown',
        cycleStatus: cycle?.status,
        cycleStartDate: cycle?.startDate,
        cycleEndDate: cycle?.endDate,
        managerDueDate: cycle?.managerDueDate,
        currentRecord: record ? {
          recordId: record._id?.toString(),
          status: record.status,
          ratings: record.ratings,
          totalScore: record.totalScore,
          managerSummary: record.managerSummary,
        } : null,
      };
    }));

    return enriched;
  }

  async findById(id: string) {
    const assignment = await this.assignmentModel.findById(id).lean().exec() as any;
    if (!assignment) throw new NotFoundException('Assignment not found');

    const employee = await this.employeeModel.findById(assignment.employeeProfileId).lean().exec() as any;
    const template = await this.templateModel.findById(assignment.templateId).lean().exec() as any;
    const cycle = await this.cycleModel.findById(assignment.cycleId).lean().exec() as any;
    const record = assignment.latestAppraisalId 
      ? await this.recordModel.findById(assignment.latestAppraisalId).lean().exec() as any
      : null;

    return {
      ...assignment,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
      employeeDetails: employee,
      template,
      cycleName: cycle?.name || 'Unknown',
      cycleStatus: cycle?.status,
      currentRecord: record,
    };
  }

  async submit(dto: SubmitAppraisalDto) {
    const assignment = await this.assignmentModel.findById(dto.assignmentId).exec();
    if (!assignment) throw new NotFoundException('Assignment not found');

    // Allow HR roles to submit for any assignment, managers only for their own
    // The role check is handled by the controller decorator

    const template = await this.templateModel.findById((assignment as any).templateId).lean().exec() as any;
    if (!template) throw new NotFoundException('Template not found');

    const requiredKeys = (template.criteria || []).filter((c: any) => c.required).map((c: any) => c.key);
    const providedKeys = (dto.ratings || []).map((r: any) => r.key);
    const missing = requiredKeys.filter((k: string) => !providedKeys.includes(k));
    if (missing.length > 0) {
      throw new BadRequestException(`Missing required ratings: ${missing.join(', ')}`);
    }

    let totalScore = 0;
    let totalWeight = 0;
    for (const rating of dto.ratings) {
      const criterion = (template.criteria || []).find((c: any) => c.key === rating.key);
      const weight = criterion?.weight || 0;
      (rating as any).weightedScore = (rating.ratingValue / template.ratingScale.max) * weight;
      totalScore += (rating as any).weightedScore;
      totalWeight += weight;
    }
    if (totalWeight > 0) totalScore = Math.round((totalScore / totalWeight) * 100);

    const scale = template.ratingScale;
    let overallRatingLabel = '';
    if (scale.labels?.length) {
      const idx = Math.min(Math.floor((totalScore / 100) * scale.labels.length), scale.labels.length - 1);
      overallRatingLabel = scale.labels[idx] || '';
    }

    let record = await this.recordModel.findOne({ assignmentId: new Types.ObjectId(dto.assignmentId) }).exec();

    if (!record) {
      record = await this.recordModel.create({
        _id: new Types.ObjectId(),
        assignmentId: (assignment as any)._id,
        cycleId: (assignment as any).cycleId,
        templateId: (assignment as any).templateId,
        employeeProfileId: (assignment as any).employeeProfileId,
        managerProfileId: (assignment as any).managerProfileId,
        ratings: dto.ratings,
        totalScore,
        overallRatingLabel,
        managerSummary: dto.managerSummary,
        strengths: dto.strengths,
        improvementAreas: dto.improvementAreas,
        status: AppraisalRecordStatus.MANAGER_SUBMITTED,
        managerSubmittedAt: new Date(),
      } as any);
    } else {
      (record as any).ratings = dto.ratings;
      (record as any).totalScore = totalScore;
      (record as any).overallRatingLabel = overallRatingLabel;
      (record as any).managerSummary = dto.managerSummary;
      (record as any).strengths = dto.strengths;
      (record as any).improvementAreas = dto.improvementAreas;
      (record as any).status = AppraisalRecordStatus.MANAGER_SUBMITTED;
      (record as any).managerSubmittedAt = new Date();
      await record.save();
    }

    (assignment as any).latestAppraisalId = record._id;
    (assignment as any).status = AppraisalAssignmentStatus.SUBMITTED;
    (assignment as any).submittedAt = new Date();
    await assignment.save();

    // Don't auto-publish - let HR publish separately
    // Record stays in MANAGER_SUBMITTED status until HR publishes

    await this.notificationModel.create({
      to: (assignment as any).employeeProfileId,
      type: 'APPRAISAL_SUBMITTED',
      message: `Your appraisal has been submitted by your manager. Awaiting HR publication.`,
    } as any);

    return { success: true, recordId: (record as any)._id.toString(), totalScore, overallRatingLabel, status: AppraisalRecordStatus.MANAGER_SUBMITTED };
  }

  async publish(dto: PublishAppraisalDto) {
    const record = await this.recordModel.findById(dto.recordId).exec();
    if (!record) throw new NotFoundException('Appraisal record not found');

    if ((record as any).status !== AppraisalRecordStatus.MANAGER_SUBMITTED) {
      throw new BadRequestException('Only submitted appraisals can be published');
    }

    (record as any).status = AppraisalRecordStatus.HR_PUBLISHED;
    (record as any).hrPublishedAt = new Date();
    (record as any).publishedByEmployeeId = new Types.ObjectId(dto.publishedByEmployeeId);
    await record.save();

    const updatedAssignment = await this.assignmentModel.findByIdAndUpdate(
      (record as any).assignmentId,
      {
        status: AppraisalAssignmentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      { new: true }
    ).exec();

    if (!updatedAssignment) {
      throw new NotFoundException('Failed to update assignment');
    }

    await this.notificationModel.create({
      to: (record as any).employeeProfileId,
      type: 'APPRAISAL_PUBLISHED',
      message: 'Your appraisal has been published. Please review and acknowledge.',
    } as any);

    return { success: true, recordId: dto.recordId, status: AppraisalRecordStatus.HR_PUBLISHED, publishedAt: (record as any).hrPublishedAt };
  }

  async bulkPublish(dto: BulkPublishDto) {
    const cycle = await this.cycleModel.findById(dto.cycleId).lean().exec() as any;
    if (!cycle) throw new NotFoundException('Cycle not found');

    const query: any = {
      cycleId: new Types.ObjectId(dto.cycleId),
      status: AppraisalRecordStatus.MANAGER_SUBMITTED,
    };
    if (dto.excludeRecordIds?.length) {
      query._id = { $nin: dto.excludeRecordIds.map((id: string) => new Types.ObjectId(id)) };
    }

    const records = await this.recordModel.find(query).exec();
    const now = new Date();
    const published: string[] = [];

    for (const record of records) {
      if (dto.departmentIds?.length) {
        const assignment = await this.assignmentModel.findById((record as any).assignmentId).lean().exec() as any;
        if (!dto.departmentIds.includes(assignment?.departmentId?.toString())) continue;
      }

      (record as any).status = AppraisalRecordStatus.HR_PUBLISHED;
      (record as any).hrPublishedAt = now;
      (record as any).publishedByEmployeeId = new Types.ObjectId(dto.publishedByEmployeeId);
      await record.save();

      const updatedAssignment = await this.assignmentModel.findByIdAndUpdate(
        (record as any).assignmentId,
        {
          status: AppraisalAssignmentStatus.PUBLISHED,
          publishedAt: now,
        },
        { new: true }
      ).exec();

      if (!updatedAssignment) {
        console.warn(`Warning: Failed to update assignment ${(record as any).assignmentId}`);
      }

      await this.notificationModel.create({
        to: (record as any).employeeProfileId,
        type: 'APPRAISAL_PUBLISHED',
        message: `Your appraisal for cycle "${cycle.name}" has been published`,
      } as any);

      published.push((record as any)._id.toString());
    }

    return { success: true, publishedCount: published.length, publishedIds: published };
  }

  // Manager submits and publishes appraisal in one step
  // Note: Role-based access is handled by the controller decorator
  // HR roles can submit for any assignment, regular managers only for their own
  async submitAndPublish(dto: SubmitAndPublishDto, userRole?: string) {
    const assignment = await this.assignmentModel.findById(dto.assignmentId).exec();
    if (!assignment) throw new NotFoundException('Assignment not found');

    // Use the assignment's manager as the submitter (HR can submit on behalf of assigned manager)
    const submittingManagerId = dto.managerId || (assignment as any).managerProfileId?.toString();

    const template = await this.templateModel.findById((assignment as any).templateId).lean().exec() as any;
    if (!template) throw new NotFoundException('Template not found');

    const requiredKeys = (template.criteria || []).filter((c: any) => c.required).map((c: any) => c.key);
    const providedKeys = (dto.ratings || []).map((r: any) => r.key);
    const missing = requiredKeys.filter((k: string) => !providedKeys.includes(k));
    if (missing.length > 0) {
      throw new BadRequestException(`Missing required ratings: ${missing.join(', ')}`);
    }

    let totalScore = 0;
    let totalWeight = 0;
    for (const rating of dto.ratings) {
      const criterion = (template.criteria || []).find((c: any) => c.key === rating.key);
      const weight = criterion?.weight || 0;
      (rating as any).weightedScore = (rating.ratingValue / template.ratingScale.max) * weight;
      totalScore += (rating as any).weightedScore;
      totalWeight += weight;
    }
    if (totalWeight > 0) totalScore = Math.round((totalScore / totalWeight) * 100);

    const scale = template.ratingScale;
    let overallRatingLabel = '';
    if (scale.labels?.length) {
      const idx = Math.min(Math.floor((totalScore / 100) * scale.labels.length), scale.labels.length - 1);
      overallRatingLabel = scale.labels[idx] || '';
    }

    let record = await this.recordModel.findOne({ assignmentId: new Types.ObjectId(dto.assignmentId) }).exec();
    const now = new Date();
    
    // Use the current user as the publisher
    const publisherId = dto.managerId || (assignment as any).managerProfileId?.toString();

    if (!record) {
      record = await this.recordModel.create({
        _id: new Types.ObjectId(),
        assignmentId: (assignment as any)._id,
        cycleId: (assignment as any).cycleId,
        templateId: (assignment as any).templateId,
        employeeProfileId: (assignment as any).employeeProfileId,
        managerProfileId: (assignment as any).managerProfileId,
        ratings: dto.ratings,
        totalScore,
        overallRatingLabel,
        managerSummary: dto.managerSummary,
        strengths: dto.strengths,
        improvementAreas: dto.improvementAreas,
        status: AppraisalRecordStatus.HR_PUBLISHED, // Directly published
        managerSubmittedAt: now,
        hrPublishedAt: now,
        publishedByEmployeeId: new Types.ObjectId(publisherId),
      } as any);
    } else {
      (record as any).ratings = dto.ratings;
      (record as any).totalScore = totalScore;
      (record as any).overallRatingLabel = overallRatingLabel;
      (record as any).managerSummary = dto.managerSummary;
      (record as any).strengths = dto.strengths;
      (record as any).improvementAreas = dto.improvementAreas;
      (record as any).status = AppraisalRecordStatus.HR_PUBLISHED;
      (record as any).managerSubmittedAt = now;
      (record as any).hrPublishedAt = now;
      (record as any).publishedByEmployeeId = new Types.ObjectId(publisherId);
      await record.save();
    }

    (assignment as any).latestAppraisalId = record._id;
    (assignment as any).status = AppraisalAssignmentStatus.PUBLISHED;
    (assignment as any).submittedAt = now;
    (assignment as any).publishedAt = now;
    await assignment.save();

    // Notify employee that appraisal is published
    await this.notificationModel.create({
      to: (assignment as any).employeeProfileId,
      type: 'APPRAISAL_PUBLISHED',
      message: `Your appraisal has been submitted and published by your manager. Please review and acknowledge.`,
    } as any);

    return { 
      success: true, 
      recordId: (record as any)._id.toString(), 
      totalScore, 
      overallRatingLabel, 
      status: AppraisalRecordStatus.HR_PUBLISHED,
      publishedAt: now 
    };
  }

  // Manager publishes their own submitted appraisal
  async managerPublish(dto: PublishAppraisalDto, managerId: string) {
    const record = await this.recordModel.findById(dto.recordId).exec();
    if (!record) throw new NotFoundException('Appraisal record not found');

    // Verify manager owns this appraisal
    if ((record as any).managerProfileId?.toString() !== managerId) {
      throw new ForbiddenException('You can only publish your own appraisals');
    }

    if ((record as any).status !== AppraisalRecordStatus.MANAGER_SUBMITTED) {
      throw new BadRequestException('Only submitted appraisals can be published');
    }

    const now = new Date();
    (record as any).status = AppraisalRecordStatus.HR_PUBLISHED;
    (record as any).hrPublishedAt = now;
    (record as any).publishedByEmployeeId = new Types.ObjectId(dto.publishedByEmployeeId);
    await record.save();

    const updatedAssignment = await this.assignmentModel.findByIdAndUpdate(
      (record as any).assignmentId,
      {
        status: AppraisalAssignmentStatus.PUBLISHED,
        publishedAt: now,
      },
      { new: true }
    ).exec();

    if (!updatedAssignment) {
      throw new NotFoundException('Failed to update assignment');
    }

    await this.notificationModel.create({
      to: (record as any).employeeProfileId,
      type: 'APPRAISAL_PUBLISHED',
      message: 'Your appraisal has been published by your manager. Please review and acknowledge.',
    } as any);

    return { 
      success: true, 
      recordId: dto.recordId, 
      status: AppraisalRecordStatus.HR_PUBLISHED, 
      publishedAt: now 
    };
  }

  // Employee acknowledges their published appraisal
  async acknowledgeAppraisalFromAssignment(dto: { recordId: string; acknowledgedByEmployeeId?: string; comment?: string }) {
    const record = await this.recordModel.findById(dto.recordId).exec();
    if (!record) throw new NotFoundException('Appraisal record not found');

    if ((record as any).status !== AppraisalRecordStatus.HR_PUBLISHED) {
      throw new BadRequestException('Only published appraisals can be acknowledged');
    }

    (record as any).employeeAcknowledgedAt = new Date();
    (record as any).employeeAcknowledgementComment = dto.comment || '';
    await record.save();

    await this.notificationModel.create({
      to: (record as any).employeeProfileId,
      type: 'APPRAISAL_ACKNOWLEDGED',
      message: 'You have acknowledged your appraisal.',
    } as any);

    return { 
      success: true, 
      recordId: dto.recordId, 
      acknowledgedAt: (record as any).employeeAcknowledgedAt,
      comment: (record as any).employeeAcknowledgementComment 
    };
  }

  // Get employee's appraisals
  async getEmployeeAppraisals(employeeId: string) {
    const records = await this.recordModel
      .find({ employeeProfileId: new Types.ObjectId(employeeId) })
      .populate('assignmentId')
      .populate('cycleId')
      .populate('templateId')
      .populate('managerProfileId')
      .lean()
      .exec() as any[];

    return records.map(record => {
      const cycle = record.cycleId as any;
      return {
        _id: record._id?.toString(),
        cycleId: record.cycleId?._id?.toString(),
        templateId: record.templateId?._id?.toString(),
        assignmentId: record.assignmentId?._id?.toString(),
        employeeProfileId: record.employeeProfileId?.toString(),
        managerProfileId: record.managerProfileId?._id?.toString(),
        ratings: record.ratings || [],
        totalScore: record.totalScore,
        overallRatingLabel: record.overallRatingLabel,
        managerSummary: record.managerSummary,
        strengths: record.strengths,
        improvementAreas: record.improvementAreas,
        status: record.status,
        managerSubmittedAt: record.managerSubmittedAt,
        hrPublishedAt: record.hrPublishedAt,
        employeeViewedAt: record.employeeViewedAt,
        employeeAcknowledgedAt: record.employeeAcknowledgedAt,
        employeeAcknowledgementComment: record.employeeAcknowledgementComment,
        publishedByEmployeeId: record.publishedByEmployeeId?.toString(),
        cycleName: cycle?.name,
        cycleStartDate: cycle?.startDate,
        cycleEndDate: cycle?.endDate,
      };
    });
  }

  async archiveRecord(recordId: string) {
    console.log('[archiveRecord] Archiving record:', recordId);
    
    const record = await this.recordModel.findById(new Types.ObjectId(recordId)).exec();
    if (!record) throw new NotFoundException('Appraisal record not found');

    // Check that the associated cycle is CLOSED
    const cycle = await this.cycleModel.findById(record.cycleId).exec();
    if (!cycle) throw new NotFoundException('Associated cycle not found');
    if (cycle.status !== 'CLOSED') throw new BadRequestException('Can only archive records from CLOSED cycles');
    
    if (record.status === 'ARCHIVED') throw new BadRequestException('Record already archived');

    record.status = 'ARCHIVED';
    record.archivedAt = new Date();
    await record.save();
    
    console.log('[archiveRecord] Record archived successfully');
    return { success: true, recordId, status: 'ARCHIVED', archivedAt: record.archivedAt };
  }

  async archiveCycleAndAssignments(cycleId: string) {
    console.log('[archiveCycleAndAssignments] Archiving cycle and assignments:', cycleId);
    
    const cycle = await this.cycleModel.findById(new Types.ObjectId(cycleId)).exec();
    if (!cycle) throw new NotFoundException('Appraisal cycle not found');
    
    // Only allow archiving if cycle is CLOSED
    if (cycle.status !== 'CLOSED') throw new BadRequestException('Can only archive CLOSED cycles');
    if (cycle.archivedAt) throw new BadRequestException('Cycle already archived');

    const now = new Date();
    
    // Archive all assignments for this cycle
    const assignmentResult = await this.assignmentModel.updateMany(
      { cycleId: new Types.ObjectId(cycleId), archivedAt: { $exists: false } },
      { $set: { archivedAt: now } }
    ).exec();

    // Archive all records for this cycle
    const recordResult = await this.recordModel.updateMany(
      { cycleId: new Types.ObjectId(cycleId), status: { $ne: 'ARCHIVED' } },
      { $set: { status: 'ARCHIVED', archivedAt: now } }
    ).exec();

    // Archive the cycle itself
    cycle.status = 'ARCHIVED';
    cycle.archivedAt = now;
    await cycle.save();

    console.log('[archiveCycleAndAssignments] Archived:', {
      assignments: assignmentResult.modifiedCount,
      records: recordResult.modifiedCount,
      cycle: cycleId
    });

    return {
      success: true,
      cycleId,
      archivedAssignments: assignmentResult.modifiedCount,
      archivedRecords: recordResult.modifiedCount,
      archivedAt: now,
    };
  }

  async getDepartmentAppraisalProgress(departmentId: string) {
    console.log('[getDepartmentAppraisalProgress] departmentId:', departmentId);

    const department = await this.departmentModel.findById(new Types.ObjectId(departmentId)).lean().exec() as any;
    if (!department) throw new NotFoundException('Department not found');

    // Get all assignments for this department (all cycles)
    const assignments = await this.assignmentModel
      .find({
        departmentId: new Types.ObjectId(departmentId),
      })
      .lean()
      .exec() as any[];

    console.log(`[getDepartmentAppraisalProgress] Found ${assignments.length} assignments`);

    // Count assignments by status
    const statusCounts = {
      [AppraisalAssignmentStatus.NOT_STARTED]: 0,
      [AppraisalAssignmentStatus.IN_PROGRESS]: 0,
      [AppraisalAssignmentStatus.SUBMITTED]: 0,
      [AppraisalAssignmentStatus.PUBLISHED]: 0,
      [AppraisalAssignmentStatus.ACKNOWLEDGED]: 0,
    };

    const assignmentsByStatus: any = {
      [AppraisalAssignmentStatus.NOT_STARTED]: [],
      [AppraisalAssignmentStatus.IN_PROGRESS]: [],
      [AppraisalAssignmentStatus.SUBMITTED]: [],
      [AppraisalAssignmentStatus.PUBLISHED]: [],
      [AppraisalAssignmentStatus.ACKNOWLEDGED]: [],
    };

    // Enrich assignments with employee and manager details
    for (const assignment of assignments) {
      const status = assignment.status || AppraisalAssignmentStatus.NOT_STARTED;
      statusCounts[status]++;

      const employee = await this.employeeModel.findById(assignment.employeeProfileId).lean().exec() as any;
      const manager = await this.employeeModel.findById(assignment.managerProfileId).lean().exec() as any;
      const position = assignment.positionId ? await this.positionModel.findById(assignment.positionId).lean().exec() as any : null;

      assignmentsByStatus[status].push({
        assignmentId: assignment._id,
        employeeId: assignment.employeeProfileId,
        employeeName: employee?.firstName ? `${employee.firstName} ${employee.lastName || ''}` : 'Unknown',
        managerId: assignment.managerProfileId,
        managerName: manager?.firstName ? `${manager.firstName} ${manager.lastName || ''}` : 'Unknown',
        position: position?.name || 'N/A',
        dueDate: assignment.dueDate,
        assignedAt: assignment.assignedAt,
        submittedAt: assignment.submittedAt,
        publishedAt: assignment.publishedAt,
      });
    }

    const total = assignments.length;
    const completed = statusCounts[AppraisalAssignmentStatus.PUBLISHED] + statusCounts[AppraisalAssignmentStatus.ACKNOWLEDGED];
    const inProgress = statusCounts[AppraisalAssignmentStatus.IN_PROGRESS] + statusCounts[AppraisalAssignmentStatus.SUBMITTED];
    const pending = statusCounts[AppraisalAssignmentStatus.NOT_STARTED];

    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      departmentId,
      departmentInfo: {
        name: department.name,
      },
      summary: {
        total,
        completed,
        inProgress,
        pending,
        completionPercentage,
      },
      statusBreakdown: {
        [AppraisalAssignmentStatus.NOT_STARTED]: statusCounts[AppraisalAssignmentStatus.NOT_STARTED],
        [AppraisalAssignmentStatus.IN_PROGRESS]: statusCounts[AppraisalAssignmentStatus.IN_PROGRESS],
        [AppraisalAssignmentStatus.SUBMITTED]: statusCounts[AppraisalAssignmentStatus.SUBMITTED],
        [AppraisalAssignmentStatus.PUBLISHED]: statusCounts[AppraisalAssignmentStatus.PUBLISHED],
        [AppraisalAssignmentStatus.ACKNOWLEDGED]: statusCounts[AppraisalAssignmentStatus.ACKNOWLEDGED],
      },
      assignmentsByStatus,
    };
  }

  async sendReminder(cycleId: string, reminderType: string, departmentIds: string[], customMessage?: string) {
    console.log('[sendReminder] cycleId:', cycleId, 'reminderType:', reminderType, 'departmentIds:', departmentIds);

    const cycle = await this.cycleModel.findById(new Types.ObjectId(cycleId)).lean().exec() as any;
    if (!cycle) throw new NotFoundException('Cycle not found');

    // First, check all assignments in this cycle for debugging
    const allAssignmentsInCycle = await this.assignmentModel.find({ cycleId: new Types.ObjectId(cycleId) }).lean().exec();
    console.log(`[sendReminder] Total assignments in cycle: ${allAssignmentsInCycle.length}`);
    if (allAssignmentsInCycle.length > 0) {
      console.log('[sendReminder] Assignment statuses:', allAssignmentsInCycle.map((a: any) => a.status));
      console.log('[sendReminder] Assignment departments:', allAssignmentsInCycle.map((a: any) => a.departmentId?.toString()));
    }

    // Build query for assignments that are not yet published
    const query: any = {
      cycleId: new Types.ObjectId(cycleId),
      status: { $nin: [AppraisalAssignmentStatus.PUBLISHED, AppraisalAssignmentStatus.ACKNOWLEDGED] },
    };

    // If departmentIds provided and not empty, filter by departments
    if (departmentIds && departmentIds.length > 0) {
      const depIds = departmentIds.map(id => new Types.ObjectId(id));
      query.departmentId = { $in: depIds };
    }

    console.log('[sendReminder] Query:', JSON.stringify(query));

    // Find all managers with assignments in these departments for this cycle
    const pendingAssignments = await this.assignmentModel
      .find(query)
      .lean()
      .exec() as any[];

    console.log(`[sendReminder] Found ${pendingAssignments.length} pending assignments`);
    if (pendingAssignments.length > 0) {
      console.log('[sendReminder] Sample assignment:', pendingAssignments[0]);
    }

    // Get unique manager IDs
    const managerIds = [...new Set(pendingAssignments.map(a => a.managerProfileId?.toString()))].filter(Boolean);

    console.log(`[sendReminder] Found ${managerIds.length} unique managers to notify`);

    let remindersCount = 0;
    const remindedManagers: any[] = [];

    // Build notification message
    let notificationMessage = '';
    switch (reminderType) {
      case 'CYCLE_ENDING_SOON':
        notificationMessage = `Reminder: Appraisal cycle "${cycle.name}" ends on ${new Date(cycle.endDate).toLocaleDateString()}. ${customMessage || 'Please complete all pending appraisals.'}`;
        break;
      case 'PENDING_ASSIGNMENT':
        notificationMessage = `You have pending appraisal assignments in cycle "${cycle.name}". ${customMessage || 'Please submit them as soon as possible.'}`;
        break;
      case 'OVERDUE_ASSIGNMENT':
        notificationMessage = `Your appraisal assignments in cycle "${cycle.name}" are overdue. ${customMessage || 'Please complete them immediately.'}`;
        break;
      default:
        notificationMessage = `Reminder for appraisal cycle "${cycle.name}". ${customMessage || ''}`;
    }

    // Send notifications to each manager
    for (const managerId of managerIds) {
      try {
        console.log(`[sendReminder] Creating notification for manager ${managerId}`);
        const notification = await this.notificationModel.create({
          to: new Types.ObjectId(managerId),
          type: 'APPRAISAL_REMINDER',
          message: notificationMessage,
        });
        console.log(`[sendReminder] Notification created:`, notification);
        remindersCount++;

        const manager = await this.employeeModel.findById(managerId).lean().exec() as any;
        remindedManagers.push({
          managerId,
          managerName: manager?.firstName ? `${manager.firstName} ${manager.lastName || ''}` : 'Unknown',
          pendingAssignments: pendingAssignments.filter(a => a.managerProfileId?.toString() === managerId).length,
        });
      } catch (error) {
        console.error(`[sendReminder] Failed to send reminder to manager ${managerId}:`, error);
      }
    }

    return {
      success: true,
      cycleId,
      reminderType,
      departmentIds,
      message: notificationMessage,
      remindersCount,
      remindedManagers,
      totalPendingAssignments: pendingAssignments.length,
    };
  }

  private validateObjectIds(fieldName: string, ids?: string[]) {
    if (!ids || ids.length === 0) return [];
    const invalid = ids.filter(id => !Types.ObjectId.isValid(id));
    if (invalid.length) {
      throw new BadRequestException(`${fieldName} contains invalid ObjectIds: ${invalid.join(', ')}`);
    }
    return ids.map(id => new Types.ObjectId(id));
  }

  async createCycle(dto: CreateCycleDto, actorId?: string) {
    const existing = await this.cycleModel.findOne({ name: dto.name }).lean().exec() as any;
    if (existing) throw new BadRequestException('Cycle with this name already exists');

    const templateAssignments = (dto.templateAssignments || []).map((ta: any) => ({
      templateId: !ta.templateId || !Types.ObjectId.isValid(ta.templateId) ? undefined : new Types.ObjectId(ta.templateId),
      departmentIds: this.validateObjectIds('templateAssignments.departmentIds', ta.departmentIds),
    }));

    const toCreate: any = {
      _id: new Types.ObjectId(),
      name: dto.name,
      description: dto.description,
      cycleType: dto.cycleType,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      managerDueDate: dto.managerDueDate ? new Date(dto.managerDueDate) : undefined,
      employeeAcknowledgementDueDate: dto.employeeAcknowledgementDueDate ? new Date(dto.employeeAcknowledgementDueDate) : undefined,
      templateAssignments,
      status: AppraisalCycleStatus.PLANNED,
    };

    const created = await this.cycleModel.create(toCreate);

    if (actorId) {
      await this.notificationModel.create({
        to: new Types.ObjectId(actorId),
        type: 'CYCLE_CREATED',
        message: `Appraisal cycle "${dto.name}" created (${dto.startDate} - ${dto.endDate})`,
      } as any);
    }

    return created;
  }

  async findAllCycles(filters: any = {}) {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.cycleType) query.cycleType = filters.cycleType;
    return this.cycleModel.find(query).sort({ startDate: -1 }).lean().exec();
  }

  async findCycleById(id: string) {
    const cycle = await this.cycleModel.findById(id).lean().exec();
    if (!cycle) throw new NotFoundException('Cycle not found');
    return cycle;
  }

  async updateCycle(id: string, dto: UpdateCycleDto, actorId?: string) {
    const before = await this.cycleModel.findById(id).lean().exec() as any;
    if (!before) throw new NotFoundException('Cycle not found');

    if (before.status === AppraisalCycleStatus.CLOSED || before.status === AppraisalCycleStatus.ARCHIVED) {
      throw new BadRequestException('Cannot update closed/archived cycles');
    }

    const updateData: any = { ...dto };
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);
    if (dto.managerDueDate) updateData.managerDueDate = new Date(dto.managerDueDate);
    if (dto.employeeAcknowledgementDueDate) updateData.employeeAcknowledgementDueDate = new Date(dto.employeeAcknowledgementDueDate);
    if (dto.templateAssignments) {
      updateData.templateAssignments = dto.templateAssignments.map((ta: any) => ({
        templateId: !ta.templateId || !Types.ObjectId.isValid(ta.templateId) ? undefined : new Types.ObjectId(ta.templateId),
        departmentIds: this.validateObjectIds('templateAssignments.departmentIds', ta.departmentIds),
      }));
    }

    const updated = await this.cycleModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

    if (actorId) {
      await this.notificationModel.create({
        to: new Types.ObjectId(actorId),
        type: 'CYCLE_UPDATED',
        message: `Appraisal cycle "${before.name}" updated`,
      } as any);
    }

    return updated;
  }

  async activateCycle(id: string, actorId?: string) {
    const cycle = await this.cycleModel.findById(id).exec();
    if (!cycle) throw new NotFoundException('Cycle not found');

    if ((cycle as any).status !== AppraisalCycleStatus.PLANNED) {
      throw new BadRequestException('Only PLANNED cycles can be activated');
    }

    (cycle as any).status = AppraisalCycleStatus.ACTIVE;
    await cycle.save();

    // Notify all assigned managers (BR 11)
    const assignments = await this.assignmentModel.find({ cycleId: new Types.ObjectId(id) }).lean().exec() as any[];
    const managerIds = [...new Set(assignments.map(a => a.managerProfileId?.toString()))];

    for (const managerId of managerIds) {
      await this.notificationModel.create({
        to: new Types.ObjectId(managerId),
        type: 'CYCLE_ACTIVATED',
        message: `Appraisal cycle "${(cycle as any).name}" is now active. Please complete assigned appraisals.`,
      } as any);
    }

    return cycle;
  }

  async closeCycle(id: string, actorId?: string) {
    const cycle = await this.cycleModel.findById(id).exec();
    if (!cycle) throw new NotFoundException('Cycle not found');

    if ((cycle as any).status !== AppraisalCycleStatus.ACTIVE) {
      throw new BadRequestException('Only ACTIVE cycles can be closed');
    }

    (cycle as any).status = AppraisalCycleStatus.CLOSED;
    (cycle as any).closedAt = new Date();
    await cycle.save();

    // AUTO-ARCHIVE: Automatically archive all appraisal records when cycle is closed
    const now = new Date();
    const archivedRecordsResult = await this.recordModel.updateMany(
      { 
        cycleId: new Types.ObjectId(id),
        status: { $ne: AppraisalRecordStatus.ARCHIVED } // Don't re-archive already archived records
      },
      { 
        $set: { 
          status: AppraisalRecordStatus.ARCHIVED,
          archivedAt: now 
        } 
      }
    ).exec();

    console.log(`[PerformanceService.closeCycle] Auto-archived ${archivedRecordsResult.modifiedCount} appraisal records for cycle ${id}`);

    if (actorId) {
      await this.notificationModel.create({
        to: new Types.ObjectId(actorId),
        type: 'CYCLE_CLOSED',
        message: `Appraisal cycle "${(cycle as any).name}" has been closed and all ${archivedRecordsResult.modifiedCount} appraisal records have been auto-archived`,
      } as any);
    }

    return cycle;
  }

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

  async findAllDisputes() {
    console.log('[PerformanceService] findAllDisputes - fetching all disputes');
    const disputes = await this.disputeModel.find({}).lean().exec() as any[];
    console.log('[PerformanceService] findAllDisputes - found:', disputes.length);
    
    const enriched = await Promise.all(disputes.map(d => this.enrichDispute(d)));
    return enriched;
  }

  async findDisputesByManager(managerId: string) {
    console.log('[PerformanceService] findDisputesByManager for:', managerId);
    
    // First, get ALL disputes for debugging
    const allDisputes = await this.disputeModel.find({}).lean().exec() as any[];
    console.log('[PerformanceService] Total disputes in DB:', allDisputes.length);
    
    // Find all assignments where this person is the manager
    const assignments = await this.assignmentModel.find({
      managerProfileId: new Types.ObjectId(managerId)
    }).lean().exec() as any[];
    
    console.log('[PerformanceService] Found assignments for manager:', assignments.length);
    
    if (assignments.length === 0) {
      console.log('[PerformanceService] No assignments found, returning all disputes for manager view');
      const enriched = await Promise.all(allDisputes.map(d => this.enrichDispute(d)));
      return enriched;
    }
    
    // Get the employee IDs from these assignments
    const employeeIds = assignments.map(a => a.employeeProfileId);
    console.log('[PerformanceService] Employee IDs from assignments:', employeeIds.map(id => id?.toString()));
    
    // Find disputes raised by these employees
    const disputes = await this.disputeModel.find({
      raisedByEmployeeId: { $in: employeeIds }
    }).lean().exec() as any[];
    
    console.log('[PerformanceService] Found disputes:', disputes.length);
    
    const enriched = await Promise.all(disputes.map(d => this.enrichDispute(d)));
    return enriched;
  }

  async findDisputesByCycle(cycleId: string) {
    const disputes = await this.disputeModel.find({ cycleId: new Types.ObjectId(cycleId) }).lean().exec() as any[];
    const enriched = await Promise.all(disputes.map(d => this.enrichDispute(d)));
    return enriched;
  }

  async findDisputeById(disputeId: string) {
    const dispute = await this.disputeModel.findById(disputeId).lean().exec() as any;
    if (!dispute) throw new NotFoundException('Dispute not found');
    return this.enrichDispute(dispute);
  }

  async findDisputesByEmployee(employeeId?: string) {
    if (!employeeId) throw new BadRequestException('Employee ID is required');
    const disputes = await this.disputeModel.find({ raisedByEmployeeId: new Types.ObjectId(employeeId) }).lean().exec() as any[];
    const enriched = await Promise.all(disputes.map(d => this.enrichDispute(d)));
    return enriched;
  }

  async createDispute(dto: CreateDisputeDto) {
    console.log('[PerformanceService] createDispute called with:', JSON.stringify(dto));
    
    try {
      // Validate that appraisalRecordId is a valid ObjectId
      if (!Types.ObjectId.isValid(dto.appraisalRecordId)) {
        throw new BadRequestException('Invalid appraisal record ID format');
      }
      
      if (!dto.raisedByEmployeeId || !Types.ObjectId.isValid(dto.raisedByEmployeeId)) {
        throw new BadRequestException('Invalid employee ID format');
      }

      const record = await this.recordModel.findById(dto.appraisalRecordId).exec() as any;
      console.log('[PerformanceService] Found record:', record ? 'yes' : 'no', 'status:', record?.status);
      
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
      
      console.log('[PerformanceService] Creating dispute with data:', {
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
      
      console.log('[PerformanceService] Dispute created:', dispute._id?.toString());

      // Send notification to manager
      if (record.managerProfileId) {
        try {
          await this.notificationModel.create({ 
            to: record.managerProfileId, 
            type: 'APPRAISAL_DISPUTE_RAISED', 
            message: `Dispute raised for employee appraisal: ${dto.reason}` 
          });
          console.log('[PerformanceService] Notification sent to manager:', record.managerProfileId?.toString());
        } catch (notifError) {
          console.error('[PerformanceService] Failed to create notification (non-fatal):', notifError);
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
          console.log('[PerformanceService] Notification sent to employee');
        } catch (notifError) {
          console.error('[PerformanceService] Failed to create employee notification (non-fatal):', notifError);
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
      console.error('[PerformanceService] Error creating dispute:', error);
      throw error;
    }
  }

  async resolveDispute(dto: ResolveDisputeDto) {
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

  

  async bulkArchive(cycleId: string) {
    const cycle = await this.cycleModel.findById(cycleId).lean().exec() as any;
    if (!cycle) throw new NotFoundException('Cycle not found');
    if (cycle.status !== AppraisalCycleStatus.CLOSED) throw new BadRequestException('Only closed cycles can have appraisals archived');

    const now = new Date();
    const result = await this.recordModel.updateMany(
      { cycleId: new Types.ObjectId(cycleId), status: AppraisalRecordStatus.HR_PUBLISHED },
      { $set: { status: AppraisalRecordStatus.ARCHIVED, archivedAt: now } },
    );

    await this.cycleModel.findByIdAndUpdate(cycleId, { status: AppraisalCycleStatus.ARCHIVED, archivedAt: now });

    return { success: true, cycleId, archivedCount: result.modifiedCount, cycleArchived: true, archivedAt: now };
  }

  async getHistory(employeeId: string) {
    const records = await this.recordModel
      .find({ employeeProfileId: new Types.ObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec() as any[];

    const cycleIds = [...new Set(records.map(r => r.cycleId?.toString()))].filter(Boolean);
    const cycles = await this.cycleModel.find({ _id: { $in: cycleIds.map(id => new Types.ObjectId(id)) } }).lean().exec() as any[];
    const cycleMap = new Map(cycles.map(c => [c._id.toString(), c]));

    const trendData = records
      .filter(r => r.totalScore !== undefined && r.totalScore !== null)
      .map(r => {
        const cycle = cycleMap.get(r.cycleId?.toString());
        return {
          cycleId: r.cycleId?.toString(),
          cycleName: cycle?.name || 'Unknown',
          cycleType: cycle?.cycleType,
          date: r.hrPublishedAt || r.managerSubmittedAt || r.createdAt,
          score: r.totalScore,
          ratingLabel: r.overallRatingLabel,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const scores = trendData.map(t => t.score);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const trend = scores.length >= 2 ? (scores[scores.length - 1] - scores[0]) : 0;
    const trendDirection = trend > 0 ? 'IMPROVING' : trend < 0 ? 'DECLINING' : 'STABLE';

    return {
      employeeId,
      totalAppraisals: records.length,
      history: records.map(r => ({
        ...r,
        cycleName: cycleMap.get(r.cycleId?.toString())?.name || 'Unknown',
      })),
      trendAnalysis: {
        dataPoints: trendData,
        averageScore: Math.round(avgScore * 100) / 100,
        highestScore: scores.length > 0 ? Math.max(...scores) : null,
        lowestScore: scores.length > 0 ? Math.min(...scores) : null,
        scoreDelta: Math.round(trend * 100) / 100,
        trendDirection,
        cyclesAnalyzed: trendData.length,
      },
    };
  }

  async generateOutcomeReport(cycleId: string) {
    const cycle = await this.cycleModel.findById(cycleId).lean().exec() as any;
    if (!cycle) throw new NotFoundException('Cycle not found');

    const records = await this.recordModel.find({ cycleId: new Types.ObjectId(cycleId) }).lean().exec() as any[];

    const deptIds = [...new Set(records.map(r => r.departmentId?.toString()))].filter(Boolean);
    const departments = await this.departmentModel.find({ _id: { $in: deptIds.map(id => new Types.ObjectId(id)) } }).lean().exec() as any[];
    const deptMap = new Map(departments.map(d => [d._id.toString(), d.name]));

    const empIds = [...new Set(records.map(r => r.employeeProfileId?.toString()))].filter(Boolean);
    const employees = await this.employeeModel.find({ _id: { $in: empIds.map(id => new Types.ObjectId(id)) } }).lean().exec() as any[];
    const empMap = new Map(employees.map(e => [e._id.toString(), { name: `${e.firstName} ${e.lastName}`, department: e.departmentId?.toString() }]));

    let totalCompleted = 0;
    let totalScore = 0;
    const ratingDistribution: Record<string, number> = {};
    const byDepartment: Record<string, { name: string; count: number; totalScore: number; employees: any[] }> = {};

    for (const rec of records) {
      const empInfo = empMap.get(rec.employeeProfileId?.toString());
      const deptId = empInfo?.department || rec.departmentId?.toString() || 'Unknown';
      const deptName = deptMap.get(deptId) || 'Unknown Department';

      if (!byDepartment[deptId]) {
        byDepartment[deptId] = { name: deptName, count: 0, totalScore: 0, employees: [] };
      }

      if ([AppraisalRecordStatus.HR_PUBLISHED, AppraisalRecordStatus.ARCHIVED].includes(rec.status)) {
        totalCompleted++;
        totalScore += rec.totalScore ?? 0;
        const label = rec.overallRatingLabel || 'Unrated';
        ratingDistribution[label] = (ratingDistribution[label] || 0) + 1;

        byDepartment[deptId].count++;
        byDepartment[deptId].totalScore += rec.totalScore ?? 0;
        byDepartment[deptId].employees.push({
          employeeId: rec.employeeProfileId?.toString(),
          employeeName: empInfo?.name || 'Unknown',
          score: rec.totalScore,
          ratingLabel: rec.overallRatingLabel,
          status: rec.status,
        });
      }
    }

    const departmentBreakdown = Object.entries(byDepartment).map(([deptId, data]) => ({
      departmentId: deptId,
      departmentName: data.name,
      completedCount: data.count,
      averageScore: data.count > 0 ? Math.round((data.totalScore / data.count) * 100) / 100 : 0,
      employees: data.employees,
    }));

    const report = {
      cycleId,
      cycleName: cycle.name,
      cycleType: cycle.cycleType,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      status: cycle.status,
      summary: {
        totalRecords: records.length,
        completedRecords: totalCompleted,
        pendingRecords: records.length - totalCompleted,
        completionRate: records.length > 0 ? Math.round((totalCompleted / records.length) * 100) : 0,
        averageScore: totalCompleted > 0 ? Math.round((totalScore / totalCompleted) * 100) / 100 : 0,
      },
      ratingDistribution,
      departmentBreakdown,
      generatedAt: new Date(),
    };

    return report;
  }

  async getMultiCycleTrendAnalysis(employeeId: string, limit: number = 10) {
    console.log('[PerformanceService] getMultiCycleTrendAnalysis for employee:', employeeId, 'limit:', limit);
    
    // Get all records for the employee (including archived) sorted by cycle date
    const records = await this.recordModel
      .find({ employeeProfileId: new Types.ObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec() as any[];

    if (records.length === 0) {
      return {
        employeeId,
        message: 'No appraisal records found for this employee',
        trendData: [],
        summary: {
          totalCycles: 0,
          averageScore: 0,
          highestScore: null,
          lowestScore: null,
          improvementTrend: null,
        },
      };
    }

    const cycleIds = [...new Set(records.map(r => r.cycleId?.toString()))].filter(Boolean);
    const cycles = await this.cycleModel
      .find({ _id: { $in: cycleIds.map(id => new Types.ObjectId(id)) } })
      .lean()
      .exec() as any[];
    const cycleMap = new Map(cycles.map(c => [c._id.toString(), c]));

    // Build trend data with cycle information
    const trendData = records
      .filter(r => r.totalScore !== undefined && r.totalScore !== null && r.status === AppraisalRecordStatus.HR_PUBLISHED || r.status === AppraisalRecordStatus.ARCHIVED)
      .map(r => {
        const cycle = cycleMap.get(r.cycleId?.toString());
        return {
          cycleId: r.cycleId?.toString(),
          cycleName: cycle?.name || 'Unknown Cycle',
          cycleType: cycle?.cycleType,
          cycleStatus: cycle?.status,
          date: r.hrPublishedAt || r.managerSubmittedAt || r.createdAt,
          score: r.totalScore,
          ratingLabel: r.overallRatingLabel,
          status: r.status,
          isArchived: r.status === AppraisalRecordStatus.ARCHIVED,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, limit);

    const scores = trendData.map(t => t.score);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : null;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : null;
    const improvement = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : null;

    return {
      employeeId,
      trendData,
      summary: {
        totalCycles: trendData.length,
        averageScore: Math.round(avgScore * 100) / 100,
        highestScore,
        lowestScore,
        improvementTrend: improvement ? Math.round(improvement * 100) / 100 : null,
        improvementDirection: improvement && improvement > 0 ? 'IMPROVING' : improvement && improvement < 0 ? 'DECLINING' : 'STABLE',
        includesArchivedData: trendData.some(t => t.isArchived),
      },
    };
  }

  async createTemplate(dto: CreateTemplateDto, actorId?: string) {
    try {
      const existing = await this.templateModel.findOne({ name: dto.name }).lean().exec() as any;
      if (existing) throw new BadRequestException('Template with this name already exists');

      const toCreate: any = {
        name: dto.name,
        description: dto.description,
        templateType: dto.templateType,
        ratingScale: dto.ratingScale,
        criteria: dto.criteria || [],
        instructions: dto.instructions,
        applicableDepartmentIds: this.validateObjectIds('applicableDepartmentIds', dto.applicableDepartmentIds),
        applicablePositionIds: this.validateObjectIds('applicablePositionIds', dto.applicablePositionIds),
        isActive: true,
      };

      const created = await this.templateModel.create(toCreate);
      console.log('Template created successfully:', created._id);

      if (actorId) {
        try {
          await this.notificationModel.create({
            to: new Types.ObjectId(actorId),
            type: 'TEMPLATE_CREATED',
            message: `Appraisal template "${dto.name}" created`,
          } as any);
        } catch (notifErr) {
          console.warn('Failed to create notification:', notifErr);
          // Don't throw, just warn
        }
      }

      return created;
    } catch (error) {
      console.error('Template creation failed:', error);
      throw error;
    }
  }

  async findAllTemplates(filters: any = {}) {
    const query: any = {};
    if (filters.templateType) query.templateType = filters.templateType;
    if (filters.isActive !== undefined) query.isActive = filters.isActive === 'true' || filters.isActive === true;
    if (filters.departmentId) {
      if (!Types.ObjectId.isValid(filters.departmentId)) throw new BadRequestException('filters.departmentId is not a valid ObjectId');
      query.applicableDepartmentIds = new Types.ObjectId(filters.departmentId);
    }
    return this.templateModel.find(query).lean().exec();
  }

  async findTemplateById(id: string) {
    const template = await this.templateModel.findById(id).lean().exec();
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto, actorId?: string) {
    const before = await this.templateModel.findById(id).lean().exec() as any;
    if (!before) throw new NotFoundException('Template not found');

    const updateData: any = { ...dto };
    if (dto.applicableDepartmentIds) {
      updateData.applicableDepartmentIds = this.validateObjectIds('applicableDepartmentIds', dto.applicableDepartmentIds);
    }
    if (dto.applicablePositionIds) {
      updateData.applicablePositionIds = this.validateObjectIds('applicablePositionIds', dto.applicablePositionIds);
    }

    const updated = await this.templateModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

    if (actorId) {
      await this.notificationModel.create({
        to: new Types.ObjectId(actorId),
        type: 'TEMPLATE_UPDATED',
        message: `Appraisal template "${before.name}" updated`,
      } as any);
    }

    return updated;
  }

  async deactivateTemplate(id: string, actorId?: string) {
    const template = await this.templateModel.findById(id).lean().exec() as any;
    if (!template) throw new NotFoundException('Template not found');

    const activeCycle = await this.cycleModel.findOne({
      'templateAssignments.templateId': new Types.ObjectId(id),
      status: { $in: [AppraisalCycleStatus.PLANNED, AppraisalCycleStatus.ACTIVE] },
    }).lean().exec();

    if (activeCycle) {
      throw new BadRequestException('Cannot deactivate template used in active/planned cycles');
    }

    const updated = await this.templateModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec();

    if (actorId) {
      await this.notificationModel.create({
        to: new Types.ObjectId(actorId),
        type: 'TEMPLATE_DEACTIVATED',
        message: `Appraisal template "${template.name}" deactivated`,
      } as any);
    }

    return updated;
  }
}
