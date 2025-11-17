import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// Inputs from other subsystems: None (N/A) 

export enum ApprovalAction {
  SUBMIT = 'SUBMIT',
  REQUESTED = 'REQUESTED',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  CANCEL = 'CANCEL',
}

@Schema({ timestamps: true, collection: 'approval_events' })
export class ApprovalEvent extends Document {
  @Prop({ type: Types.ObjectId, ref: 'ConfigDraft', required: true })
  draftId: Types.ObjectId;

  @Prop({ required: true })
  actorId: string;

  @Prop({ required: true, enum: Object.values(ApprovalAction) })
  action: ApprovalAction;

  @Prop({ required: true })
  at: Date;

  @Prop()
  note?: string;
}

export const ApprovalEventSchema = SchemaFactory.createForClass(ApprovalEvent);
 
