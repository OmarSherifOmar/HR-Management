import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type LeaveBalanceDocument = HydratedDocument<LeaveBalance>;

@Schema({ timestamps: true })
export class LeaveBalance {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Employee' })
  employeeId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  leaveType: string; // e.g., 'ANNUAL', 'SICK', etc.

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, default: 0 })
  accrued: number;

  @Prop({ required: true, default: 0 })
  used: number;

  @Prop({ required: true, default: 0 })
  carriedForward: number;

  @Prop({ required: true, default: 0 })
  expired: number;

  @Prop({ required: true, default: 0 })
  encashed: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const LeaveBalanceSchema = SchemaFactory.createForClass(LeaveBalance);