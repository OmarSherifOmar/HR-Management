import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StructureChangeRequest } from '../models/structure-change-request.schema';
import { StructureApproval } from '../models/structure-approval.schema';
import { StructureChangeLog } from '../models/structure-change-log.schema';
import { Department } from '../models/department.schema';
import { Position } from '../models/position.schema';
import { NotificationLog } from '../../time-management/./models/notification-log.schema';
import { CreateChangeRequestDto } from '../dtos/create-change-request.dto';

@Injectable()
export class ChangeRequestService {
  constructor(
    @InjectModel(StructureChangeRequest.name) private requestModel: Model<any>,
    @InjectModel(StructureApproval.name) private approvalModel: Model<any>,
    @InjectModel(StructureChangeLog.name) private changeLogModel: Model<any>,
    @InjectModel(Department.name) private deptModel: Model<any>,
    @InjectModel(Position.name) private posModel: Model<any>,
    @InjectModel(NotificationLog.name) private notificationModel: Model<any>, // injection for notification logs
  ) {}

  async create(dto: CreateChangeRequestDto, requestedByEmployeeId: string) {
    const number = `REQ-${Date.now()}`;
    const created = await this.requestModel.create({
      requestNumber: number,
      requestedByEmployeeId: new Types.ObjectId(requestedByEmployeeId),
      requestType: dto.requestType,
      targetDepartmentId: dto.targetDepartmentId,
      targetPositionId: dto.targetPositionId,
      details: dto.details,
      reason: dto.reason,
      payload: dto.payload,
      status: 'DRAFT',
    } as any);

    // Write change-log entry for request creation
    await this.changeLogModel.create({
      action: 'REQUEST_CREATE',
      entityType: 'StructureChangeRequest',
      entityId: created._id,
      performedByEmployeeId: new Types.ObjectId(requestedByEmployeeId),
      afterSnapshot: typeof created?.toObject === 'function' ? created.toObject() : created,
      summary: `Change request ${number} created by ${requestedByEmployeeId}`,
    } as any);

    // Best-effort: write notification log for requester
    try {
      await this.notificationModel.create({
        to: new Types.ObjectId(requestedByEmployeeId),
        type: 'CHANGE_REQUEST_CREATED',
        message: `Your change request ${number} has been created and is in DRAFT status.`,
      } as any);
    } catch (err) {
      await this.changeLogModel.create({
        action: 'NOTIFICATION_FAIL',
        entityType: 'StructureChangeRequest',
        entityId: created._id,
        performedByEmployeeId: new Types.ObjectId(requestedByEmployeeId),
        afterSnapshot: { error: String(err) },
        summary: `Failed to write notification log for request ${number}`,
      } as any);
    }

    // Optional: system admin notification via env var (best-effort)
    const sysAdminId = process.env.SYSTEM_ADMIN_ID;
    if (sysAdminId) {
      try {
        await this.notificationModel.create({
          to: new Types.ObjectId(sysAdminId),
          type: 'CHANGE_REQUEST_REQUIRES_APPROVAL',
          message: `Change request ${number} created by ${requestedByEmployeeId}. Please review.`,
        } as any);
      } catch (err) {
        await this.changeLogModel.create({
          action: 'NOTIFICATION_FAIL',
          entityType: 'StructureChangeRequest',
          entityId: created._id,
          performedByEmployeeId: new Types.ObjectId(requestedByEmployeeId),
          afterSnapshot: { error: String(err) },
          summary: `Failed to write system-admin notification for request ${number}`,
        } as any);
      }
    }

    return created;
  }

  async submit(requestId: string, submittedByEmployeeId: string) {
    const req = await this.requestModel.findById(requestId).exec();
    if (!req) throw new NotFoundException('Change request not found');
    if (req.status !== 'DRAFT') throw new BadRequestException('Only DRAFT requests can be submitted');

    req.status = 'SUBMITTED';
    req.submittedByEmployeeId = new Types.ObjectId(submittedByEmployeeId);
    req.submittedAt = new Date();
    await req.save();

    await this.changeLogModel.create({
      action: 'REQUEST_SUBMIT',
      entityType: 'StructureChangeRequest',
      entityId: req._id,
      performedByEmployeeId: new Types.ObjectId(submittedByEmployeeId),
      afterSnapshot: typeof req?.toObject === 'function' ? req.toObject() : req,
      summary: `Change request ${req.requestNumber} submitted by ${submittedByEmployeeId}`,
    } as any);

    return req;
  }

