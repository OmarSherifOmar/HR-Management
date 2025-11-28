import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceCorrectionRequest, AttendanceCorrectionRequestDocument } from '../models/attendance-correction-request.schema';
import { AttendanceRecord, AttendanceRecordDocument } from '../models/attendance-record.schema';
import { CorrectionRequestStatus, PunchType } from '../models/enums';

@Injectable()
export class CorrectionService {
  private readonly logger = new Logger(CorrectionService.name);

  constructor(
    @InjectModel(AttendanceCorrectionRequest.name)
    private correctionModel: Model<AttendanceCorrectionRequestDocument>,
    @InjectModel(AttendanceRecord.name)
    private attendanceModel: Model<AttendanceRecordDocument>,
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

    return req;
  }
}
