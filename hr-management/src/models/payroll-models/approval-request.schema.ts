import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApprovalRole = 'PayrollManager' | 'SystemAdmin' | 'HRManager';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

@Schema({ timestamps: true, collection: 'approval_requests' })
export class ApprovalRequest extends Document {
  @Prop({ type: Types.ObjectId, ref: 'ConfigDraft', required: true })
  draftId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['PayrollManager', 'SystemAdmin', 'HRManager'],
  })
  requestedForRole: ApprovalRole;

  @Prop({
    required: true,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
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
