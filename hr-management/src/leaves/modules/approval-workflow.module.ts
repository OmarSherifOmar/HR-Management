import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApprovalWorkflow, ApprovalWorkflowSchema } from '../models/approval-workflow.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApprovalWorkflow.name, schema: ApprovalWorkflowSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ApprovalWorkflowModule {}
