import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AssessmentResult {

  @Prop({ type: Types.ObjectId, ref: 'Interview', required: true })
  interviewId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  interviewerId: Types.ObjectId;

  @Prop()
  score: number;

  @Prop()
  comments?: string;
}

export type AssessmentResultDocument = HydratedDocument<AssessmentResult>;
export const AssessmentResultSchema =
  SchemaFactory.createForClass(AssessmentResult);