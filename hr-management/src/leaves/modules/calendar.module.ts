import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HolidayCalendar, HolidayCalendarSchema } from '../models/holiday-calendar.schema';
import { BlockedPeriod, BlockedPeriodSchema } from '../models/blocked-period.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HolidayCalendar.name, schema: HolidayCalendarSchema },
      { name: BlockedPeriod.name, schema: BlockedPeriodSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class CalendarModule {}
