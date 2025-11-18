import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EntitlementRule, EntitlementRuleSchema } from '../models/entitlement-rule.schema';
import { EmployeeEntitlement, EmployeeEntitlementSchema } from '../models/employee-entitlement.schema';
import { LeaveTypeModule } from './leave-type.module';
import { EmployeeModule } from '../../employee-organization-performancesubsystem/employee/employee.module';
import { AttendanceRecord } from '../../time-managment-subsystem/models/attendance-record.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EntitlementRule.name, schema: EntitlementRuleSchema },
      { name: EmployeeEntitlement.name, schema: EmployeeEntitlementSchema },
    ]),
    LeaveTypeModule,
    EmployeeModule,
    AttendanceRecord,
  ],
  exports: [MongooseModule],
})
export class EntitlementModule {}
