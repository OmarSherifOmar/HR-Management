import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveRequest, LeaveRequestSchema } from '../models/leave-request.schema';
import { LeaveTypeModule } from './leave-type.module';
import { EmployeeModule } from '../../employee-organization-performancesubsystem/employee/employee.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
    ]),
    LeaveTypeModule,
    EmployeeModule,
  ],
  exports: [MongooseModule],
})
export class LeaveRequestModule {}
