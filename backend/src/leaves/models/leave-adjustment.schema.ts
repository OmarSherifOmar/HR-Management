
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AdjustmentType } from '../enums/adjustment-type.enum';

export type LeaveAdjustmentDocument = HydratedDocument<LeaveAdjustment>;

@Schema({ timestamps: true })
export class LeaveAdjustment {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'LeaveType', required: true })
  leaveTypeId: Types.ObjectId;

  @Prop({ enum: AdjustmentType, required: true })
  adjustmentType: AdjustmentType;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  hrUserId: Types.ObjectId;
}

export const LeaveAdjustmentSchema =
  SchemaFactory.createForClass(LeaveAdjustment);
