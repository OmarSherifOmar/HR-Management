
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AttachmentType } from '../enums/attachment-type.enum';

export type LeaveTypeDocument = HydratedDocument<LeaveType>;

@Schema({ timestamps: true })
export class LeaveType {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'LeaveCategory', required: true })
  categoryId: Types.ObjectId;

  @Prop()
  description?: string;

  @Prop({ default: true })
  paid: boolean;

  @Prop({ default: true })
  deductible: boolean;

  @Prop({ default: false })
  requiresAttachment: boolean;

  @Prop({ enum: AttachmentType })
  attachmentType?: AttachmentType;

  @Prop({ default: null })
  minTenureMonths?: number;

  @Prop({ default: null })
  maxDurationDays?: number;
}

export const LeaveTypeSchema = SchemaFactory.createForClass(LeaveType);
