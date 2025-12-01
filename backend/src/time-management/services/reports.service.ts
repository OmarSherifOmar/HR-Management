// reports.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceRecord, AttendanceRecordDocument } from '../models/attendance-record.schema';
import { AttendanceCorrectionRequest, AttendanceCorrectionRequestDocument } from '../models/attendance-correction-request.schema';
import { TimeException, TimeExceptionDocument } from '../models/time-exception.schema';
import { TimeExceptionType, TimeExceptionStatus, CorrectionRequestStatus, PunchType } from '../models/enums';
import { startOfDay, endOfDay } from '../utils/time.utils';
import { PolicyService } from '../services/policy.service';
import { ShiftAssignmentService } from '../services/ShiftAssignmentService';

export interface OvertimeReportItem {
  employeeId: string;
  date: Date;
  scheduledMinutes: number;
  workedMinutes: number;
  overtimeMinutes: number;
  shortMinutes: number;
}

export interface ExceptionReportItem {
  employeeId: string;
  type: TimeExceptionType;
  status: TimeExceptionStatus;
  reason: string;
  attendanceRecordId?: string;
  createdAt: Date;
}

export interface PenaltyReportItem {
  employeeId: string;
  type: TimeExceptionType;
  reason: string;
  date: Date;
  resolved: boolean;
}

export interface AttendanceSummary {
  employeeId: string;
  totalDaysWorked: number;
  totalWorkMinutes: number;
  averageWorkMinutes: number;
  totalOvertimeMinutes: number;
  lateCount: number;
  missedPunchCount: number;
  earlyLeaveCount: number;
}

