import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { LeaveType, LeaveTypeDocument } from './leave-type.schema';
import { EntitlementRule, EntitlementRuleDocument } from './entitlement-rule.schema';
import { Employee } from '../../employee-organization-performancesubsystem/employee/models/employee.schema';
import { AttendanceRecord } from '../../time-managment-subsystem/models/attendance-record.schema';
export type EmployeeEntitlementDocument = HydratedDocument<EmployeeEntitlement>;

@Schema({ timestamps: true })
export class EmployeeEntitlement {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true})
  employeeId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true })
  leaveTypeId: mongoose.Types.ObjectId | LeaveTypeDocument;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'EntitlementRule', required:true })
  entitlementRuleId: mongoose.Types.ObjectId | EntitlementRuleDocument;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, default: 0 })
  totalEntitled: number;

  @Prop({ required: true, default: 0 })
  accrued: number;

  @Prop({ default: 0 })
  taken: number;

  @Prop({ default: 0 })
  pending: number;

  @Prop({ required: true, default: 0 })
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

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceRecord'})  
  AttendanceId: string; // link to Time Management unpaid leave record (lowkey questioning it)

  @Prop({ required: true })
  lastAccrualDate: Date;

  @Prop({ required: true })
  nextAccrualDate: Date;

  @Prop()
  expiryDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  createdBy: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  updatedBy: mongoose.Types.ObjectId;
}

export const EmployeeEntitlementSchema = SchemaFactory.createForClass(EmployeeEntitlement);