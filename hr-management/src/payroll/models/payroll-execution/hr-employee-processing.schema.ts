import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HREventType = 'new_hire' | 'termination' | 'resignation' | 'rehire';
export type HRProcessStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type EmployeeFetchStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

@Schema({ _id: false })
export class SigningBonusDetails {
  @Prop({ default: 0 })
  amount!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop()
  eligibilityReason?: string;

  @Prop()
  approvedBy?: string;

  @Prop({ default: false })
  disbursed!: boolean;

  @Prop()
  processedAt?: Date;

  @Prop()
  notes?: string;
}

export const SigningBonusDetailsSchema = SchemaFactory.createForClass(SigningBonusDetails);

@Schema({ _id: false })
export class ResignationBenefitDetails {
  @Prop({ default: 0 })
  pendingVacationPayout!: number;

  @Prop({ default: 0 })
  gratuityAmount!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop()
  noticeServedThrough?: Date;

  @Prop({ default: false })
  processed!: boolean;

  @Prop()
  processedAt?: Date;

  @Prop()
  approvedBy?: string;
}

export const ResignationBenefitDetailsSchema =
  SchemaFactory.createForClass(ResignationBenefitDetails);

@Schema({ _id: false })
export class TerminationBenefitDetails {
  @Prop({ default: 0 })
  severanceAmount!: number;

  @Prop({ default: 0 })
  accruedLeavePayout!: number;

  @Prop({ default: 0 })
  cobraSubsidy!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop()
  effectiveDate?: Date;

  @Prop({ default: false })
  processed!: boolean;

  @Prop()
  processedAt?: Date;

  @Prop()
  approvedBy?: string;
}

export const TerminationBenefitDetailsSchema =
  SchemaFactory.createForClass(TerminationBenefitDetails);

@Schema({ _id: false })
export class EmployeeFetchSnapshot {
  @Prop({
    enum: ['not_started', 'in_progress', 'completed', 'failed'],
    default: 'not_started',
  })
  status!: EmployeeFetchStatus;

  @Prop()
  triggeredBy?: string;

  @Prop()
  triggeredAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ type: [String], default: [] })
  sources!: string[];

  @Prop({ type: [String], default: [] })
  errors!: string[];
}

export const EmployeeFetchSnapshotSchema = SchemaFactory.createForClass(EmployeeFetchSnapshot);

@Schema({ timestamps: true, collection: 'hr_event_processing' })
export class HREventProcessing {
  @Prop({ required: true })
  payrollRunId!: string;

  @Prop({ required: true })
  employeeId!: string;

  @Prop()
  employeeNumber?: string;

  @Prop({ required: true, enum: ['new_hire', 'termination', 'resignation', 'rehire'] })
  eventType!: HREventType;

  @Prop({ required: true, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' })
  status!: HRProcessStatus;

  @Prop()
  effectiveDate?: Date;

  @Prop()
  lastWorkingDate?: Date;

  @Prop()
  departmentId?: string;

  @Prop()
  managerId?: string;

  @Prop({ type: EmployeeFetchSnapshotSchema, default: () => ({}) })
  employeeFetch!: EmployeeFetchSnapshot;

  @Prop({ type: [String], default: [] })
  detectionSources!: string[];

  @Prop()
  detectedAt?: Date;

  @Prop()
  processedBy?: string;

  @Prop()
  processedAt?: Date;

  @Prop({ type: SigningBonusDetailsSchema })
  signingBonus?: SigningBonusDetails;

  @Prop({ type: ResignationBenefitDetailsSchema })
  resignationBenefit?: ResignationBenefitDetails;

  @Prop({ type: TerminationBenefitDetailsSchema })
  terminationBenefit?: TerminationBenefitDetails;

  @Prop({ type: [String], default: [] })
  anomalies!: string[];

  @Prop({ type: [String], default: [] })
  reviewNotes!: string[];

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;
}

export type HREventProcessingDocument = HydratedDocument<HREventProcessing>;
export const HREventProcessingSchema = SchemaFactory.createForClass(HREventProcessing);
