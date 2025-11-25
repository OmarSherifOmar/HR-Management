import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AppraisalRecordStatus } from '../enums/performance.enums';
import { EmployeeProfile } from '../../employee-profile/models/employee-profile.schema';
import { AppraisalAssignment } from './appraisal-assignment.schema';
import { AppraisalTemplate } from './appraisal-template.schema';
import { AppraisalCycle } from './appraisal-cycle.schema';

export type AppraisalRecordDocument = HydratedDocument<AppraisalRecord>;

@Schema({ _id: false })
export class RatingEntry {
  @Prop({ type: String, required: true })
  key: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: Number, required: true })
  ratingValue: number;

  @Prop({ type: String })
  ratingLabel?: string;

  @Prop({ type: Number })
  weightedScore?: number;

  @Prop({ type: String })
  comments?: string;
}

export const RatingEntrySchema = SchemaFactory.createForClass(RatingEntry);

@Schema({ collection: 'appraisal_records', timestamps: true })
export class AppraisalRecord {
  @Prop({ type: Types.ObjectId, ref: 'AppraisalAssignment', required: true })
  assignmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AppraisalCycle', required: true })
  cycleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AppraisalTemplate', required: true })
  templateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  employeeProfileId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  managerProfileId: Types.ObjectId;

  @Prop({ type: [RatingEntrySchema], default: [] })
  ratings: RatingEntry[];

  @Prop({ type: Number })
  totalScore?: number;

  @Prop({ type: String })
  overallRatingLabel?: string;

  @Prop({ type: String })
  managerSummary?: string;

  @Prop({ type: String })
  strengths?: string;

  @Prop({ type: String })
  improvementAreas?: string;

  @Prop({
    type: String,
    enum: Object.values(AppraisalRecordStatus),
    default: AppraisalRecordStatus.DRAFT,
  })
  status: AppraisalRecordStatus;

  @Prop({ type: Date })
  managerSubmittedAt?: Date;

  @Prop({ type: Date })
  hrPublishedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile' })
  publishedByEmployeeId?: Types.ObjectId;

  @Prop({ type: Date })
  employeeViewedAt?: Date;

  @Prop({ type: Date })
  employeeAcknowledgedAt?: Date;

  @Prop({ type: String })
  employeeAcknowledgementComment?: string;

  @Prop({ type: Date })
  archivedAt?: Date;
}

export const AppraisalRecordSchema =
  SchemaFactory.createForClass(AppraisalRecord);
