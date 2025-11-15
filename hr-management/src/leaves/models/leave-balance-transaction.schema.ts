import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { LeaveRequest, LeaveRequestDocument } from './leave-request.schema';
import { EmployeeEntitlement, EmployeeEntitlementDocument } from './employee-entitlement.schema';

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
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  employeeId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeEntitlement', required: true })
  entitlementId: mongoose.Types.ObjectId | EmployeeEntitlementDocument;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest' })
  leaveRequestId: mongoose.Types.ObjectId | LeaveRequestDocument;

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

  // Retroactive deduction (BR-19)
  @Prop({ default: false })
  isRetroactive: boolean;

  @Prop()
  retroactiveReason: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  processedBy: mongoose.Types.ObjectId;
}

export const LeaveBalanceTransactionSchema = SchemaFactory.createForClass(LeaveBalanceTransaction);

// Indexes for audit trail queries
LeaveBalanceTransactionSchema.index({ employeeId: 1, transactionDate: -1 });
LeaveBalanceTransactionSchema.index({ entitlementId: 1, transactionDate: -1 });
LeaveBalanceTransactionSchema.index({ leaveRequestId: 1 });
