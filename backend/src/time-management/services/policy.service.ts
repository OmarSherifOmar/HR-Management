import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceRecord } from '../models/attendance-record.schema';
import { ShiftAssignment } from '../models/shift-assignment.schema';
import { Holiday } from '../models/holiday.schema';
import { OvertimeRule } from '../models/overtime-rule.schema';
import { ShiftType } from '../models/shift-type.schema';
import { Shift } from '../models/shift.schema';
import { TimeException } from '../models/time-exception.schema';
import { NotificationLog } from '../models/notification-log.schema';
import { HolidayService } from './holiday.service';
import { ShiftAssignmentService } from './shift-assignment.service';
import { ShiftService } from './shift.service';
import { CorrectionService } from './correction.service';
import { AttendanceService } from './attendance.service';
import { NotificationService } from './notification.service';
import { startOfDay, endOfDay, buildDateFromShiftTime } from '../utils/time.utils';
import { TimeExceptionType } from '../models/enums';
import { CorrectionRequestStatus } from '../models/enums';
import { TimeExceptionStatus } from '../models/enums';

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);

  private readonly permissionLimits = {
  [TimeExceptionType.EARLY_LEAVE]: 180,
  [TimeExceptionType.OVERTIME_REQUEST]: 240, 
};

  constructor(
    @InjectModel(Shift.name) private shiftModel: Model<Shift>,
    @InjectModel(Holiday.name) private holidayModel: Model<Holiday>,
    @InjectModel(ShiftAssignment.name) private shiftAssignmentModel: Model<ShiftAssignment>,
    @InjectModel(AttendanceRecord.name) private attendanceRecordModel: Model<AttendanceRecord>,
    @InjectModel(OvertimeRule.name) private overtimeRuleModel: Model<OvertimeRule>,
    @InjectModel(TimeException.name) private timeExceptionModel: Model<TimeException>,
    private readonly shiftService: ShiftService,
    private readonly holidayService: HolidayService,
    private readonly shiftAssignmentService: ShiftAssignmentService,
    @Inject(forwardRef(() => AttendanceService))
    private readonly attendanceService: AttendanceService,
    private readonly correctionsService: CorrectionService,
    private readonly notificationService: NotificationService,
    //private readonly leaveService: LeaveService
  ) {}

  async isHolidayOrRestDay(employeeId: string | Types.ObjectId, date: Date): Promise<boolean> {
    const isHoliday = await this.holidayService.isHoliday(date);
    if (isHoliday) return true;

    const assignments = await this.shiftAssignmentService.getEmployeeActiveShift(employeeId, date);
    if (!assignments) return false;

    const restDays = await this.shiftService.getRestDaysForShift(assignments.shiftId);
    const dayOfWeek = date.getDay();
    return restDays.includes(dayOfWeek);
  }

  async calculateOvertimeAndShortTime(
    employeeId: string | Types.ObjectId,
    date: Date,
    punches: { type: 'IN' | 'OUT'; time: Date }[]
  ): Promise<{ overtimeMinutes: number; shortMinutes: number }> {
    const isHolidayOrRest = await this.isHolidayOrRestDay(employeeId, date);

    //assigned shift which tells us the start and end time and if we need approval for overtime
    const assignment = await this.shiftAssignmentService.getEmployeeActiveShift(employeeId, date);
    if (!assignment) { //if no assignment is assigned, then all worked time = overtime on holidays/rest days
      if (punches.length === 0) //if no punches, no overtime
        return { overtimeMinutes: 0, shortMinutes: 0 };

      const firstIn = punches.filter(p => p.type === 'IN').map(p => p.time).sort()[0]; //all clock ins (earliest)
      const lastOut = punches.filter(p => p.type === 'OUT').map(p => p.time).sort().reverse()[0]; //all clock outs (latest)
      const workedMinutes = Math.floor((lastOut.getTime() - firstIn.getTime()) / 60000); //in milliseconds -> minutes
      return { overtimeMinutes: isHolidayOrRest ? workedMinutes : 0, shortMinutes: 0 };
      //if holiday/rest then all workedtime = overtime
    }

    const shift = await this.shiftService.getById(assignment.shiftId);
    if (!shift) 
      return { overtimeMinutes: 0, shortMinutes: 0 };

    const shiftStart = buildDateFromShiftTime(date, shift.startTime);
    const shiftEnd = buildDateFromShiftTime(date, shift.endTime);
    const graceIn = shift.graceInMinutes ?? 0;
    const graceOut = shift.graceOutMinutes ?? 0;

    //makes sure we calcuated based on actual punches
    const ins = punches.filter(p => p.type === 'IN').map(p => p.time);
    const outs = punches.filter(p => p.type === 'OUT').map(p => p.time);
    const firstIn = ins.length > 0 ? new Date(Math.min(...ins.map(d => d.getTime()))) : null;
    const lastOut = outs.length > 0 ? new Date(Math.max(...outs.map(d => d.getTime()))) : null;

    if (!firstIn || !lastOut) 
      return { overtimeMinutes: 0, shortMinutes: 0 };

    const workedMinutes = Math.floor((lastOut.getTime() - firstIn.getTime()) / 60000); //actual worked min in a day
    const scheduledMinutes = Math.floor((shiftEnd.getTime() - shiftStart.getTime()) / 60000) + graceIn + graceOut; 
    //official scheduled min + grace periods

    let overtimeMinutes = 0;
    let shortMinutes = 0;

    //active HR-approved overtime rules
    const overtimeRules = await this.overtimeRuleModel.find({ active: true, approved: true });

    //determine if overtime is allowed
    const overtimeAllowed = isHolidayOrRest || (overtimeRules.length > 0 && shift.requiresApprovalForOvertime);

    //calculate overtime and short time based on rules
    if (overtimeAllowed) {
      if (workedMinutes > scheduledMinutes) {
        overtimeMinutes = workedMinutes - scheduledMinutes;
      } else if (workedMinutes < scheduledMinutes) {
        shortMinutes = scheduledMinutes - workedMinutes;
      }
    } else {
      if (workedMinutes < scheduledMinutes) {
        shortMinutes = scheduledMinutes - workedMinutes;
      }
    }
    return { overtimeMinutes, shortMinutes };
  }

  // Helper used by ReportsService to get scheduled minutes for a given shift assignment/date
  async getScheduledMinutesForAssignment(assignment: ShiftAssignment, date: Date): Promise<number> {
    const shift = await this.shiftService.getById(assignment.shiftId);
    if (!shift) return 0;

    const shiftStart = buildDateFromShiftTime(date, shift.startTime);
    const shiftEnd = buildDateFromShiftTime(date, shift.endTime);
    const graceIn = shift.graceInMinutes ?? 0;
    const graceOut = shift.graceOutMinutes ?? 0;

    const scheduledMinutes = Math.floor((shiftEnd.getTime() - shiftStart.getTime()) / 60000) + graceIn + graceOut;
    return scheduledMinutes;
  }

  /**
   * BR-TM-19: Check if employee is on approved leave for the given date
   */
  async isEmployeeOnLeave(employeeId: string | Types.ObjectId, date: Date): Promise<boolean> {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    // Check if shift assignment is marked as ON_LEAVE
    const shiftAssignment = await this.shiftAssignmentModel.findOne({
      employeeId,
      startDate: { $lte: dayEnd },
      $or: [{ endDate: { $exists: false } }, { endDate: { $gte: dayStart } }],
      status: 'ON_LEAVE',
    });
    
    if (shiftAssignment) {
      return true;
    }
    
    // Check if attendance record exists with zero punches (leave day marker)
    const attendanceRecord = await this.attendanceRecordModel.findOne({
      employeeId,
      date: { $gte: dayStart, $lte: dayEnd },
    });
    
    // Zero punches typically indicates leave or absence
    if (attendanceRecord && attendanceRecord.punches.length === 0) {
      return true;
    }
    
    return false;
  }

  async calcuateLateness(employeeId: string | Types.ObjectId, date: Date, punches: { type: 'IN' | 'OUT'; time: Date }[]): Promise<number> {
    // BR-TM-19: Suppress lateness calculation on holidays, rest days, or leave days
    const isHolidayOrRest = await this.isHolidayOrRestDay(employeeId, date);
    if (isHolidayOrRest) {
      this.logger.debug(`No lateness calculated - Holiday/Rest day for employee ${employeeId}`);
      return 0;
    }
    
    const isOnLeave = await this.isEmployeeOnLeave(employeeId, date);
    if (isOnLeave) {
      this.logger.debug(`No lateness calculated - Employee ${employeeId} is on leave`);
      return 0;
    }
    
    const assignment = await this.shiftAssignmentService.getEmployeeActiveShift(employeeId, date);
    if (!assignment) return 0; 

    const shift = await this.shiftService.getById(assignment.shiftId);
    if (!shift) return 0; 

    const ins = punches.filter(p => p.type === 'IN').map(p => p.time);  
    const firstIn = ins.length > 0 ? new Date(Math.min(...ins.map(d => d.getTime()))) : null;
    if (!firstIn) return 0; 

    const minutesLate = this.calculateLateness(shift, firstIn);
    return minutesLate;
  }

  async checkRepeatedLateness(employeeId: string | Types.ObjectId, days: number = 7): Promise<number> {
    const endDate = endOfDay(new Date());
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - days + 1);

    const records = await this.attendanceRecordModel.find({
      employeeId: employeeId,
      date: { $gte: startOfDay(startDate), $lte: endOfDay(endDate) }
    });

    let latenessCount = 0;
    for (const record of records) {
      const punches = record.punches.map(p => ({ type: p.type, time: p.time }));
      const recordDate = new Date(record.punches[0].time);
      const latenessMinutes = await this.calcuateLateness(employeeId, recordDate, punches);
      if(latenessMinutes > 0)
        latenessCount++;
    }

    //consider repeated lateness = time exception
    if (latenessCount > 0) {
      await this.timeExceptionModel.create({
        employeeId,
        type: TimeExceptionType.LATE,
        reason: `Repeated lateness: ${latenessCount} times in ${days} days`,
        status: TimeExceptionStatus.OPEN,
      });
    }

    return latenessCount;
  }

  async applyPenalty(employeeId: string | Types.ObjectId, date: Date, latenessMinutes: number): Promise<{ applied: boolean; latenessMinutes: number }> {
    // BR-TM-19: Suppress penalties on holidays, rest days, or leave days
    const isHolidayOrRest = await this.isHolidayOrRestDay(employeeId, date);
    if (isHolidayOrRest) {
      this.logger.log(`Penalty suppressed for employee ${employeeId} - Holiday/Rest Day`);
      return { applied: false, latenessMinutes: 0 };
    }
    
    const isOnLeave = await this.isEmployeeOnLeave(employeeId, date);
    if (isOnLeave) {
      this.logger.log(`Penalty suppressed for employee ${employeeId} - On approved leave`);
      return { applied: false, latenessMinutes: 0 };
    }
    
    const record = await this.attendanceService.getRecordForEmployeeByDate(employeeId.toString(), date);

    if(!record || !record.punches || record.punches.length === 0){
      return { applied: false, latenessMinutes: 0 }
    }

    const punches = record.punches.map(p => ({ type: p.type, time: p.time}));
    const minutesLate = await this.calcuateLateness(employeeId, date, punches);

    if(minutesLate <= 0){
      return { applied: false, latenessMinutes: 0}
    }

    const exists = await this.timeExceptionModel.findOne({employeeId, type: TimeExceptionType.LATE, attendanceRecordId: record._id});

    if (!exists) {
      await this.timeExceptionModel.create({employeeId, type: TimeExceptionType.LATE, attendanceRecordId: record._id, reason: `Late by ${latenessMinutes} minutes`});
  }

  return { applied: true, latenessMinutes };
  }

  async correctionRequestSubmission(employeeId: string | Types.ObjectId, date: Date, reason: string, punches: { type: 'IN' | 'OUT'; time: Date }[]) {
    const record = await this.attendanceService.getRecordForEmployeeByDate(employeeId.toString(), date);
    if (!record) 
      throw new NotFoundException('Attendance record not found');

    const reasonJson = JSON.stringify(punches);

    const request = await this.correctionsService.createRequest(employeeId.toString(), record._id.toString(), reasonJson);

    return request;
  }

  async correctionRequestApproval(requestId: string, approvedBy: string) {
    const request = await this.correctionsService.reviewRequest(requestId, CorrectionRequestStatus.APPROVED);
    return { approved: true, requestId: request._id.toString() };
  }

  async rejectCorrectionRequest(requestId: string, approvedBy: string, reason: string) {
    const request = await this.correctionsService.reviewRequest(requestId, CorrectionRequestStatus.REJECTED);
    return { rejected: true, requestId: request._id.toString(), reason };
  }

  async reviewTimeException(exceptionId: string, approved: boolean) {
    const exception = await this.timeExceptionModel.findById(exceptionId);
    if (!exception) 
      throw new NotFoundException('Time exception not found');

    exception.status = approved ? TimeExceptionStatus.APPROVED : TimeExceptionStatus.REJECTED;

    await exception.save();
    return exception;
  }

  async escalatePendingExceptions(cutoffDate: Date) {
    const pendingExceptions = await this.timeExceptionModel.find({
      status: TimeExceptionStatus.OPEN, 
      createdAt: { $lte: cutoffDate }
    }).populate('employeeId');

    for (const exception of pendingExceptions) {
      this.logger.warn(`Escalating Time Exception ${exception._id} for Employee ${exception.employeeId}`);

    if (exception.assignedTo) {
      await this.notificationService.send(
        exception.assignedTo,'Pending Time Exception',`Time exception for ${exception.employeeId} requires your review.`);
      }

    await exception.save();
}

  return pendingExceptions.length;
  }

  async getOvertimeReport(startDate: Date, endDate: Date) {
  
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    const records = await this.attendanceRecordModel.find({date: { $gte: start, $lte: end }});

    const report: {employeeId: Types.ObjectId; date: Date; overtimeMinutes: number; shortMinutes: number;}[] = [];

    for (const record of records) {
      const employeeId = record.employeeId;
      const punches = record.punches.map(p => ({ type: p.type, time: p.time }));
      const recordDate = punches.length ? punches[0].time : new Date();

      const { overtimeMinutes, shortMinutes } = await this.calculateOvertimeAndShortTime(employeeId, recordDate, punches);

      report.push({employeeId, date: recordDate, overtimeMinutes, shortMinutes});
}

  return report;
}

  async getAttendanceExceptions(startDate: Date, endDate: Date) {

    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    const exceptions = await this.timeExceptionModel.find({createdAt: { $gte: start, $lte: end }}).populate('employeeId');

    return exceptions.map(ex => ({
      employeeId: ex.employeeId,
      type: ex.type,
      status: ex.status,
      assignedTo: ex.assignedTo,
      reason: ex.reason,
      createdAt: (ex as any).createdAt,
    }));
}

  async validatePermission(employeeId: string, type: string, duration: number, date: Date) {
    const maxDuration = this.permissionLimits[type];
    if (!maxDuration) 
      throw new Error(`Unknown permission type: ${type}`);
    if (duration > maxDuration) 
      throw new Error(`Permission exceeds max allowed duration (${maxDuration} mins)`);

    await this.timeExceptionModel.create({
      employeeId,
      type: type === 'EARLY_LEAVE' ? TimeExceptionType.EARLY_LEAVE : TimeExceptionType.OVERTIME_REQUEST,
      reason: `${type} (${duration} mins)`,
      date,
      status: TimeExceptionStatus.APPROVED,
    });

    return true;
  }

  async syncWithPayroll() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Automatically escalate any pending time exceptions before syncing with payroll
  await this.escalatePendingExceptions(yesterday);

  const report = await this.getOvertimeReport(yesterday, yesterday);

  const payrollPayload = report.map(r => ({
    employeeId: r.employeeId.toString(),
    date: r.date,
    overtimeMinutes: r.overtimeMinutes,
    shortMinutes: r.shortMinutes,
  }));

  return payrollPayload;
  }

   //helper methods:
  private calculateLateness(shift: Shift, firstIn: Date) {
    const shiftStart = buildDateFromShiftTime(firstIn, shift.startTime);
    const graceIn = shift.graceInMinutes ?? 0;
    const diffMinutes = Math.floor((firstIn.getTime() - shiftStart.getTime()) / 60000);
    return diffMinutes > graceIn ? diffMinutes - graceIn : 0;
  }


  async isOvertimePreApproved(employeeId: string, date: Date, category: string): Promise<boolean> {
    const exists = await this.timeExceptionModel.exists({
      employeeId,
      type: TimeExceptionType.OVERTIME_REQUEST,
      category,
      date,
      status: TimeExceptionStatus.APPROVED,
    });
    return !!exists; //converts _id / null to boolean
  }


async sendMissedPunchAlerts(date: Date) {
  const start = startOfDay(date);
  const end = endOfDay(date);

  const missed = await this.timeExceptionModel.find({
    type: TimeExceptionType.MISSED_PUNCH,
    createdAt: { $gte: start, $lte: end },
    status: TimeExceptionStatus.OPEN
  }).populate('employeeId');

  for (const ex of missed) {
    const empId = ex.employeeId.toString();

    await this.notificationService.send(
      empId,
      'Missed Punch Detected',
      'You forgot to clock out today. Please submit a correction request.'
    );

    ex.status = TimeExceptionStatus.PENDING;
    await ex.save();
  }
}

}
