import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FinalAppraisalRecordSchema } from './final-appraisal-record.schema';

export type EmployeeAppraisalHistoryDocument = EmployeeAppraisalHistory & Document;

@Schema({ timestamps: true })
export class EmployeeAppraisalHistory {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employee: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FinalAppraisalRecord', required: true })
  appraisalRecord: Types.ObjectId;

  @Prop({ required: true })
  cycleYear: number;

  @Prop({ type: Number, required: true })
  score: number;

  @Prop({ type: String, required: true })
  ratingScale: string;

  @Prop({ type: String, required: true })
  method: string;

  @Prop({ type: Date, required: true })
  finalizedAt: Date;


}

export const EmployeeAppraisalHistorySchema = SchemaFactory.createForClass(EmployeeAppraisalHistory);

