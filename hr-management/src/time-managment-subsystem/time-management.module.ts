import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AttendanceRecordModuleModule } from './modules/attendance-record-module.module';
import { ScheduleModuleModule } from './modules/schedule-module.module';
import { PolicyEnforcmentModuleModule } from './modules/policy-enforcment-module.module';
import { WorkflowApprovalsModuleModule } from './modules/workflow-approvals-module.module';
import { HolidayCalendarModuleModule } from './modules/holiday-calendar-module.module';
import { ShiftModuleModule } from './modules/shift-module.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || '', {
      autoCreate: true,
    }),
    AttendanceRecordModuleModule,
    ScheduleModuleModule,
    PolicyEnforcmentModuleModule,
    WorkflowApprovalsModuleModule,
    HolidayCalendarModuleModule,
    ShiftModuleModule,
  ],
})
export class TimeManagementModule {}
