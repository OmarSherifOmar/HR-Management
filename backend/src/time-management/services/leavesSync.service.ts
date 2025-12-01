import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceRecord } from '../models/attendance-record.schema';
import { ShiftAssignment } from '../models/shift-assignment.schema';
import { NotificationLog } from '../models/notification-log.schema';
import { NotificationService } from './notification.service';
//import { LeavesService } from '../leaves.service';
import { startOfDay, endOfDay } from '../utils/time.utils';

@Injectable()
export class LeaveSyncService {
  private readonly logger = new Logger(LeaveSyncService.name);

  constructor(
    @InjectModel(AttendanceRecord.name) private attendanceModel: Model<AttendanceRecord>,
    @InjectModel(ShiftAssignment.name) private shiftAssignmentModel: Model<ShiftAssignment>,
    @InjectModel(NotificationLog.name) private notificationModel: Model<NotificationLog>,
    private readonly notificationService: NotificationService,
  ) {}

  async applyLeave(employeeId: string | Types.ObjectId, from: Date, to: Date, leaveType?: string, metadata?: any) {
    const days = this._getDateRange(startOfDay(from), endOfDay(to));
    const employeeObjId = typeof employeeId === 'string' ? new Types.ObjectId(employeeId) : employeeId as Types.ObjectId;

    for (const day of days) {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const existing = await this.attendanceModel.findOne({ employeeId: employeeObjId, date: { $gte: dayStart, $lte: dayEnd } });

      if (existing) {
        existing.isLeave = true;
        existing.leaveType = leaveType ?? existing.leaveType;
        existing.totalWorkMinutes = 0;

        (existing as any).finalisedForPayroll = false;
        await existing.save();
      } else {
        await this.attendanceModel.create({
          employeeId: employeeObjId,
          date: dayStart,
          isLeave: true,
          leaveType,
          punches: [],
          totalWorkMinutes: 0,
          finalisedForPayroll: false,
        } as any);
      }

      //for updating the shift assignments
      try {
        await this.shiftAssignmentModel.updateMany(
          {
            employeeId: employeeObjId,
            startDate: { $lte: dayEnd },
            $or: [{ endDate: { $exists: false } }, { endDate: { $gte: dayStart } }],
          },
          { $set: { status: 'ON_LEAVE' } }
        );
      } catch (err) {
        this.logger.debug('No shift assignment to mark as ON_LEAVE or update failed', err as any);
      }

      //notification to infrom higher position
      try {
        await this.notificationService.send(
          employeeObjId,
          'LEAVE_APPLIED',
          `Leave approved for ${dayStart.toISOString().slice(0,10)}${leaveType ? ` (${leaveType})` : ''}`
        );
      } catch (err) {
        this.logger.error('Failed to send leave notification', err as any);
      }
    }

    return { applied: days.length };
  }
  //revoke leave after a certain date range
  async revokeLeave(employeeId: string | Types.ObjectId, from: Date, to: Date) {
    const days = this._getDateRange(startOfDay(from), endOfDay(to));
    const employeeObjId = typeof employeeId === 'string' ? new Types.ObjectId(employeeId) : employeeId as Types.ObjectId;

    for (const day of days) {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const existing = await this.attendanceModel.findOne({ employeeId: employeeObjId, date: { $gte: dayStart, $lte: dayEnd } });
      if (existing) {
        existing.isLeave = false;
        existing.leaveType = undefined;
        // leave punches and work minutes as-is (or you can nullify)
        (existing as any).finalisedForPayroll = false;
        await existing.save();
      }

      try {
        await this.shiftAssignmentModel.updateMany(
          {
            employeeId: employeeObjId,
            startDate: { $lte: dayEnd },
            $or: [{ endDate: { $exists: false } }, { endDate: { $gte: dayStart } }],
          },
          { $set: { status: 'ACTIVE' } } // change to whatever your default is
        );
      } catch (err) {
        this.logger.debug('Failed to restore shift assignment status for revokeLeave', err as any);
      }

      try {
        await this.notificationService.send(
          employeeObjId,
          'LEAVE_REVOKED',
          `Leave revoked for ${dayStart.toISOString().slice(0,10)}`
        );
      } catch (err) {
        this.logger.error('Failed to send revoke notification', err as any);
      }
    }

    return { revoked: days.length };
  }

  async isEmployeeOnLeave(employeeId: string | Types.ObjectId, date: Date): Promise<boolean> {
    const start = startOfDay(date);
    const end = endOfDay(date);
    const employeeObjId = typeof employeeId === 'string' ? new Types.ObjectId(employeeId) : employeeId as Types.ObjectId;

    const exists = await this.attendanceModel.exists({
      employeeId: employeeObjId,
      date: { $gte: start, $lte: end },
      isLeave: true,
    });

    return !!exists;
  }

  //helper method
  private _getDateRange(start: Date, end: Date): Date[] {
    const days: Date[] = [];
    const cur = new Date(start);
    cur.setHours(0,0,0,0);
    const last = new Date(end);
    last.setHours(0,0,0,0);

    while (cur <= last) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }
}
