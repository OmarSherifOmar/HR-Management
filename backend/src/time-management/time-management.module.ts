import { Module } from '@nestjs/common';
import { TimeManagementController } from './time-management.controller';
import { TimeManagementService } from './time-management.service';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationLogSchema, NotificationLog } from './models/notification-log.schema';
import { AttendanceCorrectionRequestSchema, AttendanceCorrectionRequest } from './models/attendance-correction-request.schema';
import { ShiftTypeSchema, ShiftType } from './models/shift-type.schema';
import { ScheduleRuleSchema, ScheduleRule } from './models/schedule-rule.schema';
import { AttendanceRecordSchema, AttendanceRecord } from './models/attendance-record.schema';
import { TimeExceptionSchema, TimeException } from './models/time-exception.schema';
import { OvertimeRuleSchema, OvertimeRule } from './models/overtime-rule.schema';
import { ShiftSchema, Shift } from './models/shift.schema';
import { ShiftAssignmentSchema, ShiftAssignment } from './models/shift-assignment.schema';
import { LatenessRule, latenessRuleSchema } from './models/lateness-rule.schema';
import { HolidaySchema, Holiday } from './models/holiday.schema';


@Module({
  imports: [MongooseModule.forFeature([
    { name: NotificationLog.name, schema: NotificationLogSchema },
    { name: AttendanceCorrectionRequest.name, schema: AttendanceCorrectionRequestSchema },
    { name: ShiftType.name, schema: ShiftTypeSchema },
    { name: ScheduleRule.name, schema: ScheduleRuleSchema },
    { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
    { name: TimeException.name, schema: TimeExceptionSchema },
    { name: OvertimeRule.name, schema: OvertimeRuleSchema },
    { name: Shift.name, schema: ShiftSchema },
    { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
    { name: LatenessRule.name, schema: latenessRuleSchema },
    { name: Holiday.name, schema: HolidaySchema },
  ])],
  controllers: [TimeManagementController],
  providers: [TimeManagementService]
})
export class TimeManagementModule {}
