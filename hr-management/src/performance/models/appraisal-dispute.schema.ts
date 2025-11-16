import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DisputeStatus {
  Pending = 'Pending',
  UnderReview = 'UnderReview',
  Resolved = 'Resolved',
  Rejected = 'Rejected',
}

export type AppraisalDisputeDocument = AppraisalDispute & Document;

@Schema({ timestamps: true })
export class AppraisalDispute {
  /** Employee who raised the dispute */
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employee: Types.ObjectId;

  /** Final appraisal record being disputed */
  @Prop({ type: Types.ObjectId, ref: 'FinalAppraisalRecord', required: true })
  appraisalRecord: Types.ObjectId;

  /** Short reason / description of the objection */
  @Prop({ type: String, required: true })
  reason: string;

  /** Current dispute status */
  @Prop({ type: String, 
    enum: Object.values(DisputeStatus), 
    default: DisputeStatus.Pending })
  status: DisputeStatus;

  /** HR/Admin who eventually resolved the dispute (optional until resolved) */
  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  resolvedBy?: Types.ObjectId | null;

  /** When the dispute was resolved */
  @Prop({ type: Date, default: null })
  resolvedAt?: Date | null;

  /** Optional link to the notification created for this dispute */
  @Prop({ type: Types.ObjectId, ref: 'Notification', default: null })
  relatedNotification?: Types.ObjectId | null;

  /** Audit fields */
  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  createdBy?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  updatedBy?: Types.ObjectId | null;
}

export const AppraisalDisputeSchema = SchemaFactory.createForClass(AppraisalDispute);
