import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceRecordSchema } from '../models/attendance-record.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Attendance', schema: AttendanceRecordSchema },
		]),
	],
})
export class AttendanceRecordModuleModule {}
