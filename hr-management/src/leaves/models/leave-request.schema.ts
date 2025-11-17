import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { LeaveType, LeaveTypeDocument } from './leave-type.schema';
import { Employee } from '../../employee-organization-performancesubsystem/employee/models/employee.schema';

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
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true})
  employeeId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true })
  leaveTypeId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  totalDays: number;

  @Prop({ default: 0 })
  unpaidDays: number; // if extra days are taken 
  
  @Prop({ required: true })
  reason: string;

  @Prop({required: true,enum: LeaveRequestStatus, default: LeaveRequestStatus.PENDING_MANAGER })
  status: LeaveRequestStatus;

  // Manager approval
  @Prop({required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  managerId: mongoose.Types.ObjectId;

  @Prop()
  managerApprovedAt: Date;

  @Prop()
  managerComments: string;

  // HR approval
  @Prop({required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  hrApprovedBy: mongoose.Types.ObjectId;

  @Prop()
  hrApprovedAt: Date;

  @Prop()
  hrComments: string;

  @Prop({ default: false })
  documentsVerified: boolean;

  // Post-leave
  @Prop({ default: false })
  isPostLeave: boolean;

  @Prop()
  postLeaveSubmissionDate: Date;

  // Final decision
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  approvedBy: mongoose.Types.ObjectId;

  @Prop()
  approvedAt: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  rejectedBy: mongoose.Types.ObjectId;

  @Prop()
  rejectedAt: Date;

  @Prop()
  rejectionReason: string;


  @Prop()
  cancelledAt: Date;

  @Prop()
  cancellationReason: string;

  // Modification tracking
  @Prop()
  lastModifiedAt: Date;

  @Prop({ type: [String], default: [] })
  modificationHistory: string[];

  // Flag for irregular patterns
  @Prop({ default: false })
  flaggedAsIrregular: boolean;

  @Prop()
  irregularityReason: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  flaggedIrregularBy: mongoose.Types.ObjectId;

  @Prop()
  flaggedIrregularAt: Date;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);