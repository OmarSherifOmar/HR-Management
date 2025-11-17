import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApprovalWorkflow, ApprovalWorkflowSchema } from '../models/approval-workflow.schema';
import { LeaveTypeModule } from './leave-type.module';
import { EmployeeModule } from '../../employee-organization-performancesubsystem/employee/employee.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApprovalWorkflow.name, schema: ApprovalWorkflowSchema },
    ]),
    LeaveTypeModule,
    EmployeeModule,
  ],
  exports: [MongooseModule],
})
export class ApprovalWorkflowModule {}
