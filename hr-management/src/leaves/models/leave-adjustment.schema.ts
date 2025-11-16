import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { LeaveType, LeaveTypeDocument } from './leave-type.schema';
import { EmployeeEntitlement, EmployeeEntitlementDocument } from './employee-entitlement.schema';

export type LeaveAdjustmentDocument = HydratedDocument<LeaveAdjustment>;

@Schema({ timestamps: true })
export class LeaveAdjustment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Employee'})
  employeeId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true })
  leaveTypeId: mongoose.Types.ObjectId | LeaveTypeDocument;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeEntitlement', required: true })
  entitlementId: mongoose.Types.ObjectId | EmployeeEntitlementDocument;

  @Prop({ required: true })
  adjustmentAmount: number;

  @Prop({ required: true })
  balanceBefore: number;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' })
  adjustedBy: mongoose.Types.ObjectId;

  @Prop({ required: true })
  justification: string;
}

export const LeaveAdjustmentSchema = SchemaFactory.createForClass(LeaveAdjustment);