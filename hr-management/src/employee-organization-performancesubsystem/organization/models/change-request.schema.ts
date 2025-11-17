import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Employee } from './employee.schema';


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
  @Prop({ required: true, enum: Object.values(ChangeRequestType) })
  type: ChangeRequestType;

  @Prop({ type: Object, required: true })
  payload: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  requestedBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ChangeRequestStatus),
    default: ChangeRequestStatus.Pending,
  })
  status: ChangeRequestStatus;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  reviewedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewedAt?: Date | null;

}

export const ChangeRequestSchema = SchemaFactory.createForClass(ChangeRequest);
