import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppraisalAssignment } from '../models/appraisal-assignment.schema';
import { AppraisalRecord } from '../models/appraisal-record.schema';
import { AppraisalCycle } from '../models/appraisal-cycle.schema';
import { AppraisalTemplate } from '../models/appraisal-template.schema';
import { AppraisalAssignmentStatus, AppraisalRecordStatus } from '../enums/performance.enums';
import { CreateAssignmentDto, BulkAssignmentDto } from '../dtos/create-assignment.dto';
import { SubmitAppraisalDto, PublishAppraisalDto, BulkPublishDto, SubmitAndPublishDto } from '../dtos/submit-appraisal.dto';
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
  async acknowledgeAppraisal(dto: { recordId: string; acknowledgedByEmployeeId?: string; comment?: string }) {
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

    // Convert department IDs
    const depIds = departmentIds.map(id => new Types.ObjectId(id));

    // Find all managers with pending assignments in these departments for this cycle
    const pendingAssignments = await this.assignmentModel
      .find({
        cycleId: new Types.ObjectId(cycleId),
        departmentId: { $in: depIds },
        status: { $in: [AppraisalAssignmentStatus.NOT_STARTED, AppraisalAssignmentStatus.IN_PROGRESS] },
      })
      .lean()
      .exec() as any[];

    console.log(`[sendReminder] Found ${pendingAssignments.length} pending assignments`);

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
        await this.notificationModel.create({
          to: new Types.ObjectId(managerId),
          type: `APPRAISAL_${reminderType}`,
          message: notificationMessage,
        } as any);
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
}
