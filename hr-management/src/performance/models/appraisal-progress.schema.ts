import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AppraisalProgressDocument = AppraisalProgress & Document;

@Schema({ timestamps: true })
export class AppraisalProgress {
  /** The department being tracked */
  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  department: Types.ObjectId;

  /** Total number of employees in this department for the cycle */
  @Prop({ required: true })
  totalEmployees: number;

  /** Number who completed their appraisal */
  @Prop({ required: true })
  completed: number;

  /** Completion % = completed / totalEmployees */
  @Prop({ required: true })
  completionRate: number;

}

export const AppraisalProgressSchema = SchemaFactory.createForClass(AppraisalProgress);
