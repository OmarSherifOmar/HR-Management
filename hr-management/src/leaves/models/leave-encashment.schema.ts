import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type LeaveEncashmentDocument = HydratedDocument<LeaveEncashment>;

@Schema({ timestamps: true })
export class LeaveEncashment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Employee' })
  employeeId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  leaveType: string;

  @Prop({ required: true })
  daysEncashed: number;

  @Prop({ required: true })
  dailySalaryRate: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' })
  processedBy: mongoose.Types.ObjectId;

  @Prop()
  remarks: string;
}

export const LeaveEncashmentSchema = SchemaFactory.createForClass(LeaveEncashment);