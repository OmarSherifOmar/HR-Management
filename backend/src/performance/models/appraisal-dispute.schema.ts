import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AppraisalDisputeStatus } from '../enums/performance.enums';
import { EmployeeProfile } from '../../employee-profile/models/employee-profile.schema';
import { AppraisalRecord } from './appraisal-record.schema';
import { AppraisalAssignment } from './appraisal-assignment.schema';
import { AppraisalCycle } from './appraisal-cycle.schema';

export type AppraisalDisputeDocument = HydratedDocument<AppraisalDispute>;

@Schema({ collection: 'appraisal_disputes', timestamps: true })
export class AppraisalDispute {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AppraisalRecord', required: true })
  appraisalId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AppraisalAssignment', required: true })
  assignmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AppraisalCycle', required: true })
  cycleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  raisedByEmployeeId: Types.ObjectId;

  @Prop({ type: String, required: true })
  reason: string;

  @Prop({ type: String })
  details?: string;

  @Prop({ type: Date, default: () => new Date() })
  submittedAt: Date;

  @Prop({
    type: String,
    enum: Object.values(AppraisalDisputeStatus),
    default: AppraisalDisputeStatus.OPEN,
  })
  status: AppraisalDisputeStatus;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile' })
  assignedReviewerEmployeeId?: Types.ObjectId;

  @Prop({ type: String })
  resolutionSummary?: string;

  @Prop({ type: Date })
  resolvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile' })
  resolvedByEmployeeId?: Types.ObjectId;
}

export const AppraisalDisputeSchema =
  SchemaFactory.createForClass(AppraisalDispute);
