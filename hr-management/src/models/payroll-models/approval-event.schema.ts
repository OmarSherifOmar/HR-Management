import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApprovalAction =
  | 'SUBMIT'
  | 'REQUESTED'
  | 'APPROVE'
  | 'REJECT'
  | 'CANCEL';

@Schema({ timestamps: true, collection: 'approval_events' })
export class ApprovalEvent extends Document {
  @Prop({ type: Types.ObjectId, ref: 'ConfigDraft', required: true })
  draftId: Types.ObjectId;

  @Prop({ required: true })
  actorId: string;

  @Prop({
    required: true,
    enum: ['SUBMIT', 'REQUESTED', 'APPROVE', 'REJECT', 'CANCEL'],
  })
  action: ApprovalAction;

  @Prop({ required: true })
  at: Date;

  @Prop()
  note?: string;
}

export const ApprovalEventSchema = SchemaFactory.createForClass(ApprovalEvent);
