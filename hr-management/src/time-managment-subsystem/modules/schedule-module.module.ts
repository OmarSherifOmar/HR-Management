import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleSchema } from '../models/schedule.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Schedule', schema: ScheduleSchema },
		]),
	],
})
export class ScheduleModuleModule {}
