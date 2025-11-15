import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChangeRequestDocument = ChangeRequest & Document;

export enum ChangeRequestType {
  ReportingLine = 'ReportingLine',
  PositionChange = 'PositionChange',
  DepartmentChange = 'DepartmentChange',
}

export enum ChangeRequestStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

@Schema({ timestamps: true })
export class ChangeRequest {
  /** Type of change requested */
  @Prop({ required: true, enum: Object.values(ChangeRequestType) })
  type: ChangeRequestType;

  /** JSON payload describing the requested change */
  @Prop({ type: Object, required: true })
  payload: Record<string, any>;

  /** The employee (usually manager) who submits the request */
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  requestedBy: Types.ObjectId;

  /** Approval status */
  @Prop({
    type: String,
    enum: Object.values(ChangeRequestStatus),
    default: ChangeRequestStatus.Pending,
  })
  status: ChangeRequestStatus;

  /** The HR/Admin user who reviewed the request */
  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  reviewedBy?: Types.ObjectId | null;

  /** Timestamp of review */
  @Prop({ type: Date, default: null })
  reviewedAt?: Date | null;

}

export const ChangeRequestSchema = SchemaFactory.createForClass(ChangeRequest);
