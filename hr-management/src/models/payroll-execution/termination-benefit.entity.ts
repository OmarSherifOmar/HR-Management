import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TerminationBenefitStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'paid'
  | 'cancelled'
  | 'failed';

export type TerminationBenefitComponentType =
  | 'severance'
  | 'accrued_leave'
  | 'notice_payment'
  | 'gratuity'
  | 'custom';

export type TerminationBenefitApprovalStage = 'hr_business_partner' | 'legal' | 'finance';

export type TerminationBenefitApprovalDecision = 'pending' | 'approved' | 'rejected';

export type ComplianceCheckStatus = 'pending' | 'passed' | 'failed';

export type TerminationReasonCategory =
  | 'redundancy'
  | 'performance'
  | 'misconduct'
  | 'retirement'
  | 'mutual'
  | 'resignation'
  | 'other';

export type ResignationSettlementStatus = 'pending' | 'processed' | 'rejected';

@Schema({ _id: false })
export class TerminationBenefitComponent {
  @Prop({
    required: true,
    enum: ['severance', 'accrued_leave', 'notice_payment', 'gratuity', 'custom'],
  })
  type!: TerminationBenefitComponentType;

  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({ default: false })
  taxable!: boolean;

  @Prop()
  costCenterId?: string;

  @Prop()
  description?: string;
}

export const TerminationBenefitComponentSchema =
  SchemaFactory.createForClass(TerminationBenefitComponent);

@Schema({ _id: false })
export class TerminationBenefitApprovalRecord {
  @Prop({
    required: true,
    enum: ['hr_business_partner', 'legal', 'finance'],
  })
  stage!: TerminationBenefitApprovalStage;

  @Prop({ required: true })
  approverId!: string;

  @Prop({
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  decision!: TerminationBenefitApprovalDecision;

  @Prop()
  decidedAt?: Date;

  @Prop()
  comment?: string;
}

export const TerminationBenefitApprovalRecordSchema =
  SchemaFactory.createForClass(TerminationBenefitApprovalRecord);

@Schema({ _id: false })
export class TerminationBenefitComplianceCheck {
  @Prop({ required: true })
  code!: string;

  @Prop()
  description?: string;

  @Prop({
    required: true,
    enum: ['pending', 'passed', 'failed'],
    default: 'pending',
  })
  status!: ComplianceCheckStatus;

  @Prop()
  checkedAt?: Date;

  @Prop()
  checkedBy?: string;

  @Prop()
  notes?: string;
}

export const TerminationBenefitComplianceCheckSchema =
  SchemaFactory.createForClass(TerminationBenefitComplianceCheck);

@Schema({ _id: false })
export class ResignationSettlement {
  @Prop({ default: 0 })
  pendingVacationPayout!: number;

  @Prop({ default: 0 })
  gratuityAmount!: number;

  @Prop({ default: 0 })
  recoveryAmount!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop()
  noticeServedThrough?: Date;

  @Prop({ default: false })
  noticeWaived!: boolean;

  @Prop({ default: false })
  exitInterviewCompleted!: boolean;

  @Prop({
    required: true,
    enum: ['pending', 'processed', 'rejected'],
    default: 'pending',
  })
  status!: ResignationSettlementStatus;

  @Prop()
  processedAt?: Date;

  @Prop()
  processedBy?: string;

  @Prop()
  remarks?: string;
}

export const ResignationSettlementSchema = SchemaFactory.createForClass(ResignationSettlement);

@Schema({ timestamps: true, collection: 'termination_benefits' })
export class TerminationBenefit {
  @Prop({ required: true })
  payrollRunId!: string;

  @Prop({ required: true })
  employeeId!: string;

  @Prop()
  employeeNumber?: string;

  @Prop({
    enum: ['redundancy', 'performance', 'misconduct', 'retirement', 'mutual', 'resignation', 'other'],
  })
  reasonCategory?: TerminationReasonCategory;

  @Prop()
  reasonDetail?: string;

  @Prop()
  terminationDate?: Date;

  @Prop()
  lastWorkingDate?: Date;

  @Prop()
  preparedBy?: string;

  @Prop()
  reviewedBy?: string;

  @Prop({ required: true, min: 0 })
  totalGrossAmount!: number;

  @Prop({ required: true, min: 0 })
  totalNetAmount!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({ type: [TerminationBenefitComponentSchema], default: [] })
  components!: TerminationBenefitComponent[];

  @Prop({ type: [TerminationBenefitComplianceCheckSchema], default: [] })
  complianceChecks!: TerminationBenefitComplianceCheck[];

  @Prop({ type: [TerminationBenefitApprovalRecordSchema], default: [] })
  approvals!: TerminationBenefitApprovalRecord[];

  @Prop({ type: ResignationSettlementSchema })
  resignationSettlement?: ResignationSettlement;

  @Prop({
    required: true,
    enum: ['draft', 'pending_approval', 'approved', 'scheduled', 'paid', 'cancelled', 'failed'],
    default: 'draft',
  })
  status!: TerminationBenefitStatus;

  @Prop()
  payoutScheduledDate?: Date;

  @Prop()
  payoutCompletedDate?: Date;

  @Prop()
  disbursementBatchId?: string;

  @Prop()
  failureReason?: string;

  @Prop({ default: false })
  flaggedForAudit!: boolean;

  @Prop({ type: [String], default: [] })
  adminNotes!: string[];

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;
}

export type TerminationBenefitDocument = HydratedDocument<TerminationBenefit>;
export const TerminationBenefitSchema = SchemaFactory.createForClass(TerminationBenefit);
