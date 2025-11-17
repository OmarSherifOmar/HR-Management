import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AppraisalCycle } from './appraisal-cycle.schema';
import { AppraisalTemplate } from './appraisal-template.schema';
import { Employee } from 'src/employee-organization-performancesubsystem/employee/models/employee.schema';

export type AppraisalFormDocument = AppraisalForm & Document;

@Schema({ timestamps: true })
export class AppraisalForm {
  @Prop({ type: Types.ObjectId, ref: 'AppraisalCycle', required: true }) cycle: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'AppraisalTemplate', required: true }) template: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true }) employee: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Employee' }) manager?: Types.ObjectId;

  
  @Prop() state?: 'Draft' | 'Assigned' | 'InReview' | 'Completed' | 'Closed';
  @Prop({ type: Object }) answers?: any; 
  @Prop() dueDate?: Date;
  @Prop() submittedAt?: Date;
  @Prop() overallScore?: number;
  @Prop() overallRating?: string;
  @Prop([{
   itemId: String,
   rating: Number,
   comment: String,
   example: String,
   developmentRecommendation: String,
  }])
ratings?: any[];

}

export const AppraisalFormSchema = SchemaFactory.createForClass(AppraisalForm);
AppraisalFormSchema.index({ employee: 1, cycle: 1 }, { unique: true }); 
