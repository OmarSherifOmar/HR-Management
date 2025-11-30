import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationLog, NotificationLogDocument } from '../../time-management/models/notification-log.schema';

/**
 * Notification Types for Leave Management
 * 
 * REQ-019: Employee notifications (status changes)
 * REQ-024: Manager notifications (assignment)
 * REQ-030: Finalization notifications (all stakeholders)
 */
export enum LeaveNotificationType {
  // REQ-019: Employee status notifications
  LEAVE_REQUEST_APPROVED = 'LEAVE_REQUEST_APPROVED',
  LEAVE_REQUEST_REJECTED = 'LEAVE_REQUEST_REJECTED',
  LEAVE_REQUEST_RETURNED = 'LEAVE_REQUEST_RETURNED',       // Returned for correction
  LEAVE_REQUEST_MODIFIED = 'LEAVE_REQUEST_MODIFIED',
  
  // REQ-024: Manager assignment notifications
  LEAVE_REQUEST_ASSIGNED = 'LEAVE_REQUEST_ASSIGNED',       // New request assigned to manager
  LEAVE_REQUEST_OVERDUE = 'LEAVE_REQUEST_OVERDUE',         // Escalation after 48 hrs
  
  // REQ-030: Finalization notifications (to all stakeholders)
  LEAVE_REQUEST_FINALIZED = 'LEAVE_REQUEST_FINALIZED',
}

