import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleSchema } from '../models/schedule.schema';
import { EmployeeModule } from '../../employee-organization-performancesubsystem/employee/employee.module';
import { ShiftModuleModule } from './shift-module.module';
@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Schedule', schema: ScheduleSchema },
		]),
        EmployeeModule,
        ShiftModuleModule,
	],
	exports: [MongooseModule],
})
export class ScheduleModuleModule {}
