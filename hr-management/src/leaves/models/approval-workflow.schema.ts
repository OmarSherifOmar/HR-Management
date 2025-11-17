import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { LeaveType, LeaveTypeDocument } from './leave-type.schema';
import { Employee } from '../../employee-organization-performancesubsystem/employee/models/employee.schema';

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
  DELEGATE = 'DELEGATE'
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
  autoEscalationHours: number; // BR-28: auto-escalate after 48 hours
}

@Schema({ timestamps: true })
export class ApprovalWorkflow {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({required: true, type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType' })
  leaveTypeId: mongoose.Types.ObjectId | LeaveTypeDocument;
  
  @Prop({ type: [String] })
  applicablePositions: string[];

  @Prop({ type: [WorkflowLevel], required: true })
  levels: WorkflowLevel[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 1 })
  priority: number;

  @Prop({required: true, type: mongoose.Schema.Types.ObjectId, ref:'Employee' })
  createdBy: mongoose.Types.ObjectId;

  @Prop({type: mongoose.Schema.Types.ObjectId, ref:'Employee' })
  updatedBy: mongoose.Types.ObjectId;
}

export const ApprovalWorkflowSchema = SchemaFactory.createForClass(ApprovalWorkflow);
