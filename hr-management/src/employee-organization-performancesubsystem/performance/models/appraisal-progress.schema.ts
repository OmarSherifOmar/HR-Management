import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Department } from 'src/employee-organization-performancesubsystem/organization/models/department.schema';

export type AppraisalProgressDocument = AppraisalProgress & Document;

@Schema({ timestamps: true })
export class AppraisalProgress {
  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  department: Types.ObjectId;

  @Prop({ required: true })
  totalEmployees: number;

  @Prop({ required: true })
  completed: number;

  @Prop({ required: true })
  completionRate: number;

}

export const AppraisalProgressSchema = SchemaFactory.createForClass(AppraisalProgress);
