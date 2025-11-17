import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BankFileStatus = 'draft' | 'queued' | 'sent' | 'acknowledged' | 'failed';

@Schema({ timestamps: true, collection: 'bank_files' })
export class BankFile extends Document {
  @Prop({ required: true })
  payrollRunId!: string;

  @Prop({ required: true })
  fileName!: string;

  @Prop({ required: true, enum: ['ACH', 'SEPA', 'CSV', 'BAI2', 'CUSTOM'] })
  format!: string;

  @Prop({ required: true })
  bankName!: string;

  @Prop()
  bankCode?: string;

  @Prop()
  accountNumber?: string;

  @Prop({ min: 0, default: 0 })
  totalTransactions!: number;

  @Prop({ min: 0, default: 0 })
  totalAmount!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({
    required: true,
    enum: ['draft', 'queued', 'sent', 'acknowledged', 'failed'],
    default: 'draft',
  })
  status!: BankFileStatus;

  @Prop()
  submittedAt?: Date;

  @Prop()
  acknowledgedAt?: Date;

  @Prop()
  storagePath?: string;

  @Prop({ type: [String], default: [] })
  errorMessages?: string[];

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, unknown>;
}

export const BankFileSchema = SchemaFactory.createForClass(BankFile);
