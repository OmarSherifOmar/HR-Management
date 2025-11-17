import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Employee } from '../../employee/models/employee.schema';
import { AppraisalCycleSchema } from './appraisal-cycle.schema';
import { AppraisalTemplateSchema } from './appraisal-template.schema';

export type AppraisalAssignmentDocument = AppraisalAssignment & Document;

@Schema({ timestamps: true })
export class AppraisalAssignment {
  @Prop({ type: Types.ObjectId, ref: 'AppraisalCycle', required: true }) cycle: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'AppraisalTemplate', required: true }) template: Types.ObjectId;


  @Prop([{ type: Types.ObjectId, ref: 'Employee' }])
  employees: Types.ObjectId[]; // assigned employees

  @Prop([{ type: Types.ObjectId, ref: 'Employee' }])
  managers: Types.ObjectId[]; // assigned managers 

  @Prop({ default: false }) notifyOnAssign?: boolean;
}

export const AppraisalAssignmentSchema = SchemaFactory.createForClass(AppraisalAssignment);
