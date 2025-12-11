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
    @InjectModel(NotificationLog.name) private notificationModel: Model<any>, 
  ) {}

  private async findRequest(requestId: string) {
    try {
      const req = await this.requestModel.findOne({ _id: new Types.ObjectId(requestId) }).exec();
      if (req) return req;
    } catch (e) {}
    const req = await this.requestModel.findOne({ _id: requestId }).exec();
    return req;
  }

  async create(dto: CreateChangeRequestDto, requestedByEmployeeId: string) {
    const number = `REQ-${Date.now()}`;
    
    let detailsToStore = dto.details || '';
    if (dto.payload) {
      detailsToStore = JSON.stringify({
        userDetails: dto.details || '',
        payload: dto.payload,
      });
    }
    
    const created = await this.requestModel.create({
      _id: new Types.ObjectId(),
      requestNumber: number,
      requestedByEmployeeId: new Types.ObjectId(requestedByEmployeeId),
      requestType: dto.requestType,
      targetDepartmentId: dto.targetDepartmentId,
      targetPositionId: dto.targetPositionId,
      details: detailsToStore,
      reason: dto.reason,
      status: 'DRAFT',
    } as any);

    await this.changeLogModel.create({
      _id: new Types.ObjectId(),
      action: 'CREATED',
      entityType: 'StructureChangeRequest',
      entityId: created._id,
      performedByEmployeeId: new Types.ObjectId(requestedByEmployeeId),
      afterSnapshot: typeof created?.toObject === 'function' ? created.toObject() : created,
      summary: `Change request ${number} created by ${requestedByEmployeeId}`,
    } as any);

    try {
      await this.notificationModel.create({
        to: new Types.ObjectId(requestedByEmployeeId),
        type: 'CHANGE_REQUEST_CREATED',
        message: `Your change request ${number} has been created and is in DRAFT status.`,
      } as any);
    } catch (err) {
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'CREATED',
        entityType: 'StructureChangeRequest',
        entityId: created._id,
        performedByEmployeeId: new Types.ObjectId(requestedByEmployeeId),
        afterSnapshot: { error: String(err) },
        summary: `Failed to write notification log for request ${number}`,
      } as any);
    }

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
          _id: new Types.ObjectId(),
          action: 'CREATED',
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
    const req = await this.findRequest(requestId);
    if (!req) throw new NotFoundException('Change request not found');
    if (req.status !== 'DRAFT') throw new BadRequestException('Only DRAFT requests can be submitted');

    req.status = 'SUBMITTED';
    req.submittedByEmployeeId = new Types.ObjectId(submittedByEmployeeId);
    req.submittedAt = new Date();
    await req.save();

    await this.changeLogModel.create({
      _id: new Types.ObjectId(),
      action: 'UPDATED',
      entityType: 'StructureChangeRequest',
      entityId: req._id,
      performedByEmployeeId: new Types.ObjectId(submittedByEmployeeId),
      afterSnapshot: typeof req?.toObject === 'function' ? req.toObject() : req,
      summary: `Change request ${req.requestNumber} submitted by ${submittedByEmployeeId}`,
    } as any);

    return req;
  }

  async approve(requestId: string, approverEmployeeId: string, decision = 'APPROVED', comments?: string) {
    const req = await this.findRequest(requestId);
    if (!req) throw new NotFoundException('Change request not found');
    if (req.status !== 'SUBMITTED') throw new BadRequestException('Only SUBMITTED requests can be approved');

    await this.approvalModel.create({
      _id: new Types.ObjectId(),
      changeRequestId: req._id,
      approverEmployeeId: new Types.ObjectId(approverEmployeeId),
      decision,
      comments,
      decidedAt: new Date(),
    } as any);

    const rt = String(req.requestType).toUpperCase();

    let payload: any = null;
    let userDetails = req.details || '';
    if (req.details) {
      try {
        const parsed = JSON.parse(req.details);
        if (parsed && typeof parsed === 'object' && 'payload' in parsed) {
          payload = parsed.payload;
          userDetails = parsed.userDetails || '';
        }
      } catch (e) {
        userDetails = req.details;
      }
    }

    const isDeptCreate = rt.includes('NEW') && rt.includes('DEPT') || rt === 'NEW_DEPARTMENT';
    const isDeptUpdate = rt.includes('UPDATE') && rt.includes('DEPT') || rt === 'UPDATE_DEPARTMENT';
    const isDeptDeactivate = (rt.includes('DEACTIVATE') || rt.includes('CLOSE')) && rt.includes('DEPT');
    const isPosCreate = rt.includes('NEW') && rt.includes('POS') || rt === 'NEW_POSITION';
    const isPosUpdate = rt.includes('UPDATE') && rt.includes('POS') || rt === 'UPDATE_POSITION';
    const isPosDeactivate = (rt.includes('DEACTIVATE') || rt.includes('CLOSE')) && rt.includes('POS') || rt === 'CLOSE_POSITION';

    if (isDeptCreate && !payload) {
      throw new BadRequestException('Payload with department data (code, name, description) is required for NEW_DEPARTMENT requests');
    }
    if (isDeptUpdate && (!req.targetDepartmentId || !payload)) {
      throw new BadRequestException('targetDepartmentId and payload are required for UPDATE_DEPARTMENT requests');
    }
    if (isDeptDeactivate && !req.targetDepartmentId) {
      throw new BadRequestException('targetDepartmentId is required for deactivating a department');
    }
    if (isPosCreate && !payload) {
      throw new BadRequestException('Payload with position data (title, departmentId, payGradeId) is required for NEW_POSITION requests');
    }
    if (isPosUpdate && (!req.targetPositionId || !payload)) {
      throw new BadRequestException('targetPositionId and payload are required for UPDATE_POSITION requests');
    }
    if (isPosDeactivate && !req.targetPositionId) {
      throw new BadRequestException('targetPositionId is required for CLOSE_POSITION requests');
    }

    if (isDeptCreate) {
      const deptData = { ...payload };
      if (payload.headPositionId) {
        deptData.headPositionId = new Types.ObjectId(payload.headPositionId);
      }
      const created = await this.deptModel.create(deptData);
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'CREATED',
        entityType: 'Department',
        entityId: created._id,
        afterSnapshot: typeof created.toObject === 'function' ? created.toObject() : created,
        summary: `Applied change-request ${req.requestNumber} (create dept)`,
      } as any);

    } else if (isDeptUpdate) {
      const before = (await this.deptModel.findById(req.targetDepartmentId).lean().exec()) as any;
      if (!before) throw new NotFoundException('Target department not found');
      const deptUpdateData = { ...payload };
      if (payload.headPositionId) {
        deptUpdateData.headPositionId = new Types.ObjectId(payload.headPositionId);
      }
      const updated = (await this.deptModel.findByIdAndUpdate(req.targetDepartmentId, deptUpdateData, { new: true }).exec()) as any;
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'UPDATED',
        entityType: 'Department',
        entityId: updated._id,
        beforeSnapshot: before,
        afterSnapshot: typeof updated.toObject === 'function' ? updated.toObject() : updated,
        summary: `Applied change-request ${req.requestNumber} (update dept)`,
      } as any);

    } else if (isDeptDeactivate) {
      const before = (await this.deptModel.findById(req.targetDepartmentId).lean().exec()) as any;
      if (!before) throw new NotFoundException('Target department not found');
      await this.deptModel.findByIdAndUpdate(req.targetDepartmentId, { isActive: false, closedAt: new Date() }).exec();
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'DEACTIVATED',
        entityType: 'Department',
        entityId: req.targetDepartmentId,
        beforeSnapshot: before,
        afterSnapshot: { ...before, isActive: false },
        summary: `Applied change-request ${req.requestNumber} (deactivate dept)`,
      } as any);

    } else if (isPosCreate) {
      const posData = { ...payload };
      if (payload.departmentId) {
        posData.departmentId = new Types.ObjectId(payload.departmentId);
      }
      if (payload.reportsToPositionId) {
        posData.reportsToPositionId = new Types.ObjectId(payload.reportsToPositionId);
      }
      const created = await this.posModel.create(posData);
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'CREATED',
        entityType: 'Position',
        entityId: created._id,
        afterSnapshot: typeof created.toObject === 'function' ? created.toObject() : created,
        summary: `Applied change-request ${req.requestNumber} (create position)`,
      } as any);

    } else if (isPosUpdate) {
      const before = (await this.posModel.findById(req.targetPositionId).lean().exec()) as any;
      if (!before) throw new NotFoundException('Target position not found');
      const posUpdateData = { ...payload };
      if (payload.departmentId) {
        posUpdateData.departmentId = new Types.ObjectId(payload.departmentId);
      }
      if (payload.reportsToPositionId) {
        posUpdateData.reportsToPositionId = new Types.ObjectId(payload.reportsToPositionId);
      }
      const updated = (await this.posModel.findByIdAndUpdate(req.targetPositionId, posUpdateData, { new: true }).exec()) as any;
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'UPDATED',
        entityType: 'Position',
        entityId: updated._id,
        beforeSnapshot: before,
        afterSnapshot: typeof updated.toObject === 'function' ? updated.toObject() : updated,
        summary: `Applied change-request ${req.requestNumber} (update position)`,
      } as any);

    } else if (isPosDeactivate) {
      const before = (await this.posModel.findById(req.targetPositionId).lean().exec()) as any;
      if (!before) throw new NotFoundException('Target position not found');

      const activeAssignment = (await this.posModel.db
        .collection('position_assignments')
        .findOne({ positionId: req.targetPositionId, endDate: { $exists: false } })) as any;

      if (activeAssignment) {
        throw new BadRequestException('Position cannot be deactivated because an employee is currently assigned to it (BR 12).');
      }

      const updated = (await this.posModel.findByIdAndUpdate(req.targetPositionId, { isActive: false, closedAt: new Date() }, { new: true }).exec()) as any;
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'DEACTIVATED',
        entityType: 'Position',
        entityId: updated._id,
        beforeSnapshot: before,
        afterSnapshot: typeof updated.toObject === 'function' ? updated.toObject() : updated,
        summary: `Applied change-request ${req.requestNumber} (deactivate position)`,
      } as any);

    } else {
      throw new BadRequestException(`Unsupported requestType: ${req.requestType}. Supported types: NEW_DEPARTMENT, UPDATE_DEPARTMENT, NEW_POSITION, UPDATE_POSITION, CLOSE_POSITION`);
    }

    req.status = 'APPROVED';
    await req.save();

    try {
      await this.notificationModel.create({
        to: req.requestedByEmployeeId,
        type: 'CHANGE_REQUEST_APPROVED',
        message: `Your change request ${req.requestNumber} was approved by ${approverEmployeeId}.`,
      } as any);
    } catch (err) {
      await this.changeLogModel.create({
        _id: new Types.ObjectId(),
        action: 'UPDATED',
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
    const req = await this.findRequest(requestId);
    if (!req) throw new NotFoundException('Change request not found');
    if (req.status !== 'SUBMITTED') throw new BadRequestException('Only SUBMITTED requests can be rejected');

    await this.approvalModel.create({
      _id: new Types.ObjectId(),
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
        _id: new Types.ObjectId(),
        action: 'UPDATED',
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

  async delete(requestId: string, deletedByEmployeeId: string) {
    const req = await this.findRequest(requestId);
    if (!req) throw new NotFoundException('Change request not found');

    if (req.status !== 'DRAFT' && req.status !== 'REJECTED') {
      throw new BadRequestException('Only DRAFT or REJECTED requests can be deleted');
    }

    await this.changeLogModel.create({
      _id: new Types.ObjectId(),
      action: 'DELETED',
      entityType: 'StructureChangeRequest',
      entityId: req._id,
      performedByEmployeeId: new Types.ObjectId(deletedByEmployeeId),
      beforeSnapshot: typeof req?.toObject === 'function' ? req.toObject() : req,
      summary: `Change request ${req.requestNumber} deleted by ${deletedByEmployeeId}`,
    } as any);

    await this.requestModel.deleteOne({ _id: req._id }).exec();
    return { message: 'Change request deleted successfully' };
  }

  async findOne(requestId: string) {
    const req = await this.findRequest(requestId);
    if (!req) throw new NotFoundException('Change request not found');
    return req;
  }
}
