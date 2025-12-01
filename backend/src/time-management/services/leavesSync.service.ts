import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceRecord, AttendanceRecordDocument } from '../models/attendance-record.schema';
import { ShiftAssignment, ShiftAssignmentDocument } from '../models/shift-assignment.schema';
import { NotificationService } from './notification.service';
import { LeavesService } from './leaves.service';
import { startOfDay, endOfDay } from '../utils/time.utils';

@Injectable()
export class LeaveSyncService {
  private readonly logger = new Logger(LeaveSyncService.name);

  constructor(
    @InjectModel(AttendanceRecord.name) private attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(ShiftAssignment.name) private shiftAssignmentModel: Model<ShiftAssignmentDocument>,
    private readonly notificationService: NotificationService,
    private readonly leavesService: LeavesService
  ) {}

  async syncEmployeeLeaves(employeeId: string | Types.ObjectId, from: Date, to: Date) {
    const employeeObjId = typeof employeeId === 'string' ? new Types.ObjectId(employeeId) : employeeId;

    const approvedLeaves = await this.leavesService.getApprovedLeaves(employeeObjId, from, to);

    for (const leave of approvedLeaves) {
      const leaveDays = this._getDateRange(startOfDay(leave.dates.from), endOfDay(leave.dates.to));

      for (const day of leaveDays) {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const record = await this.attendanceModel.findOne({
          employeeId: employeeObjId,
          date: { $gte: dayStart, $lte: dayEnd },
        });

        if (record) {
          record.punches = [];
          record.totalWorkMinutes = 0;
          record.finalisedForPayroll = false;
          await record.save();
        } else {
          await this.attendanceModel.create({
            employeeId: employeeObjId,
            punches: [],
            totalWorkMinutes: 0,
            finalisedForPayroll: false,
          });
        }

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
          this.logger.debug('Failed to mark shift as ON_LEAVE', err as any);
        }

        try {
          await this.notificationService.send(
            employeeObjId,
            'LEAVE_APPLIED',
            `Leave approved for ${dayStart.toISOString().slice(0,10)}`
          );
        } catch (err) {
          this.logger.error('Failed to send leave notification', err as any);
        }
      }
    }
    return { syncedLeaves: approvedLeaves.length };
  }

  //helper
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
