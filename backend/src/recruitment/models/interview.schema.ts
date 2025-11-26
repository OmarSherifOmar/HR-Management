import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { InterviewMethod } from '../enums/interview-method.enum';
import { InterviewStatus } from '../enums/interview-status.enum';
import { ApplicationStage } from '../enums/application-stage.enum';

@Schema({ timestamps: true })
export class Interview {

  @Prop({ type: Types.ObjectId, ref: 'Application', required: true })
  applicationId: Types.ObjectId;

  @Prop({
    enum: ApplicationStage,
    required: true
  })
  stage: ApplicationStage;

  @Prop()
  scheduledDate: Date;

  @Prop({ enum: InterviewMethod })
  method: InterviewMethod;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  panel: Types.ObjectId[];

  @Prop()
  calendarEventId?: string;

  @Prop()
  videoLink?: string;

  @Prop({
    enum: InterviewStatus,
    default: InterviewStatus.SCHEDULED
  })
  status: InterviewStatus;

  @Prop({ type: Types.ObjectId, ref: 'AssessmentResult' })
  feedbackId?: Types.ObjectId;

  @Prop()
  candidateFeedback?: string;
}

export type InterviewDocument = HydratedDocument<Interview>;
export const InterviewSchema = SchemaFactory.createForClass(Interview);