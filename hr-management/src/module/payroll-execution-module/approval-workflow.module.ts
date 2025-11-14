import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PayrollApprovalWorkflow,
  PayrollApprovalWorkflowSchema,
} from '../../models/payroll-execution/payroll-approval-workflow.schema';

const payrollApprovalWorkflowModel = MongooseModule.forFeature([
  { name: PayrollApprovalWorkflow.name, schema: PayrollApprovalWorkflowSchema },
]);

@Module({
  imports: [payrollApprovalWorkflowModel],
  exports: [payrollApprovalWorkflowModel],
})
export class ApprovalWorkflowModule {}
