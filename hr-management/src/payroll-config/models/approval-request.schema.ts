import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// Inputs from other subsystems: None (N/A) 

export enum ApprovalRole {
  PayrollManager = 'PayrollManager',
  SystemAdmin = 'SystemAdmin',
  HRManager = 'HRManager',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true, collection: 'approval_requests' })
export class ApprovalRequest extends Document {
  @Prop({ type: Types.ObjectId, ref: 'ConfigDraft', required: true })
  draftId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(ApprovalRole) })
  requestedForRole: ApprovalRole;

  @Prop({
    required: true,
    enum: Object.values(ApprovalStatus),
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Prop()
  decisionBy?: string;

  @Prop()
  decisionAt?: Date;

  @Prop()
  decisionNote?: string;
}

export const ApprovalRequestSchema = SchemaFactory.createForClass(ApprovalRequest);