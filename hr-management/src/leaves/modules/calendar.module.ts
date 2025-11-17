import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HolidayCalendar, HolidayCalendarSchema } from '../models/holiday-calendar.schema';
import { BlockedPeriod, BlockedPeriodSchema } from '../models/blocked-period.schema';
import { EmployeeModule } from '../../employee-organization-performancesubsystem/employee/employee.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HolidayCalendar.name, schema: HolidayCalendarSchema },
      { name: BlockedPeriod.name, schema: BlockedPeriodSchema },
    ]),
    EmployeeModule,
  ],
  exports: [MongooseModule],
})
export class CalendarModule {}
