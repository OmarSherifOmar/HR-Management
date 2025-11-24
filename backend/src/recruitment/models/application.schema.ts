import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApplicationStage } from '../enums/application-stage.enum';
import { ApplicationStatus } from '../enums/application-status.enum';

@Schema({ timestamps: true })
export class Application {

  @Prop({ type: Types.ObjectId, ref: 'Candidate', required: true })
  candidateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobRequisition', required: true })
  requisitionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedHr?: Types.ObjectId;

  @Prop({
    enum: ApplicationStage,
    default: ApplicationStage.SCREENING
  })
  currentStage: ApplicationStage;

  @Prop({
    enum: ApplicationStatus,
    default: ApplicationStatus.SUBMITTED
  })
  status: ApplicationStatus;
}

export type ApplicationDocument = HydratedDocument<Application>;
export const ApplicationSchema = SchemaFactory.createForClass(Application);