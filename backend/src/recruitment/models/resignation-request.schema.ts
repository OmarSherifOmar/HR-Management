import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ResignationStatus } from '../enums/resignation-status.enum';

@Schema({ timestamps: true })
export class ResignationRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  reason: string;

  @Prop()
  additionalComments?: string;

  @Prop({ required: true })
  requestedLastWorkingDay: Date;

  @Prop()
  actualLastWorkingDay?: Date;

  @Prop({
    type: String,
    enum: ResignationStatus,
    default: ResignationStatus.SUBMITTED,
  })
  status: ResignationStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewComments?: string;

  @Prop()
  reviewedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Contract', required: true })
  contractId: Types.ObjectId;
}

export type ResignationRequestDocument = HydratedDocument<ResignationRequest>;
export const ResignationRequestSchema = SchemaFactory.createForClass(ResignationRequest);
