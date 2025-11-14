import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  HREventProcessing,
  HREventProcessingSchema,
} from '../../models/payroll-execution/hr-employee-processing.schema';
import {
  PayrollApprovalWorkflow,
  PayrollApprovalWorkflowSchema,
} from '../../models/payroll-execution/payroll-approval-workflow.schema';

const payrollExecutionModels = MongooseModule.forFeature([
  { name: HREventProcessing.name, schema: HREventProcessingSchema },
  { name: PayrollApprovalWorkflow.name, schema: PayrollApprovalWorkflowSchema }
]);

@Module({
  imports: [payrollExecutionModels],
  exports: [payrollExecutionModels],
})
export class PayrollExecutionModelsModule {}
