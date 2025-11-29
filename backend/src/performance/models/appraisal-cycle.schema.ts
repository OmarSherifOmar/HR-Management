import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  AppraisalCycleStatus,
  AppraisalTemplateType,
} from '../enums/performance.enums';
import { Department } from '../../organization-structure/models/department.schema';
import { AppraisalTemplate } from './appraisal-template.schema';

export type AppraisalCycleDocument = HydratedDocument<AppraisalCycle>;

@Schema({ _id: false })
export class CycleTemplateAssignment {
  @Prop({ type: Types.ObjectId, ref: 'AppraisalTemplate', required: true })
  templateId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Department', default: [] })
  departmentIds: Types.ObjectId[];
}

export const CycleTemplateAssignmentSchema = SchemaFactory.createForClass(
  CycleTemplateAssignment,
);

@Schema({ collection: 'appraisal_cycles', timestamps: true })
export class AppraisalCycle {
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: String })
  description?: string;

  @Prop({
    type: String,
    enum: Object.values(AppraisalTemplateType),
    required: true,
  })
  cycleType: AppraisalTemplateType;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ type: Date })
  managerDueDate?: Date;

  @Prop({ type: Date })
  employeeAcknowledgementDueDate?: Date;

  @Prop({ type: [CycleTemplateAssignmentSchema], default: [] })
  templateAssignments: CycleTemplateAssignment[];

  @Prop({
    type: String,
    enum: Object.values(AppraisalCycleStatus),
    default: AppraisalCycleStatus.PLANNED,
  })
  status: AppraisalCycleStatus;

  @Prop({ type: Date })
  publishedAt?: Date;

  @Prop({ type: Date })
  closedAt?: Date;

  @Prop({ type: Date })
  archivedAt?: Date;
}

export const AppraisalCycleSchema =
  SchemaFactory.createForClass(AppraisalCycle);
