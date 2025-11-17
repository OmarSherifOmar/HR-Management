import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// Inputs from other subsystems: None directly (works over local config entities)

export enum TargetType {
  PayrollPolicy = 'PayrollPolicy',
  PayType = 'PayType',
  PayGrade = 'PayGrade',
  Allowance = 'Allowance',
  Deduction = 'Deduction',
  Bonus = 'Bonus',
  SeparationBenefit = 'SeparationBenefit',
}

export enum DraftOp {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum DraftStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true, collection: 'config_drafts' })
export class ConfigDraft extends Document {
  @Prop()
  refCode?: string;

  @Prop({ required: true, enum: Object.values(TargetType) })
  targetType: TargetType;

  @Prop({ type: Types.ObjectId, default: null })
  targetId?: Types.ObjectId | null;

  @Prop({ required: true, enum: Object.values(DraftOp) })
  op: DraftOp;

  @Prop({ type: Object, required: true })
  changeSet: Record<string, any>;

  @Prop({
    required: true,
    enum: Object.values(DraftStatus),
    default: DraftStatus.PENDING,
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
 