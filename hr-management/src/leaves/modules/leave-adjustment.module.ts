import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveAdjustment, LeaveAdjustmentSchema } from '../models/leave-adjustment.schema';
import { LeaveTypeModule } from './leave-type.module';
import { EntitlementModule } from './entitlement.module';
import { EmployeeModule } from '../../employee-organization-performancesubsystem/employee/employee.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveAdjustment.name, schema: LeaveAdjustmentSchema },
    ]),
    LeaveTypeModule,
    EntitlementModule,
    EmployeeModule,
  ],
  exports: [MongooseModule],
})
export class LeaveAdjustmentModule {}
