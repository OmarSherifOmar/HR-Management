import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkFlowSchema } from '../models/workflow-approvals.schema';
import { EmployeeModule } from '../../employee-organization-performancesubsystem/employee/employee.module';
import {AttendanceRecordModuleModule} from '../modules/attendance-record-module.module';
import { ShiftModuleModule } from './shift-module.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'WorkFlow', schema: WorkFlowSchema },
		]),
        EmployeeModule,
        AttendanceRecordModuleModule,
        ShiftModuleModule,
	],
	exports: [MongooseModule],
})
export class WorkflowApprovalsModuleModule {}
