import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BankFileStatus =
  | 'draft'
  | 'pending'
  | 'generated'
  | 'delivered'
  | 'acknowledged'
  | 'failed';

export type BankFileType = 'ach' | 'sepa' | 'swift' | 'domestic';

@Schema({ timestamps: true, collection: 'bank_files' })
export class BankFile {
  @Prop({ required: true })
  payrollRunId!: string;

  @Prop({ required: true })
  batchId!: string;

  @Prop({ required: true, enum: ['ach', 'sepa', 'swift', 'domestic'] })
  fileType!: BankFileType;

  @Prop({ required: true })
  bankCode!: string;

  @Prop({ required: true })
  fileName!: string;

  @Prop()
  storagePath?: string;

  @Prop()
  checksum?: string;

  @Prop({ default: 0 })
  recordsCount!: number;

  @Prop({ default: 0 })
  totalAmount!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({
    required: true,
    enum: ['draft', 'pending', 'generated', 'delivered', 'acknowledged', 'failed'],
    default: 'draft',
  })
  status!: BankFileStatus;

  @Prop()
  generatedAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  acknowledgedAt?: Date;

  @Prop()
  errorMessage?: string;

  @Prop({ type: [String], default: [] })
  validationErrors!: string[];

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;
}

export type BankFileDocument = HydratedDocument<BankFile>;
export const BankFileSchema = SchemaFactory.createForClass(BankFile);