export interface DashboardAnalytics {
  totalEmployeesTracked: number;
  totalAttendanceRecords: number;
  totalExceptions: number;
  openExceptions: number;
  pendingCorrections: number;
  overtimeSummary: { totalMinutes: number; employeeCount: number };
  exceptionBreakdown: Record<string, number>;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectModel(AttendanceRecord.name)
    private attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(AttendanceCorrectionRequest.name)
    private correctionModel: Model<AttendanceCorrectionRequestDocument>,
    @InjectModel(TimeException.name)
    private exceptionModel: Model<TimeExceptionDocument>,
    private readonly policyService: PolicyService, // IMPORTANT: use real calculations
    private readonly shiftAssignmentService: ShiftAssignmentService,
  ) {}

  // -- Helper to fetch attendance records for range (optionally per employee) --
  private async fetchAttendanceRecords(startDate: Date, endDate: Date, employeeId?: string) {
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    const q: any = { 'punches.time': { $gte: start, $lte: end } };
    if (employeeId) q.employeeId = new Types.ObjectId(employeeId);
    return this.attendanceModel.find(q).lean();
  }

  // -- Overtime report using PolicyService calculations for accuracy --
  async getOvertimeReport(startDate: Date, endDate: Date, employeeId?: string): Promise<OvertimeReportItem[]> {
    const records = await this.fetchAttendanceRecords(startDate, endDate, employeeId);
    const report: OvertimeReportItem[] = [];

    for (const rec of records) {
      const punches = (rec.punches || []).map((p: any) => ({ type: p.type === PunchType.IN ? 'IN' : 'OUT', time: new Date(p.time) }));

      // choose record date as first punch day OR rec.date if present
      const recordDate = rec.date ? new Date(rec.date) : (punches.length ? new Date(punches[0].time) : null);
      if (!recordDate) continue;

      // delegate accurate calculation to PolicyService
      const { overtimeMinutes, shortMinutes } = await this.policyService.calculateOvertimeAndShortTime(rec.employeeId, recordDate, punches);

      // retrieve scheduled minutes from PolicyService / shift assignment (if available)
      const assignment = await this.shiftAssignmentService.getEmployeeActiveShift(rec.employeeId, recordDate);
      let scheduledMinutes = 0;
      if (assignment) {
        // PolicyService can expose a helper to get scheduled minutes; fallback to calculating via shift
        try {
          scheduledMinutes = await this.policyService.getScheduledMinutesForAssignment(assignment, recordDate);
        } catch {
          scheduledMinutes = 0;
        }
      }

      // compute worked minutes deterministically from punches
      const ins = punches.filter(p => p.type === 'IN').map(p => p.time);
      const outs = punches.filter(p => p.type === 'OUT').map(p => p.time);
      const firstIn = ins.length ? ins.reduce((a, b) => (a < b ? a : b)) : null;
      const lastOut = outs.length ? outs.reduce((a, b) => (a > b ? a : b)) : null;
      if (!firstIn || !lastOut) continue;
      const workedMinutes = Math.max(0, Math.floor((lastOut.getTime() - firstIn.getTime()) / 60000));

      // only include if overtime or short time exists
      if (overtimeMinutes > 0 || shortMinutes > 0) {
        report.push({
          employeeId: rec.employeeId.toString(),
          date: recordDate,
          scheduledMinutes,
          workedMinutes,
          overtimeMinutes,
          shortMinutes,
        });
      }
    }

    return report;
  }

  // -- Exception report (reads TimeException collection; robust null handling) --
  async getExceptionReport(
    startDate: Date,
    endDate: Date,
    type?: TimeExceptionType,
    status?: TimeExceptionStatus,
    employeeId?: string
  ): Promise<ExceptionReportItem[]> {
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    const q: any = { createdAt: { $gte: start, $lte: end } };
    if (type) q.type = type;
    if (status) q.status = status;
    if (employeeId) q.employeeId = new Types.ObjectId(employeeId);

    const exceptions = await this.exceptionModel.find(q).lean();
    return exceptions.map(ex => ({
      employeeId: ex.employeeId ? ex.employeeId.toString() : '',
      type: ex.type,
      status: ex.status,
      reason: ex.reason || '',
      attendanceRecordId: ex.attendanceRecordId ? ex.attendanceRecordId.toString() : undefined,
      createdAt: (ex as any).createdAt || new Date(),
    }));
  }

  // -- Penalty report (wraps exceptions that represent penalties) --
  async getPenaltyReport(startDate: Date, endDate: Date, employeeId?: string): Promise<PenaltyReportItem[]> {
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    const penaltyTypes = [TimeExceptionType.LATE, TimeExceptionType.MISSED_PUNCH, TimeExceptionType.EARLY_LEAVE, TimeExceptionType.SHORT_TIME];

    const q: any = { type: { $in: penaltyTypes }, createdAt: { $gte: start, $lte: end } };
    if (employeeId) q.employeeId = new Types.ObjectId(employeeId);

    const exceptions = await this.exceptionModel.find(q).lean();
    return exceptions.map(ex => ({
      employeeId: ex.employeeId ? ex.employeeId.toString() : '',
      type: ex.type,
      reason: ex.reason || '',
      date: (ex as any).createdAt || new Date(),
      resolved: ex.status === TimeExceptionStatus.RESOLVED || ex.status === TimeExceptionStatus.APPROVED,
    }));
  }

  // -- Attendance summary per employee using PolicyService to compute overtime/short time accurately --
  async getAttendanceSummary(startDate: Date, endDate: Date, employeeId?: string): Promise<AttendanceSummary[]> {
    const records = await this.fetchAttendanceRecords(startDate, endDate, employeeId);

    // group by employeeId
    const map = new Map<string, { records: any[]; exceptions: any[] }>();
    for (const r of records) {
      const emp = r.employeeId.toString();
      if (!map.has(emp)) map.set(emp, { records: [], exceptions: [] });
      map.get(emp)!.records.push(r);
    }

    const employeeIds = Array.from(map.keys()).map(id => new Types.ObjectId(id));
    const exceptions = await this.exceptionModel.find({
      employeeId: { $in: employeeIds }, createdAt: { $gte: startOfDay(startDate), $lte: endOfDay(endDate) }
    }).lean();

    for (const ex of exceptions) {
      const emp = ex.employeeId ? ex.employeeId.toString() : '';
      if (map.has(emp)) map.get(emp)!.exceptions.push(ex);
    }

    const summaries: AttendanceSummary[] = [];

    for (const [emp, data] of map.entries()) {
      let totalWorkMinutes = 0;
      let totalOvertimeMinutes = 0;
      let daysWorked = 0;

      for (const rec of data.records) {
        const punches = (rec.punches || []).map((p: any) => ({ type: p.type === PunchType.IN ? 'IN' : 'OUT', time: new Date(p.time) }));
        const recDate = rec.date ? new Date(rec.date) : (punches.length ? punches[0].time : null);
        if (!recDate) continue;

        // use PolicyService for accurate overtime/short time
        const { overtimeMinutes } = await this.policyService.calculateOvertimeAndShortTime(rec.employeeId, recDate, punches);
        // worked minutes
        const ins = punches.filter(p => p.type === 'IN').map(p => p.time);
        const outs = punches.filter(p => p.type === 'OUT').map(p => p.time);
        const firstIn = ins.length ? ins.reduce((a, b) => (a < b ? a : b)) : null;
        const lastOut = outs.length ? outs.reduce((a, b) => (a > b ? a : b)) : null;
        if (!firstIn || !lastOut) continue;

        const worked = Math.max(0, Math.floor((lastOut.getTime() - firstIn.getTime()) / 60000));
        totalWorkMinutes += worked;
        totalOvertimeMinutes += Math.max(0, overtimeMinutes);
        daysWorked++;
      }

      const lateCount = data.exceptions.filter(e => e.type === TimeExceptionType.LATE).length;
      const missedPunchCount = data.exceptions.filter(e => e.type === TimeExceptionType.MISSED_PUNCH).length;
      const earlyLeaveCount = data.exceptions.filter(e => e.type === TimeExceptionType.EARLY_LEAVE).length;

      summaries.push({
        employeeId: emp,
        totalDaysWorked: daysWorked,
        totalWorkMinutes,
        averageWorkMinutes: daysWorked > 0 ? Math.round(totalWorkMinutes / daysWorked) : 0,
        totalOvertimeMinutes,
        lateCount,
        missedPunchCount,
        earlyLeaveCount,
      });
    }

    return summaries;
  }

  // -- Dashboard analytics, consistent with PolicyService results --
  async getDashboardAnalytics(startDate: Date, endDate: Date): Promise<DashboardAnalytics> {
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    const attendanceRecords = await this.attendanceModel.find({ 'punches.time': { $gte: start, $lte: end } }).lean();
    const uniqueEmployees = new Set(attendanceRecords.map(r => r.employeeId.toString()));

    const exceptions = await this.exceptionModel.find({ createdAt: { $gte: start, $lte: end } }).lean();
    const openExceptions = exceptions.filter(e => e.status === TimeExceptionStatus.OPEN || e.status === TimeExceptionStatus.PENDING).length;

    const exceptionBreakdown: Record<string, number> = {};
    for (const ex of exceptions) {
      const k = String(ex.type);
      exceptionBreakdown[k] = (exceptionBreakdown[k] || 0) + 1;
    }

    let totalOvertimeMinutes = 0;
    const employeesWithOvertime = new Set<string>();

    for (const rec of attendanceRecords) {
      const punches = (rec.punches || []).map((p: any) => ({ type: p.type === PunchType.IN ? 'IN' : 'OUT', time: new Date(p.time) }));
      const recDate = rec.date ? new Date(rec.date) : (punches.length ? punches[0].time : null);
      if (!recDate) continue;
      const { overtimeMinutes } = await this.policyService.calculateOvertimeAndShortTime(rec.employeeId, recDate, punches);
      if (overtimeMinutes > 0) {
        totalOvertimeMinutes += overtimeMinutes;
        employeesWithOvertime.add(rec.employeeId.toString());
      }
    }

    const pendingCorrections = await this.correctionModel.countDocuments({
      status: { $in: [CorrectionRequestStatus.SUBMITTED, CorrectionRequestStatus.IN_REVIEW] }
    });

    return {
      totalEmployeesTracked: uniqueEmployees.size,
      totalAttendanceRecords: attendanceRecords.length,
      totalExceptions: exceptions.length,
      openExceptions,
      pendingCorrections,
      overtimeSummary: { totalMinutes: totalOvertimeMinutes, employeeCount: employeesWithOvertime.size },
      exceptionBreakdown,
    };
  }

  // -- CSV Exports (use the accurate report generators above) --
  async exportOvertimeReportCSV(startDate: Date, endDate: Date, employeeId?: string): Promise<string> {
    const report = await this.getOvertimeReport(startDate, endDate, employeeId);
    const headers = 'Employee ID,Date,Scheduled Minutes,Worked Minutes,Overtime Minutes,Short Minutes\n';
    const rows = report.map(r => `${r.employeeId},${r.date.toISOString()},${r.scheduledMinutes},${r.workedMinutes},${r.overtimeMinutes},${r.shortMinutes || 0}`).join('\n');
    return headers + rows;
  }

  async exportExceptionReportCSV(startDate: Date, endDate: Date): Promise<string> {
    const report = await this.getExceptionReport(startDate, endDate);
    const headers = 'Employee ID,Type,Status,Reason,Attendance Record ID,Created At\n';
    const rows = report.map(r => `${r.employeeId},${r.type},${r.status},"${(r.reason || '').replace(/"/g, '""')}",${r.attendanceRecordId || ''},${r.createdAt.toISOString()}`).join('\n');
    return headers + rows;
  }

  async exportPenaltyReportCSV(startDate: Date, endDate: Date): Promise<string> {
    const report = await this.getPenaltyReport(startDate, endDate);
    const headers = 'Employee ID,Type,Reason,Date,Resolved\n';
    const rows = report.map(r => `${r.employeeId},${r.type},"${(r.reason || '').replace(/"/g, '""')}",${r.date.toISOString()},${r.resolved}`).join('\n');
    return headers + rows;
  }

  async exportAttendanceSummaryCSV(startDate: Date, endDate: Date, employeeId?: string): Promise<string> {
    const report = await this.getAttendanceSummary(startDate, endDate, employeeId);
    const headers = 'Employee ID,Days Worked,Total Work Minutes,Avg Work Minutes,Overtime Minutes,Late Count,Missed Punch Count,Early Leave Count\n';
    const rows = report.map(r => `${r.employeeId},${r.totalDaysWorked},${r.totalWorkMinutes},${r.averageWorkMinutes},${r.totalOvertimeMinutes},${r.lateCount},${r.missedPunchCount},${r.earlyLeaveCount}`).join('\n');
    return headers + rows;
  }
}