/**
 * Notification Service for Leave Management
 * 
 * Uses the NotificationLog schema from time-management to persist notifications.
 * Service and controller are in the leaves module to avoid merge conflicts.
 * 
 * REQ-019: Employee receives notifications on approval, rejection, return, modification
 * REQ-024: Manager receives notifications when requests are assigned or overdue
 * REQ-030: All stakeholders notified when request is finalized
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(NotificationLog.name) private notificationModel: Model<NotificationLogDocument>,
  ) {}

  /**
   * Create and save a notification
   */
  async send(
    recipientId: string,
    type: LeaveNotificationType | string,
    message: string,
  ): Promise<NotificationLogDocument> {
    const notification = new this.notificationModel({
      to: new Types.ObjectId(recipientId),
      type,
      message,
    });

    const saved = await notification.save();
    this.logger.log(`[NOTIFICATION] ${type} sent to ${recipientId}: ${message}`);
    
    return saved;
  }

  /**
   * Send multiple notifications at once
   */
  async sendBatch(
    notifications: { recipientId: string; type: LeaveNotificationType | string; message: string }[],
  ): Promise<NotificationLogDocument[]> {
    const docs = notifications.map(n => ({
      to: new Types.ObjectId(n.recipientId),
      type: n.type,
      message: n.message,
    }));

    const saved = await this.notificationModel.insertMany(docs);
    this.logger.log(`[BATCH NOTIFICATION] Sent ${saved.length} notifications`);
    
    return saved;
  }

  /**
   * Get notifications for a user
   */
  async getNotificationsForUser(
    userId: string,
    options?: { limit?: number; skip?: number },
  ): Promise<NotificationLogDocument[]> {
    return this.notificationModel
      .find({ to: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50)
      .exec();
  }

  /**
   * Get notification count for a user
   */
  async getNotificationCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({ to: new Types.ObjectId(userId) });
  }

  // ==================== REQ-019: EMPLOYEE STATUS NOTIFICATIONS ====================

  /**
   * REQ-019: Notify employee that their leave request was approved
   */
  async notifyLeaveRequestApproved(
    employeeId: string,
    details: { leaveType: string; startDate: string; endDate: string; durationDays: number },
  ): Promise<NotificationLogDocument> {
    const message = `Your ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} (${details.durationDays} days) has been approved.`;
    return this.send(employeeId, LeaveNotificationType.LEAVE_REQUEST_APPROVED, message);
  }

  /**
   * REQ-019: Notify employee that their leave request was rejected
   */
  async notifyLeaveRequestRejected(
    employeeId: string,
    details: { leaveType: string; startDate: string; endDate: string; reason?: string },
  ): Promise<NotificationLogDocument> {
    const message = `Your ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} has been rejected.${details.reason ? ` Reason: ${details.reason}` : ''}`;
    return this.send(employeeId, LeaveNotificationType.LEAVE_REQUEST_REJECTED, message);
  }

  /**
   * REQ-019: Notify employee that their leave request was returned for correction
   */
  async notifyLeaveRequestReturned(
    employeeId: string,
    details: { leaveType: string; startDate: string; endDate: string; reason: string },
  ): Promise<NotificationLogDocument> {
    const message = `Your ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} has been returned for correction. Reason: ${details.reason}`;
    return this.send(employeeId, LeaveNotificationType.LEAVE_REQUEST_RETURNED, message);
  }

  /**
   * REQ-019: Notify employee that their leave request was modified
   */
  async notifyLeaveRequestModified(
    employeeId: string,
    details: { leaveType: string; changes: string },
  ): Promise<NotificationLogDocument> {
    const message = `Your ${details.leaveType} leave request has been modified. Changes: ${details.changes}`;
    return this.send(employeeId, LeaveNotificationType.LEAVE_REQUEST_MODIFIED, message);
  }

  // ==================== REQ-024: MANAGER ASSIGNMENT NOTIFICATIONS ====================

  /**
   * REQ-024: Notify manager that a new leave request is assigned to them
   */
  async notifyManagerRequestAssigned(
    managerId: string,
    details: { employeeName: string; leaveType: string; startDate: string; endDate: string },
  ): Promise<NotificationLogDocument> {
    const message = `A new ${details.leaveType} leave request from ${details.employeeName} for ${details.startDate} to ${details.endDate} has been assigned to you for review.`;
    return this.send(managerId, LeaveNotificationType.LEAVE_REQUEST_ASSIGNED, message);
  }

  /**
   * REQ-024: Notify manager/escalate when request is overdue (pending > 48 hrs)
   */
  async notifyRequestOverdue(
    managerId: string,
    details: { employeeName: string; leaveType: string; startDate: string; endDate: string; hoursPending: number },
  ): Promise<NotificationLogDocument> {
    const message = `URGENT: Leave request from ${details.employeeName} (${details.leaveType} for ${details.startDate} to ${details.endDate}) has been pending for ${details.hoursPending} hours and requires immediate action.`;
    return this.send(managerId, LeaveNotificationType.LEAVE_REQUEST_OVERDUE, message);
  }

  // ==================== REQ-030: FINALIZATION NOTIFICATIONS ====================

  /**
   * REQ-030: Notify all stakeholders when a leave request is finalized
   * 
   * Sends notifications to:
   * - Employee (owner of the request)
   * - Employee's Manager
   * - Attendance Coordinator (if provided)
   */
  async notifyRequestFinalized(
    stakeholders: {
      employeeId: string;
      managerId?: string;
      attendanceCoordinatorId?: string;
    },
    details: {
      employeeName: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      durationDays: number;
    },
  ): Promise<NotificationLogDocument[]> {
    const notifications: { recipientId: string; type: LeaveNotificationType; message: string }[] = [];

    // Notify employee
    notifications.push({
      recipientId: stakeholders.employeeId,
      type: LeaveNotificationType.LEAVE_REQUEST_FINALIZED,
      message: `Your ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} (${details.durationDays} days) has been finalized and approved.`,
    });

    // Notify manager
    if (stakeholders.managerId) {
      notifications.push({
        recipientId: stakeholders.managerId,
        type: LeaveNotificationType.LEAVE_REQUEST_FINALIZED,
        message: `${details.employeeName}'s ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} (${details.durationDays} days) has been finalized.`,
      });
    }

    // Notify attendance coordinator
    if (stakeholders.attendanceCoordinatorId) {
      notifications.push({
        recipientId: stakeholders.attendanceCoordinatorId,
        type: LeaveNotificationType.LEAVE_REQUEST_FINALIZED,
        message: `${details.employeeName}'s ${details.leaveType} leave request for ${details.startDate} to ${details.endDate} (${details.durationDays} days) has been finalized. Please update attendance records.`,
      });
    }

    return this.sendBatch(notifications);
  }
}