  async approve(requestId: string, approverEmployeeId: string, decision = 'APPROVED', comments?: string) {
    const req = await this.requestModel.findById(requestId).exec();
    if (!req) throw new NotFoundException('Change request not found');
    if (req.status !== 'SUBMITTED') throw new BadRequestException('Only SUBMITTED requests can be approved');

    await this.approvalModel.create({
      changeRequestId: req._id,
      approverEmployeeId: new Types.ObjectId(approverEmployeeId),
      decision,
      comments,
      decidedAt: new Date(),
    } as any);

    const rt = String(req.requestType).toUpperCase();

    // CREATE_DEPT
    if (rt === 'CREATE_DEPT' && req.payload) {
      const created = await this.deptModel.create(req.payload);
      await this.changeLogModel.create({
        action: 'CREATE',
        entityType: 'Department',
        entityId: created._id,
        afterSnapshot: typeof created.toObject === 'function' ? created.toObject() : created,
        summary: `Applied change-request ${req.requestNumber} (create dept)`,
      } as any);

    // UPDATE_DEPT
    } else if (rt === 'UPDATE_DEPT' && req.targetDepartmentId && req.payload) {
      const before = (await this.deptModel.findById(req.targetDepartmentId).lean().exec()) as any;
      if (!before) throw new NotFoundException('Target department not found');
      const updated = (await this.deptModel.findByIdAndUpdate(req.targetDepartmentId, req.payload, { new: true }).exec()) as any;
      await this.changeLogModel.create({
        action: 'UPDATE',
        entityType: 'Department',
        entityId: updated._id,
        beforeSnapshot: before,
        afterSnapshot: typeof updated.toObject === 'function' ? updated.toObject() : updated,
        summary: `Applied change-request ${req.requestNumber} (update dept)`,
      } as any);

    // DEACTIVATE_DEPT
    } else if (rt === 'DEACTIVATE_DEPT' && req.targetDepartmentId) {
      const before = (await this.deptModel.findById(req.targetDepartmentId).lean().exec()) as any;
      if (!before) throw new NotFoundException('Target department not found');
      await this.deptModel.findByIdAndUpdate(req.targetDepartmentId, { isActive: false, closedAt: new Date() }).exec();
      await this.changeLogModel.create({
        action: 'DEACTIVATE',
        entityType: 'Department',
        entityId: req.targetDepartmentId,
        beforeSnapshot: before,
        afterSnapshot: { ...before, isActive: false },
        summary: `Applied change-request ${req.requestNumber} (deactivate dept)`,
      } as any);

    // CREATE_POSITION
    } else if (rt === 'CREATE_POSITION' && req.payload) {
      const created = await this.posModel.create(req.payload);
      await this.changeLogModel.create({
        action: 'CREATE',
        entityType: 'Position',
        entityId: created._id,
        afterSnapshot: typeof created.toObject === 'function' ? created.toObject() : created,
        summary: `Applied change-request ${req.requestNumber} (create position)`,
      } as any);

    // UPDATE_POSITION
    } else if (rt === 'UPDATE_POSITION' && req.targetPositionId && req.payload) {
      const before = (await this.posModel.findById(req.targetPositionId).lean().exec()) as any;
      if (!before) throw new NotFoundException('Target position not found');
      const updated = (await this.posModel.findByIdAndUpdate(req.targetPositionId, req.payload, { new: true }).exec()) as any;
      await this.changeLogModel.create({
        action: 'UPDATE',
        entityType: 'Position',
        entityId: updated._id,
        beforeSnapshot: before,
        afterSnapshot: typeof updated.toObject === 'function' ? updated.toObject() : updated,
        summary: `Applied change-request ${req.requestNumber} (update position)`,
      } as any);

    // DEACTIVATE_POSITION
    } else if (rt === 'DEACTIVATE_POSITION' && req.targetPositionId) {
      const before = (await this.posModel.findById(req.targetPositionId).lean().exec()) as any;
      if (!before) throw new NotFoundException('Target position not found');

      // Block deactivation if active assignment exists
      const activeAssignment = (await this.posModel.db
        .collection('position_assignments')
        .findOne({ positionId: req.targetPositionId, endDate: { $exists: false } })) as any;

      if (activeAssignment) {
        throw new BadRequestException('Position cannot be deactivated because an employee is currently assigned to it.');
      }

      const updated = (await this.posModel.findByIdAndUpdate(req.targetPositionId, { isActive: false, closedAt: new Date() }, { new: true }).exec()) as any;
      await this.changeLogModel.create({
        action: 'DEACTIVATE',
        entityType: 'Position',
        entityId: updated._id,
        beforeSnapshot: before,
        afterSnapshot: typeof updated.toObject === 'function' ? updated.toObject() : updated,
        summary: `Applied change-request ${req.requestNumber} (deactivate position)`,
      } as any);

    } else {
      throw new BadRequestException('Unsupported requestType or missing payload');
    }

    req.status = 'APPROVED';
    await req.save();

    // notify requester that request was approved
    try {
      await this.notificationModel.create({
        to: req.requestedByEmployeeId,
        type: 'CHANGE_REQUEST_APPROVED',
        message: `Your change request ${req.requestNumber} was approved by ${approverEmployeeId}.`,
      } as any);
    } catch (err) {
      await this.changeLogModel.create({
        action: 'NOTIFICATION_FAIL',
        entityType: 'StructureChangeRequest',
        entityId: req._id,
        performedByEmployeeId: new Types.ObjectId(approverEmployeeId),
        afterSnapshot: { error: String(err) },
        summary: `Failed to write approval notification for request ${req.requestNumber}`,
      } as any);
    }

    return req;
  }

  async reject(requestId: string, approverEmployeeId: string, comments?: string) {
    const req = await this.requestModel.findById(requestId).exec();
    if (!req) throw new NotFoundException('Change request not found');
    if (req.status !== 'SUBMITTED') throw new BadRequestException('Only SUBMITTED requests can be rejected');

    await this.approvalModel.create({
      changeRequestId: req._id,
      approverEmployeeId: new Types.ObjectId(approverEmployeeId),
      decision: 'REJECTED',
      comments,
      decidedAt: new Date(),
    } as any);

    req.status = 'REJECTED';
    await req.save();

    try {
      await this.notificationModel.create({
        to: req.requestedByEmployeeId,
        type: 'CHANGE_REQUEST_REJECTED',
        message: `Your change request ${req.requestNumber} was rejected by ${approverEmployeeId}.`,
      } as any);
    } catch (err) {
      await this.changeLogModel.create({
        action: 'NOTIFICATION_FAIL',
        entityType: 'StructureChangeRequest',
        entityId: req._id,
        performedByEmployeeId: new Types.ObjectId(approverEmployeeId),
        afterSnapshot: { error: String(err) },
        summary: `Failed to write rejection notification for request ${req.requestNumber}`,
      } as any);
    }

    return req;
  }

  async list(filters: any = {}) {
    return this.requestModel.find(filters).lean().exec();
  }
}
