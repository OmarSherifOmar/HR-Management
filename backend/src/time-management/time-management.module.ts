import { Module } from '@nestjs/common';
import { TimeManagementController } from './time-management.controller';
import { TimeManagementService } from './time-management.service';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationLogSchema, NotificationLog } from './models/notification-log.schema';
import { AttendanceCorrectionRequestSchema, AttendanceCorrectionRequest } from './models/attendance-correction-request.schema';
import { AttendanceRecordSchema, AttendanceRecord } from './models/attendance-record.schema';
import { TimeExceptionSchema, TimeException } from './models/time-exception.schema';
import { OvertimeRuleSchema, OvertimeRule } from './models/overtime-rule.schema';
import { LatenessRule, latenessRuleSchema } from './models/lateness-rule.schema';
import { HolidaySchema, Holiday } from './models/holiday.schema';
import { ShiftTypeModule } from './modules/shift-type.module';
import { ShiftModule } from './modules/shift.module';
import { ShiftAssignmentModule } from './modules/shift-assignment.module';
import { ScheduleRuleModule } from './modules/schedule-rule.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationLog.name, schema: NotificationLogSchema },
      { name: AttendanceCorrectionRequest.name, schema: AttendanceCorrectionRequestSchema },
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
      { name: TimeException.name, schema: TimeExceptionSchema },
      { name: OvertimeRule.name, schema: OvertimeRuleSchema },
      { name: LatenessRule.name, schema: latenessRuleSchema },
      { name: Holiday.name, schema: HolidaySchema },
    ]),
    ShiftTypeModule,
    ShiftModule,
    ShiftAssignmentModule,
    ScheduleRuleModule,
  ],
  controllers: [TimeManagementController],
  providers: [TimeManagementService],
  exports: [ShiftTypeModule, ShiftModule, ShiftAssignmentModule, ScheduleRuleModule],
})
export class TimeManagementModule {}
