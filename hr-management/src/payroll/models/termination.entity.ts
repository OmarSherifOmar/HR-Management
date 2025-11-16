import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TerminationStatus = 'pending' | 'scheduled' | 'processed' | 'cancelled' | 'failed';
export type TerminationReason =
  | 'redundancy'
  | 'performance'
  | 'misconduct'
  | 'retirement'
  | 'mutual'
  | 'restructuring'
  | 'other';

@Schema({ timestamps: true, collection: 'terminations' })
export class Termination {
  @Prop({ required: true })
  payrollRunId!: string;

  @Prop({ required: true })
  employeeId!: string;

  @Prop()
  employeeNumber?: string;

  @Prop({
    enum: ['redundancy', 'performance', 'misconduct', 'retirement', 'mutual', 'restructuring', 'other'],
  })
  reason?: TerminationReason;

  @Prop()
  reasonDetail?: string;

  @Prop()
  effectiveDate?: Date;

  @Prop()
  lastWorkingDate?: Date;

  @Prop({ required: true, enum: ['pending', 'scheduled', 'processed', 'cancelled', 'failed'], default: 'pending' })
  status!: TerminationStatus;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({ default: 0 })
  severanceAmount!: number;

  @Prop({ default: 0 })
  accruedLeavePayout!: number;

  @Prop({ default: 0 })
  noticePay!: number;

  @Prop()
  processedAt?: Date;

  @Prop()
  processedBy?: string;

  @Prop({ type: [String], default: [] })
  notes!: string[];

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;
}

export type TerminationDocument = HydratedDocument<Termination>;
export const TerminationSchema = SchemaFactory.createForClass(Termination);
