import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PolicyEnforcementSchema } from '../models/policy-enforcment.schema';
import { EmployeeModule } from '../../employee-organization-performancesubsystem/employee/employee.module';
import { DepartmentModule } from '../../employee-organization-performancesubsystem/organization/department.module';
@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'PolicyEnforcement', schema: PolicyEnforcementSchema },
		]),
        EmployeeModule,
        DepartmentModule,
	],
	exports: [MongooseModule],
})
export class PolicyEnforcmentModuleModule {}
