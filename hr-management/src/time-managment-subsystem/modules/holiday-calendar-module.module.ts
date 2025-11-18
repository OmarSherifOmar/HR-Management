import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HolidayCalendarSchema } from '../models/holiday-calendar.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'HolidayCalendar', schema: HolidayCalendarSchema },
		]),
	],
	exports: [MongooseModule],
})
export class HolidayCalendarModuleModule {}
