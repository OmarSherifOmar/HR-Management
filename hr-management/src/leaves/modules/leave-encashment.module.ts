import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveEncashment, LeaveEncashmentSchema } from '../models/leave-encashment.schema';
import { LeaveTypeModule } from './leave-type.module';
import { EntitlementModule } from './entitlement.module';
import { EmployeeModule } from '../../employee-organization-performancesubsystem/employee/employee.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveEncashment.name, schema: LeaveEncashmentSchema },
    ]),
    LeaveTypeModule,
    EntitlementModule,
    EmployeeModule,
  ],
  exports: [MongooseModule],
})
export class LeaveEncashmentModule {}
