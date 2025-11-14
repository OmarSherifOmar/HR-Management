import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type DelegationDocument = HydratedDocument<Delegation>;

export enum DelegationStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class Delegation {
  // Manager who is delegating their approval authority (e.g., on leave/absent)
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  managerId: mongoose.Types.ObjectId;

  // Person who will approve on behalf of the manager
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  delegateId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ enum: DelegationStatus, default: DelegationStatus.ACTIVE })
  status: DelegationStatus;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  createdBy: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  updatedBy: mongoose.Types.ObjectId;
}

export const DelegationSchema = SchemaFactory.createForClass(Delegation);

// Create indexes for efficient querying
DelegationSchema.index({ managerId: 1, status: 1 });
DelegationSchema.index({ delegateId: 1, status: 1 });
DelegationSchema.index({ startDate: 1, endDate: 1, status: 1 });
