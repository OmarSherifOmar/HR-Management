import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as Mongoose from 'mongoose';
import {PayrollRun} from './run.schema';
import {Employee} from '../../employee-organization-performancesubsystem/employee/models/employee.schema';
import {Department} from '../../employee-organization-performancesubsystem/organization/models/department.schema';

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

  @Prop({ type: Mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  approvedBy?: Mongoose.Types.ObjectId;

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

  @Prop({ type: Mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  approvedBy?: Mongoose.Types.ObjectId;
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

  @Prop({ type: Mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  approvedBy?: Mongoose.Types.ObjectId;
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
  @Prop({ required: true, type: Mongoose.Schema.Types.ObjectId, ref: 'PayrollRun' })
  payrollRunId!: Mongoose.Types.ObjectId;

  @Prop({ required: true, type: Mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  employeeId!: Mongoose.Types.ObjectId;

  @Prop()
  employeeNumber?: string;

  @Prop({ required: true, enum: ['new_hire', 'termination', 'resignation', 'rehire'] })
  eventType!: HREventType;

  @Prop({
    required: true,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending',
  })
  status!: HRProcessStatus;

  @Prop()
  effectiveDate?: Date;

  @Prop()
  lastWorkingDate?: Date;

  @Prop({ type: Mongoose.Schema.Types.ObjectId, ref: 'Department' })
  departmentId?: Mongoose.Types.ObjectId;

  @Prop({ type: Mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  managerId?: Mongoose.Types.ObjectId;

  @Prop({ type: EmployeeFetchSnapshotSchema, default: () => ({}) })
  employeeFetch!: EmployeeFetchSnapshot;

  @Prop({ type: [String], default: [] })
  detectionSources!: string[];

  @Prop()
  detectedAt?: Date;

  @Prop({ type: Mongoose.Schema.Types.ObjectId, ref: 'Employee' })
  processedBy?: Mongoose.Types.ObjectId;

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
