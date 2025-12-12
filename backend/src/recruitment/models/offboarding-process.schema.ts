import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OffboardingStatus } from '../enums/offboarding-status.enum';
import { TerminationInitiation } from '../enums/termination-initiation.enum';

@Schema({ timestamps: true })
export class OffboardingProcess {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  employeeId: Types.ObjectId;

  @Prop({
    type: String,
    enum: TerminationInitiation,
    required: true,
  })
  initiationType: TerminationInitiation;

  @Prop({ type: Types.ObjectId, ref: 'ResignationRequest' })
  resignationRequestId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TerminationRequest' })
  terminationRequestId?: Types.ObjectId;

  @Prop({ required: true })
  effectiveDate: Date;

  @Prop({
    type: String,
    enum: OffboardingStatus,
    default: OffboardingStatus.INITIATED,
  })
  status: OffboardingStatus;

  @Prop({ type: Types.ObjectId, ref: 'ClearanceChecklist' })
  clearanceChecklistId?: Types.ObjectId;

  @Prop({ default: false })
  accessRevoked: boolean;

  @Prop()
  accessRevokedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  accessRevokedBy?: Types.ObjectId;

  @Prop({ default: false })
  settlementTriggered: boolean;

  @Prop()
  settlementTriggeredAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  initiatedBy: Types.ObjectId;

  @Prop()
  completedAt?: Date;
}

export type OffboardingProcessDocument = HydratedDocument<OffboardingProcess>;
export const OffboardingProcessSchema = SchemaFactory.createForClass(OffboardingProcess);

