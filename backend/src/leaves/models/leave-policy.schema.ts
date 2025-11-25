import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AccrualMethod } from '../enums/accrual-method.enum';
import { RoundingRule } from '../enums/rounding-rule.enum';

export type LeavePolicyDocument = HydratedDocument<LeavePolicy>;

@Schema({ timestamps: true })
export class LeavePolicy {
  @Prop({ type: Types.ObjectId, ref: 'LeaveType', required: true })
  leaveTypeId: Types.ObjectId;

  @Prop({ enum: AccrualMethod, default: AccrualMethod.MONTHLY })
  accrualMethod: AccrualMethod;

  @Prop({ default: 0 })
  monthlyRate: number;

  @Prop({ default: 0 })
  yearlyRate: number;

  @Prop({ default: false })
  carryForwardAllowed: boolean;

  @Prop({ default: 0 })
  maxCarryForward: number;

  @Prop()
  expiryAfterMonths?: number;

  @Prop({ enum: RoundingRule, default: RoundingRule.NONE })
  roundingRule: RoundingRule;

  @Prop({ default: 0 })
  minNoticeDays: number;

  @Prop()
  maxConsecutiveDays?: number;

  @Prop({
    type: {
      minTenureMonths: Number,
      positionsAllowed: [String],
      contractTypesAllowed: [String],
    },
  })
  eligibility: Record<string, any>;
}

export const LeavePolicySchema = SchemaFactory.createForClass(LeavePolicy);
