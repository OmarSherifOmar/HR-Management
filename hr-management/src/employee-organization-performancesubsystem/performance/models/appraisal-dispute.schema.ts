import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Employee } from '../../employee/models/employee.schema';
import { FinalAppraisalRecordSchema } from './final-appraisal-record.schema';
import { Notification } from 'src/employee-organization-performancesubsystem/organization/models/notification.schema';


export enum DisputeStatus {
  Pending = 'Pending',
  UnderReview = 'UnderReview',
  Resolved = 'Resolved',
  Rejected = 'Rejected',
}

export type AppraisalDisputeDocument = AppraisalDispute & Document;

@Schema({ timestamps: true })
export class AppraisalDispute {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employee: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FinalAppraisalRecord', required: true })
  appraisalRecord: Types.ObjectId;

  @Prop({ type: String, required: true })
  reason: string;

  @Prop({ type: String, 
    enum: Object.values(DisputeStatus), 
    default: DisputeStatus.Pending })
  status: DisputeStatus;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  resolvedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  resolvedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'Notification', default: null })
  relatedNotification?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  createdBy?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  updatedBy?: Types.ObjectId | null;
}

export const AppraisalDisputeSchema = SchemaFactory.createForClass(AppraisalDispute);
