import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TargetType =
  | 'PayType'
  | 'PayGrade'
  | 'Allowance'
  | 'Deduction'
  | 'Bonus'
  | 'SeparationBenefit';

export type DraftOp = 'CREATE' | 'UPDATE' | 'DELETE';

export type DraftStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

@Schema({ timestamps: true, collection: 'config_drafts' })
export class ConfigDraft extends Document {
  @Prop({ required: true })
  targetType: TargetType;

  // null/undefined when creating a brand new config
  @Prop({ type: Types.ObjectId, required: false })
  targetId?: Types.ObjectId | null;

  @Prop({ required: true, enum: ['CREATE', 'UPDATE', 'DELETE'] })
  op: DraftOp;

  // Proposed changes to apply if the draft is approved
  @Prop({ type: Object, required: true })
  changeSet: Record<string, any>;

  @Prop({
    required: true,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING',
  })
  status: DraftStatus;

  @Prop({ required: true })
  submittedBy: string;

  @Prop({ required: true })
  submittedAt: Date;

  @Prop()
  decisionBy?: string;

  @Prop()
  decisionAt?: Date;

  @Prop()
  decisionNote?: string;
}

export const ConfigDraftSchema = SchemaFactory.createForClass(ConfigDraft);
