import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { LeaveType, LeaveTypeDocument } from './leave-type.schema';

export type LeaveRequestDocument = HydratedDocument<LeaveRequest>;

export enum LeaveRequestStatus {
  PENDING_MANAGER = 'PENDING_MANAGER',
  PENDING_HR = 'PENDING_HR',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class LeaveRequest {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  employeeId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true })
  leaveTypeId: mongoose.Types.ObjectId | LeaveTypeDocument;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  totalDays: number;

  @Prop({ default: 0 })
  unpaidDays: number; // Excess days converted to unpaid due to insufficient balance (BR-29)

  @Prop({ required: true })
  reason: string;

  @Prop({ enum: LeaveRequestStatus, default: LeaveRequestStatus.PENDING_MANAGER })
  status: LeaveRequestStatus;

  // Manager approval
  @Prop({ type: mongoose.Schema.Types.ObjectId })
  managerId: mongoose.Types.ObjectId;

  @Prop()
  managerApprovedAt: Date;

  @Prop()
  managerComments: string;

  // HR approval
  @Prop()
  hrApprovedAt: Date;

  @Prop()
  hrComments: string;

  @Prop({ default: false })
  documentsVerified: boolean;

  // Post-leave (REQ-031)
  @Prop({ default: false })
  isPostLeave: boolean;

  @Prop()
  postLeaveSubmissionDate: Date;

  // Final decision
  @Prop({ type: mongoose.Schema.Types.ObjectId })
  approvedBy: mongoose.Types.ObjectId;

  @Prop()
  approvedAt: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  rejectedBy: mongoose.Types.ObjectId;

  @Prop()
  rejectedAt: Date;

  @Prop()
  rejectionReason: string;

  // Cancellation (User story #4)
  @Prop({ type: mongoose.Schema.Types.ObjectId })
  cancelledBy: mongoose.Types.ObjectId;

  @Prop()
  cancelledAt: Date;

  @Prop()
  cancellationReason: string;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);

// Indexes
LeaveRequestSchema.index({ employeeId: 1, status: 1 });
LeaveRequestSchema.index({ managerId: 1, status: 1 });
LeaveRequestSchema.index({ startDate: 1, endDate: 1 });

