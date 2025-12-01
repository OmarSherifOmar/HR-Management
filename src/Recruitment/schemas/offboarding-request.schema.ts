import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

/**
 * Inline Enums (No External References)
 */
export enum ApprovalDecision {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export enum OffboardingStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export enum OffboardingType {
  RESIGNATION = 'resignation',
  TERMINATION = 'termination',
  RETIREMENT = 'retirement',
  CONTRACT_END = 'contract_end',
}

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
 */
@Schema({ timestamps: true, collection: 'offboarding_requests' })
export class OffboardingRequest {
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Employee',
    index: true,
  })
  employeeId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: String })
  reason: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(OffboardingType),
  })
  type: OffboardingType;

  @Prop({ required: true, type: Date })
  effectiveDate: Date;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(OffboardingStatus),
    default: OffboardingStatus.PENDING,
  })
  status: OffboardingStatus;

  @Prop({ type: [ApprovalSchema], default: [] })
  approvals: Approval[];

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: Date, default: Date.now })
  submittedDate: Date;

  @Prop({ type: Date })
  completedDate?: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Employee',
  })
  submittedBy?: MongooseSchema.Types.ObjectId;

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

// Indexes
OffboardingRequestSchema.index({ employeeId: 1, status: 1 });
OffboardingRequestSchema.index({ effectiveDate: 1 });
OffboardingRequestSchema.index({ type: 1 });
OffboardingRequestSchema.index({ status: 1 });