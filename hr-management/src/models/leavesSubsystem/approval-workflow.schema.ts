import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { LeaveType, LeaveTypeDocument } from './leave-type.schema';

export type ApprovalWorkflowDocument = HydratedDocument<ApprovalWorkflow>;

export enum ApprovalLevel {
  LEVEL_1 = 'LEVEL_1',
  LEVEL_2 = 'LEVEL_2',
  LEVEL_3 = 'LEVEL_3',
  LEVEL_4 = 'LEVEL_4',
}

export enum ApprovalAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  DELEGATE = 'DELEGATE',
  REQUEST_INFO = 'REQUEST_INFO',
}

@Schema()
export class WorkflowLevel {
  @Prop({ required: true, enum: ApprovalLevel })
  level: ApprovalLevel;

  @Prop({ required: true })
  approverRole: string;

  @Prop({ default: true })
  isMandatory: boolean;

  @Prop({ default: 48 })
  autoEscalationHours: number;

  @Prop({ default: true })
  allowDelegation: boolean;

  @Prop({ default: false })
  requiresDocumentVerification: boolean;

  @Prop({ default: false })
  canOverridePreviousLevel: boolean;
}

@Schema({ timestamps: true })
export class ApprovalWorkflow {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType' })
  leaveTypeId: mongoose.Types.ObjectId | LeaveTypeDocument;

  @Prop({ type: [String] })
  applicableDepartments: string[];

  @Prop({ type: [String] })
  applicablePositions: string[];

  @Prop({ type: [WorkflowLevel], required: true })
  levels: WorkflowLevel[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 1 })
  priority: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const ApprovalWorkflowSchema = SchemaFactory.createForClass(ApprovalWorkflow);
