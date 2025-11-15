import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { LeaveRequest, LeaveRequestDocument } from './leave-request.schema';

export type LeaveValidationLogDocument = HydratedDocument<LeaveValidationLog>;

export enum ValidationType {
  ELIGIBILITY_CHECK = 'ELIGIBILITY_CHECK',
  BALANCE_CHECK = 'BALANCE_CHECK',
  OVERLAP_CHECK = 'OVERLAP_CHECK',
  TEAM_CONFLICT_CHECK = 'TEAM_CONFLICT_CHECK',
  BLOCKED_PERIOD_CHECK = 'BLOCKED_PERIOD_CHECK',
}

@Schema({ timestamps: true })
export class LeaveValidationLog {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest', required: true, index: true })
  leaveRequestId: mongoose.Types.ObjectId | LeaveRequestDocument;

  @Prop({ required: true, enum: ValidationType })
  validationType: ValidationType;

  @Prop({ required: true })
  passed: boolean;

  @Prop({ type: [String], default: [] })
  errors: string[];

  @Prop({ type: [String], default: [] })
  warnings: string[];

  @Prop()
  validatedAt: Date;
}

export const LeaveValidationLogSchema = SchemaFactory.createForClass(LeaveValidationLog);

LeaveValidationLogSchema.index({ leaveRequestId: 1 });
