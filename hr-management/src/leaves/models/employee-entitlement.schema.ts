import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { LeaveType, LeaveTypeDocument } from './leave-type.schema';
import { EntitlementRule, EntitlementRuleDocument } from './entitlement-rule.schema';

export type EmployeeEntitlementDocument = HydratedDocument<EmployeeEntitlement>;

@Schema({ timestamps: true })
export class EmployeeEntitlement {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  employeeId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true })
  leaveTypeId: mongoose.Types.ObjectId | LeaveTypeDocument;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'EntitlementRule' })
  entitlementRuleId: mongoose.Types.ObjectId | EntitlementRuleDocument;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, default: 0 })
  totalEntitled: number;

  @Prop({ default: 0 })
  accrued: number;

  @Prop({ default: 0 })
  taken: number;

  @Prop({ default: 0 })
  pending: number;

  @Prop({ default: 0 })
  carriedOver: number;

  @Prop({ default: 0 })
  manualAdjustment: number;

  // Accrual pause (BR-11: pause during unpaid leave or suspension)
  @Prop()
  pausedFrom: Date;

  @Prop()
  pausedUntil: Date;

  @Prop()
  pauseReason: string;

  @Prop()
  lastAccrualDate: Date;

  @Prop()
  nextAccrualDate: Date;

  @Prop()
  expiryDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  createdBy: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  updatedBy: mongoose.Types.ObjectId;
}

export const EmployeeEntitlementSchema = SchemaFactory.createForClass(EmployeeEntitlement);

// Create compound index for unique employee + leave type + year
EmployeeEntitlementSchema.index({ employeeId: 1, leaveTypeId: 1, year: 1 }, { unique: true });
