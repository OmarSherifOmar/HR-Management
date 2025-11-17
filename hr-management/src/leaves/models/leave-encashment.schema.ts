import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { LeaveType, LeaveTypeDocument } from './leave-type.schema';
import { EmployeeEntitlement, EmployeeEntitlementDocument } from './employee-entitlement.schema';

export type LeaveEncashmentDocument = HydratedDocument<LeaveEncashment>;

export enum EncashmentReason {
  TERMINATION = 'TERMINATION',
  RESIGNATION = 'RESIGNATION',
  OFFBOARDING = 'OFFBOARDING'
}

@Schema({ timestamps: true })
export class LeaveEncashment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Employee' })
  employeeId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true })
  leaveTypeId: mongoose.Types.ObjectId | LeaveTypeDocument;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeEntitlement', required: true })
  entitlementId: mongoose.Types.ObjectId | EmployeeEntitlementDocument;

  @Prop({ required: true, enum: EncashmentReason })
  encashmentReason: EncashmentReason;

  @Prop({ required: true })
  encashmentDate: Date;

  @Prop({ required: true })
  daysEncashed: number;

  @Prop({ required: true })
  dailySalaryRate: number;

  @Prop({ required: true })
  totalAmount: number; // DailySalaryRate * NumberofUnusedLeaveDays

  @Prop({ required: true })
  balanceBefore: number;

  @Prop({ required: true })
  balanceAfter: number;

    @Prop()
  remarks: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' })
  processedBy: mongoose.Types.ObjectId;
}

export const LeaveEncashmentSchema = SchemaFactory.createForClass(LeaveEncashment);