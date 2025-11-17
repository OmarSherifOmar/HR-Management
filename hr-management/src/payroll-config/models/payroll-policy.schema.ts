import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// Inputs from other subsystems: None (N/A) at configuration time

export enum PolicyType {
  MISCONDUCT = 'MISCONDUCT',
  LEAVE = 'LEAVE',
  ALLOWANCE = 'ALLOWANCE',
}

export enum PolicyStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
}

@Schema({ timestamps: true, collection: 'payroll_policies' })
export class PayrollPolicy extends Document {
  @Prop({ unique: true, required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: Object.values(PolicyType) })
  type: PolicyType;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  effectiveDate: Date;

  @Prop()
  lawReference?: string;

  @Prop({ min: 0, max: 100 })
  percentage?: number;

  @Prop({ min: 0 })
  fixedAmount?: number;

  @Prop({ min: 0 })
  threshold?: number;

  @Prop({ type: [String], default: [] })
  applicability: string[];

  @Prop({
    required: true,
    enum: Object.values(PolicyStatus),
    default: PolicyStatus.DRAFT,
  })
  status: PolicyStatus;
}

export const PayrollPolicySchema = SchemaFactory.createForClass(PayrollPolicy);
 