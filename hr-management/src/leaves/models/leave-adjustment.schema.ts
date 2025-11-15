import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type LeaveAdjustmentDocument = HydratedDocument<LeaveAdjustment>;

@Schema({ timestamps: true })
export class LeaveAdjustment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Employee' })
  employeeId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  leaveType: string;

  @Prop({ required: true })
  adjustment: number; // positive or negative

  @Prop({ required: true })
  reason: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' })
  adjustedBy: mongoose.Types.ObjectId;

  @Prop({ required: true })
  justification: string;
}

export const LeaveAdjustmentSchema = SchemaFactory.createForClass(LeaveAdjustment);