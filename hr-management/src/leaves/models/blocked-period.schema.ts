import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Employee } from '../../employee-organization-performancesubsystem/employee/models/employee.schema';

export type BlockedPeriodDocument = HydratedDocument<BlockedPeriod>;

@Schema({ timestamps: true })
export class BlockedPeriod {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: [String] })
  applicablePositions: string[];

  @Prop({ required: true, type: [mongoose.Schema.Types.ObjectId], ref: 'Employee', default: [] })
  exemptEmployeeIds: mongoose.Types.ObjectId[];

  @Prop({ required: true, default: 0 })
  maxLeavesAllowed: number; // 0 = full block, >0 = partial block with limit

  @Prop()
  reason: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  createdBy: mongoose.Types.ObjectId;

  @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  updatedBy: mongoose.Types.ObjectId;
}

export const BlockedPeriodSchema = SchemaFactory.createForClass(BlockedPeriod);
