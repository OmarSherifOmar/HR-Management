import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { LeaveRequest, LeaveRequestDocument } from './leave-request.schema';
import { EmployeeEntitlement, EmployeeEntitlementDocument } from './employee-entitlement.schema';
import { Employee } from '../../employee-organization-performancesubsystem/employee/models/employee.schema';

export type LeaveBalanceTransactionDocument = HydratedDocument<LeaveBalanceTransaction>;

export enum TransactionType {
  ACCRUAL = 'ACCRUAL',
  DEDUCTION = 'DEDUCTION',
  ADJUSTMENT = 'ADJUSTMENT',
  RETROACTIVE_DEDUCTION = 'RETROACTIVE_DEDUCTION',
  CARRY_OVER = 'CARRY_OVER',
}

@Schema({ timestamps: true })
export class LeaveBalanceTransaction {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true})
  employeeId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeEntitlement', required: true })
  entitlementId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest' })
  leaveRequestId: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: TransactionType })
  transactionType: TransactionType;

  @Prop({ required: true })
  transactionDate: Date;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  balanceBefore: number;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop()
  description: string;

  // Retroactive deduction
  @Prop({ default: false })
  isRetroactive: boolean;

  @Prop()
  retroactiveReason: string;

  @Prop({required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  processedBy: mongoose.Types.ObjectId;
}

export const LeaveBalanceTransactionSchema = SchemaFactory.createForClass(LeaveBalanceTransaction);