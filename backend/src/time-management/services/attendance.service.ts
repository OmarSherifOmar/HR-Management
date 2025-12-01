import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceRecord, AttendanceRecordDocument } from '../models/attendance-record.schema';
import { ShiftAssignment, ShiftAssignmentDocument } from '../models/shift-assignment.schema';
import { PunchType, TimeExceptionType, PunchPolicy } from '../models/enums';
import { TimeException, TimeExceptionDocument } from '../models/time-exception.schema';
import { ShiftService } from './shift.service';
import { HolidayService } from './holiday.service';
import { ShiftAssignmentService } from './ShiftAssignmentService';
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
    private readonly policyService: PolicyService,
  ) {}


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
      record = new this.attendanceModel({ employeeId, punches: [] });
    }

    // TODO integrate policies
    let shiftDoc: any = null;
    if (assignment) {
      shiftDoc = await this.shiftService.getById(assignment.shiftId);
    }

    // determine punch policy (safe fallback to FIRST_LAST)
    const policy = (shiftDoc && shiftDoc.punchPolicy) ? shiftDoc.punchPolicy : PunchPolicy.FIRST_LAST;

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
    return record;
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
    const outPolicy = (shiftDoc && shiftDoc.punchPolicy) ? shiftDoc.punchPolicy : PunchPolicy.FIRST_LAST;

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
    return record;
  }

  async getRecordForEmployeeByDate(employeeIdRaw: string, date: Date) {
    const employeeId = new Types.ObjectId(employeeIdRaw);
    const start = startOfDay(date);
    const end = endOfDay(date);
    return this.attendanceModel.findOne({ employeeId, 'punches.time': { $gte: start, $lte: end } });
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
}
