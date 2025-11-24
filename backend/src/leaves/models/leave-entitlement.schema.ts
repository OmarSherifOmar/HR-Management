// schemas/leave-entitlement.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LeaveEntitlementDocument = HydratedDocument<LeaveEntitlement>;

@Schema({ timestamps: true })
export class LeaveEntitlement {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'LeaveType', required: true })
  leaveTypeId: Types.ObjectId;

  @Prop({ default: 0 })
  yearlyEntitlement: number;

  @Prop({ default: 0 })
  accruedActual: number;

  @Prop({ default: 0 })
  accruedRounded: number;

  @Prop({ default: 0 })
  carryForward: number;

  @Prop({ default: 0 })
  taken: number;

  @Prop({ default: 0 })
  pending: number;

  @Prop({ default: 0 })
  remaining: number;

  @Prop()
  lastAccrualDate?: Date;

  @Prop()
  nextResetDate?: Date;
}

export const LeaveEntitlementSchema =
  SchemaFactory.createForClass(LeaveEntitlement);
