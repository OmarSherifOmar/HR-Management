import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveType, LeaveTypeSchema } from '../models/leave-type.schema';
import { EmployeeModule } from '../../employee-organization-performancesubsystem/employee/employee.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveType.name, schema: LeaveTypeSchema },
    ]),
    EmployeeModule,
  ],
  exports: [MongooseModule],
})
export class LeaveTypeModule {}
