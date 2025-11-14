import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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
  applicableDepartments: string[];

  @Prop({ type: [String] })
  applicablePositions: string[];

  @Prop({ type: [String] })
  exemptEmployeeIds: string[];

  @Prop({ default: false })
  isFullBlock: boolean;

  @Prop()
  maxLeavesAllowed: number;

  @Prop()
  reason: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const BlockedPeriodSchema = SchemaFactory.createForClass(BlockedPeriod);
