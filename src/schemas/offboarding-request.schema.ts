import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OffboardingType } from '../enums/offboarding-type.enum';
import { OffboardingStatus } from '../enums/offboarding-status.enum';
import { ApprovalDecision } from '../enums/approval-decision.enum';

/**
 * Approval Schema - embedded in OffboardingRequest
 */
@Schema({ _id: false })
export class Approval {
  @Prop({ required: true, type: String })
  role: string;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Employee',
  })
  approverId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: Date, default: Date.now })
  timestamp: Date;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(ApprovalDecision),
    default: ApprovalDecision.PENDING,
  })
  decision: ApprovalDecision;

  @Prop({ type: String })
  comments?: string;
}

export const ApprovalSchema = SchemaFactory.createForClass(Approval);

/**
 * Offboarding Request Schema
 * Manages employee exit process (resignation/termination)
 */
@Schema({ timestamps: true, collection: 'offboarding_requests' })
export class OffboardingRequest {
  // Employee being offboarded (references Employee Profile)
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Employee',
    index: true,
  })
  employeeId: MongooseSchema.Types.ObjectId;

  // Reason for leaving
  @Prop({ required: true, type: String })
  reason: string;

  // Type of offboarding
  @Prop({
    required: true,
    type: String,
    enum: Object.values(OffboardingType),
  })
  type: OffboardingType;

  // Last working day
  @Prop({ required: true, type: Date })
  effectiveDate: Date;

  // Current status of offboarding process
  @Prop({
    required: true,
    type: String,
    enum: Object.values(OffboardingStatus),
    default: OffboardingStatus.PENDING,
  })
  status: OffboardingStatus;

  // Multi-level approval workflow
  @Prop({ type: [ApprovalSchema], default: [] })
  approvals: Approval[];

  // Additional notes
  @Prop({ type: String })
  notes?: string;

  // When offboarding was initiated
  @Prop({ type: Date, default: Date.now })
  submittedDate: Date;

  // When offboarding was completed
  @Prop({ type: Date })
  completedDate?: Date;

  // Who initiated the offboarding
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Employee' })
  submittedBy?: MongooseSchema.Types.ObjectId;

  // Integration metadata (payroll, IT, org structure results)
  @Prop({ type: Object })
  metadata?: {
    finalSettlementId?: string;
    accessRevocationDate?: Date;
    positionUpdated?: boolean;
    exitInterviewCompleted?: boolean;
    assetsReturned?: boolean;
    [key: string]: any;
  };
}

export type OffboardingRequestDocument = OffboardingRequest & Document;
export const OffboardingRequestSchema =
  SchemaFactory.createForClass(OffboardingRequest);

// Indexes for query optimization
OffboardingRequestSchema.index({ employeeId: 1, status: 1 });
OffboardingRequestSchema.index({ effectiveDate: 1 });
OffboardingRequestSchema.index({ type: 1 });
OffboardingRequestSchema.index({ status: 1 });
