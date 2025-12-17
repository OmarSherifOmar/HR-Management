import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotificationService as TimeManagementNotificationService } from '../../time-management/services/notification.service';
import { NotificationLogDocument } from '../../time-management/models/notification-log.schema';

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
 * Leave Notification Service
 * 
 * Handles all leave-related notification logic and message formatting.
 * Delegates actual notification persistence to TimeManagementNotificationService.
 * 
 * REQ-019: Employee receives notifications on approval, rejection, return, modification
 * REQ-024: Manager receives notifications when requests are assigned or overdue
 * REQ-030: All stakeholders notified when request is finalized
 */
@Injectable()
export class LeavesNotificationService {
  private readonly logger = new Logger(LeavesNotificationService.name);

  constructor(
    private readonly timeManagementNotificationService: TimeManagementNotificationService,
  ) {}

  /**
   * Send a single notification using time management service
   */
  private async send(
    recipientId: string,
    type: LeaveNotificationType | string,
    message: string,
  ): Promise<NotificationLogDocument> {
    const sent = await this.timeManagementNotificationService.send(
      new Types.ObjectId(recipientId),
      type,
      message,
    );
    this.logger.log(`[LEAVE_NOTIFICATION] ${type} sent to ${recipientId}`);
    return sent;
  }

  /**
   * Get notifications for a user
   * Delegates to time management notification service
   */
  async getNotificationsForUser(
    userId: string,
    options?: { limit?: number; skip?: number },
  ): Promise<NotificationLogDocument[]> {
    return this.timeManagementNotificationService.getNotificationsForUser(
      new Types.ObjectId(userId),
      options,
    );
  }

  /**
   * Get notification count for a user
   * Delegates to time management notification service
   */
  async getNotificationCount(userId: string): Promise<number> {
    return this.timeManagementNotificationService.getNotificationCount(
      new Types.ObjectId(userId),
    );
  }

  /**
   * Send multiple notifications at once
   */
  private async sendBatch(
    notifications: { recipientId: string; type: LeaveNotificationType | string; message: string }[],
  ): Promise<NotificationLogDocument[]> {
    const results: NotificationLogDocument[] = [];
    
    for (const notification of notifications) {
      const sent = await this.timeManagementNotificationService.send(
        new Types.ObjectId(notification.recipientId),
        notification.type,
        notification.message,
      );
      results.push(sent);
    }
    
    this.logger.log(`[LEAVE_BATCH_NOTIFICATION] Sent ${results.length} notifications`);
    return results;
  }

  /**
   * Generic notification sender with structured data
   * Used for custom notification types like irregular pattern flagging
   */
  async sendNotification(params: {
    recipientId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
  }): Promise<NotificationLogDocument | null> {
    // For special recipient types like 'hr_manager', we'd need to resolve the actual ID
    // For now, log it and skip if it's a placeholder
    if (params.recipientId === 'hr_manager') {
      this.logger.log(`[NOTIFICATION] HR Manager notification (not sent - needs resolution): ${params.message}`);
      // In a real implementation, you'd resolve the HR manager ID here
      return null;
    }

    const formattedMessage = `[${params.title}] ${params.message}`;
    const sent = await this.timeManagementNotificationService.send(
      new Types.ObjectId(params.recipientId),
      params.type,
      formattedMessage,
    );
    
    this.logger.log(`[NOTIFICATION] ${params.type} sent to ${params.recipientId}: ${params.title}`);
    return sent;
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
