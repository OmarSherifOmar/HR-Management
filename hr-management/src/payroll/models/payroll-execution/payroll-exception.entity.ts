import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PayrollExceptionType =
  | 'missing_bank_account'
  | 'negative_salary'
  | 'salary_spike'
  | 'contract_expired'
  | 'validation_engine';

export type PayrollExceptionStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';

export type PayrollExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';

@Schema({ _id: false })
export class SalaryValidationSnapshot {
  @Prop()
  previousPayrollRunId?: string;

  @Prop({ default: 0 })
  previousAmount!: number;

  @Prop({ default: 0 })
  currentAmount!: number;

  @Prop({ default: 0 })
  delta!: number;

  @Prop({ default: 0 })
  deltaPercentage!: number;
}

export const SalaryValidationSnapshotSchema = SchemaFactory.createForClass(SalaryValidationSnapshot);

@Schema({ _id: false })
export class ValidationEngineMetadata {
  @Prop()
  engineVersion?: string;

  @Prop()
  ruleKey?: string;

  @Prop({ type: Object, default: {} })
  parameters!: Record<string, unknown>;

  @Prop({ type: [String], default: [] })
  triggeredValidators!: string[];
}

export const ValidationEngineMetadataSchema = SchemaFactory.createForClass(ValidationEngineMetadata);

@Schema({ timestamps: true, collection: 'payroll_exceptions' })
export class PayrollException {
  @Prop({ required: true })
  payrollRunId!: string;

  @Prop({ required: true })
  employeeId!: string;

  @Prop()
  employeeNumber?: string;

  @Prop({ required: true, enum: ['missing_bank_account', 'negative_salary', 'salary_spike', 'contract_expired', 'validation_engine'] })
  type!: PayrollExceptionType;

  @Prop({ required: true, enum: ['open', 'in_progress', 'resolved', 'dismissed'], default: 'open' })
  status!: PayrollExceptionStatus;

  @Prop({ required: true, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' })
  severity!: PayrollExceptionSeverity;

  @Prop()
  description?: string;

  @Prop({ default: false })
  requiresManualReview!: boolean;

  @Prop({ type: SalaryValidationSnapshotSchema })
  salarySnapshot?: SalaryValidationSnapshot;

  @Prop()
  salaryCurrency?: string;

  @Prop()
  detectedAt?: Date;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  resolvedBy?: string;

  @Prop()
  resolutionNotes?: string;

  @Prop({ type: ValidationEngineMetadataSchema })
  validationEngine?: ValidationEngineMetadata;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [String], default: [] })
  references!: string[];
}

export type PayrollExceptionDocument = HydratedDocument<PayrollException>;
export const PayrollExceptionSchema = SchemaFactory.createForClass(PayrollException);
