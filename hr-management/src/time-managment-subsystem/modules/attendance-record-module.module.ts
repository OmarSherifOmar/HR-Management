import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceRecordSchema } from '../models/attendance-record.schema';
import { EmployeeModule } from '../../employee-organization-performancesubsystem/employee/employee.module';
import { LeaveRequestModule } from '../../leaves/modules/leave-request.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Attendance', schema: AttendanceRecordSchema },
        ]),
        EmployeeModule,
        LeaveRequestModule,
	],
	exports: [MongooseModule],
})
export class AttendanceRecordModuleModule {}
