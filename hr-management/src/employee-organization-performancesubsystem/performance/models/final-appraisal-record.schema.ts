import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FinalAppraisalRecordDocument = FinalAppraisalRecord & Document;

@Schema({ timestamps: true })
export class FinalAppraisalRecord {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employee: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  manager: Types.ObjectId;

  @Prop({ type: Number, required: true })
  score: number;

  @Prop({ type: String, required: true })
  ratingScale: string;

  @Prop({ type: String, required: true })
  method: string;

  @Prop({ type: Date, default: null })
  finalizedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  createdBy?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  updatedBy?: Types.ObjectId | null;
}

export const FinalAppraisalRecordSchema = SchemaFactory.createForClass(FinalAppraisalRecord);

