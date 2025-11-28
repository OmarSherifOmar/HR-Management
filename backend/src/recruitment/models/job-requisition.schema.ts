import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class JobRequisition {

  @Prop({ required: true })
  requisitionId: string;

  @Prop({ type: Types.ObjectId, ref: 'JobTemplate' })
  templateId: Types.ObjectId;

  @Prop({ required: true })
  openings: number;

  @Prop()
  location: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  hiringManagerId: Types.ObjectId;

  @Prop({
    enum: ['draft', 'published', 'closed'],
    default: 'draft'
  })
  publishStatus: string;

  @Prop()
  postingDate?: Date;

  @Prop()
  expiryDate?: Date;
}

export type JobRequisitionDocument = HydratedDocument<JobRequisition>;
export const JobRequisitionSchema = SchemaFactory.createForClass(JobRequisition);
