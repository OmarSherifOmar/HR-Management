import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Employee } from '../../employee-organization-performancesubsystem/employee/models/employee.schema';

export type DelegationDocument = HydratedDocument<Delegation>;

export enum DelegationStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class Delegation {
  // Manager who is delegating their approval authority (e.g., on leave/absent)
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true})
  managerId: mongoose.Types.ObjectId;

  // Person who will approve on behalf of the manager
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true})
  delegateId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, enum: DelegationStatus, default: DelegationStatus.ACTIVE })
  status: DelegationStatus;

  @Prop()
  reason: string;

  @Prop({required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  createdBy: mongoose.Types.ObjectId;

  @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  updatedBy: mongoose.Types.ObjectId;
}

export const DelegationSchema = SchemaFactory.createForClass(Delegation);