import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { PayrollRun } from './run.schema';

export type PayrollApprovalStage = 'specialist' | 'manager' | 'finance';
export type PayrollApprovalWorkflowStatus =
  | 'draft'
  | 'under_review'
  | 'waiting_finance'
  | 'approved'
  | 'rejected'
  | 'locked';

@Schema({ _id: false })
export class PayrollApprovalWorkflowEvent {
  @Prop({ required: true, enum: ['specialist', 'manager', 'finance'] })
  stage!: PayrollApprovalStage;

  @Prop({
    required: true,
    enum: ['draft', 'under_review', 'waiting_finance', 'approved', 'rejected', 'locked'],
  })
  status!: PayrollApprovalWorkflowStatus;

  @Prop({ required: true })
  actorId!: string;

  @Prop()
  message?: string;

  @Prop({ default: Date.now })
  createdAt!: Date;
}

export const PayrollApprovalWorkflowEventSchema =
  SchemaFactory.createForClass(PayrollApprovalWorkflowEvent);

@Schema({ timestamps: true, collection: 'payroll_approval_workflows' })
export class PayrollApprovalWorkflow {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun' })
  payrollRunId!: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: ['specialist', 'manager', 'finance'], default: 'specialist' })
  currentStage!: PayrollApprovalStage;

  @Prop({
    required: true,
    enum: ['draft', 'under_review', 'waiting_finance', 'approved', 'rejected', 'locked'],
    default: 'draft',
  })
  status!: PayrollApprovalWorkflowStatus;

  @Prop({ default: false })
  locked!: boolean;

  @Prop({ type: [PayrollApprovalWorkflowEventSchema], default: [] })
  history!: PayrollApprovalWorkflowEvent[];
}

export type PayrollApprovalWorkflowDocument = HydratedDocument<PayrollApprovalWorkflow>;
export const PayrollApprovalWorkflowSchema =
  SchemaFactory.createForClass(PayrollApprovalWorkflow);
