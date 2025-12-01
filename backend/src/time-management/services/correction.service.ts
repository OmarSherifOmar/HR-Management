import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceCorrectionRequest, AttendanceCorrectionRequestDocument } from '../models/attendance-correction-request.schema';
import { AttendanceRecord, AttendanceRecordDocument } from '../models/attendance-record.schema';
import { CorrectionRequestStatus, PunchType, TimeExceptionType, TimeExceptionStatus } from '../models/enums';
import { TimeException, TimeExceptionDocument } from '../models/time-exception.schema';
import { NotificationService } from './notification.service';

@Injectable()
export class CorrectionService {
  private readonly logger = new Logger(CorrectionService.name);

  constructor(
    @InjectModel(AttendanceCorrectionRequest.name)
    private correctionModel: Model<AttendanceCorrectionRequestDocument>,
    @InjectModel(AttendanceRecord.name)
    private attendanceModel: Model<AttendanceRecordDocument>,
    @InjectModel(TimeException.name)
    private exceptionModel: Model<TimeExceptionDocument>,
    private readonly notificationService: NotificationService,
  ) {}

  async createRequest(employeeId: string, attendanceRecordId: string, reason?: string) {
    const req = new this.correctionModel({
      employeeId: new Types.ObjectId(employeeId),
      attendanceRecord: new Types.ObjectId(attendanceRecordId),
      reason,
      status: CorrectionRequestStatus.SUBMITTED,
    });
    await req.save();
    return req;
  }

  // review and optionally apply approved corrections
  async reviewRequest(id: string, status: CorrectionRequestStatus) {
    const req = await this.correctionModel.findById(id);
    if (!req) throw new NotFoundException('Correction request not found');

    // if approving, attempt to apply the correction to the attendance record
    if (status === CorrectionRequestStatus.APPROVED) {
      try {
        const attendanceId = (req.attendanceRecord as any)?._id ?? req.attendanceRecord;
        const rec = await this.attendanceModel.findById(attendanceId);
        if (!rec) throw new NotFoundException('Associated attendance record not found');

        if (req.reason) {
          // reason is expected to optionally contain a JSON array of punches
          // e.g. [{"type":"IN","time":"2025-11-28T08:00:00.000Z"},...]
          let parsed: any = null;
          try {
            parsed = JSON.parse(req.reason);
          } catch (e) {
            this.logger.debug('Correction reason not JSON; skipping auto-apply');
          }

          if (Array.isArray(parsed)) {
            const newPunches = parsed
              .map((p: any) => {
                if (!p || !p.type || !p.time) return null;
                const t = new Date(p.time);
                if (Number.isNaN(t.getTime())) return null;
                const typ = (p.type === 'IN' || p.type === PunchType.IN) ? PunchType.IN : PunchType.OUT;
                return { type: typ, time: t };
              })
              .filter((x: any) => x !== null);

            if (newPunches.length) {
              // replace punches with the provided set
              rec.punches = newPunches as any;

              // recompute totalWorkMinutes using first IN and last OUT
              const ins = rec.punches.filter((p: any) => p.type === PunchType.IN).map((p: any) => new Date(p.time));
              const outs = rec.punches.filter((p: any) => p.type === PunchType.OUT).map((p: any) => new Date(p.time));
              const firstIn = ins.length ? ins.reduce((a: Date, b: Date) => (a < b ? a : b)) : null;
              const lastOut = outs.length ? outs.reduce((a: Date, b: Date) => (a > b ? a : b)) : null;
              if (firstIn && lastOut) {
                // @ts-ignore
                rec.totalWorkMinutes = Math.max(0, Math.floor((lastOut.getTime() - firstIn.getTime()) / 60000));
              }
              // when corrections are applied, mark finalisedForPayroll false to allow review
              // @ts-ignore optional field
              rec.finalisedForPayroll = false;
              await rec.save();
            }
          }
        }
      } catch (err) {
        this.logger.error('Failed to auto-apply correction', err as any);
        // continue — still update request status
      }
    }

    req.status = status;
    // record reviewer timestamp if available
    (req as any).reviewedAt = new Date();
    await req.save();

    // Log audit entry for correction review
    await this.notificationService.send(
      req.employeeId.toString(),
      'CORRECTION_REVIEWED',
      `Correction request ${id} was ${status.toLowerCase()}`
    );

    return req;
  }

  /**
   * Reviews and corrects attendance for missing or invalid punches.
   * Stores corrected attendance record and updates audit log.
   */
  async reviewAndCorrectAttendance(
    attendanceRecordId: string,
    correctedPunches: { type: 'IN' | 'OUT'; time: Date }[],
    reviewerId: string,
    reason: string
  ) {
    const record = await this.attendanceModel.findById(attendanceRecordId);
    if (!record) throw new NotFoundException('Attendance record not found');

    // Store original punches for audit
    const originalPunches = JSON.stringify(record.punches);

    // Validate and apply corrected punches
    const validatedPunches = correctedPunches
      .map((p) => {
        const t = new Date(p.time);
        if (Number.isNaN(t.getTime())) return null;
        const typ = p.type === 'IN' ? PunchType.IN : PunchType.OUT;
        return { type: typ, time: t };
      })
      .filter((x) => x !== null);

    if (validatedPunches.length === 0) {
      throw new Error('No valid punches provided for correction');
    }

    // Check for missing punches (e.g., IN without OUT or vice versa)
    const hasIn = validatedPunches.some((p) => p!.type === PunchType.IN);
    const hasOut = validatedPunches.some((p) => p!.type === PunchType.OUT);

    if (!hasIn || !hasOut) {
      this.logger.warn(`Corrected record ${attendanceRecordId} still has incomplete punches`);
    }

    // Apply corrected punches
    record.punches = validatedPunches as any;

    // Recompute totalWorkMinutes
    const ins = record.punches.filter((p: any) => p.type === PunchType.IN).map((p: any) => new Date(p.time));
    const outs = record.punches.filter((p: any) => p.type === PunchType.OUT).map((p: any) => new Date(p.time));
    const firstIn = ins.length ? ins.reduce((a: Date, b: Date) => (a < b ? a : b)) : null;
    const lastOut = outs.length ? outs.reduce((a: Date, b: Date) => (a > b ? a : b)) : null;

    if (firstIn && lastOut) {
      // @ts-ignore
      record.totalWorkMinutes = Math.max(0, Math.floor((lastOut.getTime() - firstIn.getTime()) / 60000));
    }

    // Mark for payroll review
    // @ts-ignore optional field
    record.finalisedForPayroll = false;
    record.hasMissedPunch = false;

    await record.save();

    // Resolve any related MISSED_PUNCH exceptions
    await this.exceptionModel.updateMany(
      { attendanceRecordId: record._id, type: TimeExceptionType.MISSED_PUNCH },
      { status: TimeExceptionStatus.RESOLVED }
    );

    // Log audit entry
    await this.notificationService.send(
      record.employeeId.toString(),
      'ATTENDANCE_CORRECTED',
      `Attendance corrected by ${reviewerId}. Reason: ${reason}. Original: ${originalPunches}`
    );

    this.logger.log(`Attendance ${attendanceRecordId} corrected by ${reviewerId}`);

    return {
      corrected: true,
      attendanceRecordId: record._id.toString(),
      totalWorkMinutes: (record as any).totalWorkMinutes,
    };
  }
}
