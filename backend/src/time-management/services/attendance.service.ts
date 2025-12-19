import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceRecord, AttendanceRecordDocument } from '../models/attendance-record.schema';
import { ShiftAssignment, ShiftAssignmentDocument } from '../models/shift-assignment.schema';
import { PunchType, TimeExceptionType, PunchPolicy } from '../models/enums';
import { TimeException, TimeExceptionDocument } from '../models/time-exception.schema';
import { ShiftService } from './shift.service';
import { HolidayService } from './holiday.service';
import { ShiftAssignmentService } from './shift-assignment.service';
import { startOfDay, endOfDay, buildDateFromShiftTime } from '../utils/time.utils';
import { PolicyService } from './policy.service';

type Punch = { type: PunchType; time: Date };

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectModel(AttendanceRecord.name) private attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(TimeException.name) private exceptionModel: Model<TimeExceptionDocument>,
    private readonly shiftService: ShiftService,
    private readonly holidayService: HolidayService,
    private readonly shiftAssignmentService: ShiftAssignmentService,
    @Inject(forwardRef(() => PolicyService))
    private readonly policyService: PolicyService,
  ) {}


  // Helper to transform record for frontend
  private transformRecord(record: any) {
    if (!record) return null;
    const recordObj = record.toObject ? record.toObject() : record;
    const punches = recordObj.punches || [];
    
    // Create a copy and sort punches by time
    const sortedPunches = [...punches].sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());
    
    const inPunch = sortedPunches.find((p: any) => p.type === PunchType.IN);
    // Create another copy for reverse to avoid mutating the sorted array
    const outPunch = [...sortedPunches].reverse().find((p: any) => p.type === PunchType.OUT);
    
    const lastPunch = sortedPunches.length > 0 ? sortedPunches[sortedPunches.length - 1] : null;
    const status = lastPunch ? lastPunch.type : 'OUT';

    return {
        ...recordObj,
        clockInTime: inPunch ? inPunch.time : null,
        clockOutTime: outPunch ? outPunch.time : null,
        status,
    };
  }

  // Clock-in: enforces punch policy and computes lateness
  async clockIn(employeeIdRaw: string, time?: Date) {
    const timeVal = time ?? new Date();
    const employeeId = new Types.ObjectId(employeeIdRaw);

    const assignment = await this.shiftAssignmentService.getEmployeeActiveShift(employeeId, timeVal as Date);
    const isHoliday = await this.holidayService.isHoliday(timeVal);

    const start = startOfDay(timeVal);
    const end = endOfDay(timeVal);

    // find or create today's attendance record by punches range
    let record = await this.attendanceModel.findOne({ employeeId, 'punches.time': { $gte: start, $lte: end } });
    if (!record) {
      record = new this.attendanceModel({ employeeId, date: start, punches: [] });
    }

    // TODO integrate policies
    let shiftDoc: any = null;
    if (assignment) {
      shiftDoc = await this.shiftService.getById(assignment.shiftId);
    }

    // determine punch policy (safe fallback to MULTIPLE for flexibility)
    const policy = (shiftDoc && shiftDoc.punchPolicy) ? shiftDoc.punchPolicy : PunchPolicy.MULTIPLE;

    // Enforce Phase-2 policies: MULTIPLE or FIRST_LAST (ONLY_FIRST treated like FIRST_LAST)
    if (policy === PunchPolicy.MULTIPLE) {
      // allow multiple INs
      record.punches.push({ type: PunchType.IN, time: timeVal });
    } else {
      // FIRST_LAST behaviour: keep the earliest IN of the day
      const inPunches = record.punches.filter((p: any) => p.type === PunchType.IN).map((p: any) => new Date(p.time));
      if (inPunches.length === 0) {
        record.punches.push({ type: PunchType.IN, time: timeVal });
      } else {
        const firstIn = inPunches.reduce((a, b) => (a < b ? a : b));
        if (timeVal.getTime() < firstIn.getTime()) {
          // replace the earliest IN with this earlier time
          const earliestIdx = record.punches.findIndex((p: any) => p.type === PunchType.IN && new Date(p.time).getTime() === firstIn.getTime());
          if (earliestIdx >= 0) record.punches[earliestIdx].time = timeVal;
        }
        // otherwise ignore additional INs for FIRST_LAST
      }
    }

    // compute lateness if we have shift and not holiday
    if (shiftDoc && !isHoliday) {
      const shiftStart = buildDateFromShiftTime(timeVal, shiftDoc.startTime);

      const latenessMinutes = Math.max(0, Math.floor((timeVal.getTime() - shiftStart.getTime()) / 60000));
      if (latenessMinutes > (shiftDoc.graceInMinutes ?? 0)) {
        record.hasMissedPunch = true; // reuse field as an indicator of lateness/missed
        // create a TimeException for lateness using enum and avoid duplicates
        const assignedTo = (assignment as any)?.managerId ?? employeeId;
        const exists = await this.exceptionModel.findOne({ employeeId, attendanceRecordId: record._id, type: TimeExceptionType.LATE });
        if (!exists) {
          await this.exceptionModel.create({ employeeId, type: TimeExceptionType.LATE, attendanceRecordId: record._id, assignedTo, reason: `Late by ${latenessMinutes} minutes` });
        }
      }
    }

    await record.save();
    return this.transformRecord(record);
  }

  // Clock-out: requires an existing clock-in
  async clockOut(employeeIdRaw: string, time?: Date) {
    const timeVal = time ?? new Date();
    const employeeId = new Types.ObjectId(employeeIdRaw);

    const start = startOfDay(timeVal);
    const end = endOfDay(timeVal);

    const record = await this.attendanceModel.findOne({ employeeId, 'punches.time': { $gte: start, $lte: end } });
    if (!record) throw new NotFoundException('No clock-in found for today');

    // ensure there is at least one IN before allowing OUT
    const hasIn = record.punches.find((p: any) => p.type === PunchType.IN);
    if (!hasIn) throw new NotFoundException('No clock-in found for today');

    // determine policy (fetch assignment/shift safely)
    const assignment = await this.shiftAssignmentService.getEmployeeActiveShift(employeeId, timeVal as Date);
    let shiftDoc: any = null;
    if (assignment) {
      shiftDoc = await this.shiftService.getById(assignment.shiftId);
    }
    const outPolicy = (shiftDoc && shiftDoc.punchPolicy) ? shiftDoc.punchPolicy : PunchPolicy.MULTIPLE;

    if (outPolicy === PunchPolicy.MULTIPLE) {
      // allow multiple OUTs
      record.punches.push({ type: PunchType.OUT, time: timeVal });
    } else {
      // FIRST_LAST behaviour: keep the latest OUT of the day
      const outs = record.punches.filter((p: any) => p.type === PunchType.OUT).map((p: any) => new Date(p.time));
      if (outs.length === 0) {
        record.punches.push({ type: PunchType.OUT, time: timeVal });
      } else {
        const lastOut = outs.reduce((a, b) => (a > b ? a : b));
        if (timeVal.getTime() > lastOut.getTime()) {
          // replace the latest OUT with this later time
          let lastIdx = -1;
          for (let i = record.punches.length - 1; i >= 0; i--) {
            const p: any = record.punches[i];
            if (p.type === PunchType.OUT && new Date(p.time).getTime() === lastOut.getTime()) {
              lastIdx = i;
              break;
            }
          }
          if (lastIdx >= 0) record.punches[lastIdx].time = timeVal;
        }
        // otherwise ignore earlier OUTs for FIRST_LAST
      }
    }

    // compute work minutes roughly using first IN and last OUT
    const ins = record.punches.filter((p: any) => p.type === PunchType.IN).map((p: any) => new Date(p.time));
    const outs = record.punches.filter((p: any) => p.type === PunchType.OUT).map((p: any) => new Date(p.time));
    const firstIn = ins.length ? ins.reduce((a, b) => (a < b ? a : b)) : null;
    const lastOut = outs.length ? outs.reduce((a, b) => (a > b ? a : b)) : null;

    if (firstIn && lastOut) {
      const worked = Math.max(0, Math.floor((lastOut.getTime() - firstIn.getTime()) / 60000));
      // @ts-ignore
      record.totalWorkMinutes = worked;
    }

    await record.save();
    return this.transformRecord(record);
  }

  async getRecordForEmployeeByDate(employeeIdRaw: string, date: Date) {
    const employeeId = new Types.ObjectId(employeeIdRaw);
    const start = startOfDay(date);
    const end = endOfDay(date);
    const record = await this.attendanceModel.findOne({ employeeId, 'punches.time': { $gte: start, $lte: end } });
    return this.transformRecord(record);
  }

  // Get attendance history for an employee within a date range
  async getHistoryForEmployee(employeeIdRaw: string, startDate: Date, endDate: Date) {
    const employeeId = new Types.ObjectId(employeeIdRaw);
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    const records = await this.attendanceModel
      .find({ employeeId, 'punches.time': { $gte: start, $lte: end } })
      .sort({ date: -1 });
    return records.map((r) => this.transformRecord(r));
  }

  // scheduled check for missed punches 
  async flagMissedPunchesForDay(date: Date) {
    const start = startOfDay(date);
    const end = endOfDay(date);
    // find records that have at least one IN punch in the day
    const records = await this.attendanceModel.find({ punches: { $elemMatch: { type: PunchType.IN, time: { $gte: start, $lte: end } } } });
    for (const r of records) {
      const hasOut = r.punches.find((p: any) => p.type === PunchType.OUT && new Date(p.time) >= start && new Date(p.time) <= end);
      if (!hasOut) {
        // avoid duplicate exceptions
        const exists = await this.exceptionModel.findOne({ attendanceRecordId: r._id, type: TimeExceptionType.MISSED_PUNCH });
        if (!exists) {
          await this.exceptionModel.create({ employeeId: r.employeeId, type: TimeExceptionType.MISSED_PUNCH, attendanceRecordId: r._id, assignedTo: r.employeeId, reason: 'Missing clock-out' });
        }
      }
    }
    await this.policyService.sendMissedPunchAlerts(date);
  }

  /**
   * FR-TM-16: Integrated Attendance + Leave View
   * Returns attendance records and approved leave days for the date range
   */
  async getIntegratedAttendanceLeaveView(startDate: Date, endDate: Date, employeeId?: string) {
    const query: any = {
      date: { $gte: startDate, $lte: endDate }
    };
    
    if (employeeId) {
      query.employeeId = new Types.ObjectId(employeeId);
    }

    // Fetch attendance records
    const attendanceRecords = await this.attendanceModel.find(query)
      .populate('employeeId', 'firstName lastName employeeNumber')
      .sort({ date: 1 })
      .lean();

    // Fetch approved leave requests from leaves subsystem via HTTP or direct DB access
    // For now, we'll check shift assignments marked as ON_LEAVE (synced by leavesSync.service)
    const shiftAssignments = await this.shiftAssignmentService.getAssignmentsInRange(startDate, endDate, employeeId);
    
    const leaveDays = shiftAssignments
      .filter((sa: any) => sa.status === 'ON_LEAVE')
      .map((sa: any) => ({
        employeeId: sa.employeeId,
        date: sa.startDate,
        endDate: sa.endDate,
        status: 'ON_LEAVE',
        type: 'APPROVED_LEAVE'
      }));

    return {
      attendanceRecords: attendanceRecords.map(record => ({
        _id: record._id,
        employeeId: record.employeeId,
        date: record.date,
        punches: record.punches,
        totalWorkMinutes: record.totalWorkMinutes,
      })),
      leaveDays,
      dateRange: { start: startDate, end: endDate }
    };
  }
}
