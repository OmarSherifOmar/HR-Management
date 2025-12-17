import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppraisalAssignment } from '../models/appraisal-assignment.schema';
import { AppraisalRecord } from '../models/appraisal-record.schema';
import { AppraisalCycle } from '../models/appraisal-cycle.schema';
import { AppraisalTemplate } from '../models/appraisal-template.schema';
import { AppraisalAssignmentStatus, AppraisalRecordStatus } from '../enums/performance.enums';
import { CreateAssignmentDto, BulkAssignmentDto } from '../dtos/create-assignment.dto';
import { SubmitAppraisalDto, PublishAppraisalDto, BulkPublishDto } from '../dtos/submit-appraisal.dto';
import { NotificationLog } from '../../time-management/models/notification-log.schema';
import { EmployeeProfile } from '../../employee-profile/models/employee-profile.schema';
import { Department } from '../../organization-structure/models/department.schema';
import { Position } from '../../organization-structure/models/position.schema';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectModel(AppraisalAssignment.name) private assignmentModel: Model<any>,
    @InjectModel(AppraisalRecord.name) private recordModel: Model<any>,
    @InjectModel(AppraisalCycle.name) private cycleModel: Model<any>,
    @InjectModel(AppraisalTemplate.name) private templateModel: Model<any>,
    @InjectModel(NotificationLog.name) private notificationModel: Model<any>,
    @InjectModel(EmployeeProfile.name) private employeeModel: Model<any>,
    @InjectModel(Department.name) private departmentModel: Model<any>,
    @InjectModel(Position.name) private positionModel: Model<any>,
  ) {}

  private toObjectId(fieldName: string, id?: string) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`${fieldName} is not a valid ObjectId`);
    }
    return new Types.ObjectId(id);
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
    const query: any = { managerProfileId: new Types.ObjectId(managerId) };
    if (cycleId) query.cycleId = new Types.ObjectId(cycleId);
    
    const assignments = await this.assignmentModel.find(query).lean().exec() as any[];
    
    const enriched = await Promise.all(assignments.map(async (a) => {
      const employee = await this.employeeModel.findById(a.employeeProfileId).lean().exec() as any;
      const template = await this.templateModel.findById(a.templateId).lean().exec() as any;
      const cycle = await this.cycleModel.findById(a.cycleId).lean().exec() as any;
      const record = a.latestAppraisalId 
        ? await this.recordModel.findById(a.latestAppraisalId).lean().exec() as any
        : null;
      
      return {
        ...a,
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
          criteria: template?.criteria || [],
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

    if ((assignment as any).managerProfileId?.toString() !== dto.managerId) {
      throw new ForbiddenException('Only assigned manager can submit this appraisal');
    }

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

    await this.notificationModel.create({
      to: (assignment as any).employeeProfileId,
      type: 'APPRAISAL_SUBMITTED',
      message: `Your appraisal has been submitted by your manager and is pending HR review.`,
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

    await this.assignmentModel.findByIdAndUpdate((record as any).assignmentId, {
      status: AppraisalAssignmentStatus.PUBLISHED,
      publishedAt: new Date(),
    });

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

      await this.assignmentModel.findByIdAndUpdate((record as any).assignmentId, { status: AppraisalAssignmentStatus.PUBLISHED, publishedAt: now });

      await this.notificationModel.create({
        to: (record as any).employeeProfileId,
        type: 'APPRAISAL_PUBLISHED',
        message: `Your appraisal for cycle "${cycle.name}" has been published`,
      } as any);

      published.push((record as any)._id.toString());
    }

    return { success: true, publishedCount: published.length, publishedIds: published };
  }
}
