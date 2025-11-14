import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SigningBonusStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'disbursed'
  | 'cancelled'
  | 'failed';

export type SigningBonusInstallmentStatus = 'scheduled' | 'disbursed' | 'failed' | 'cancelled';

export type SigningBonusApprovalStage =
  | 'talent_acquisition'
  | 'hr_operations'
  | 'finance_controller';

export type SigningBonusApprovalDecision = 'pending' | 'approved' | 'rejected';

@Schema({ _id: false })
export class SigningBonusInstallment {
  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({ required: true })
  scheduledDate!: Date;

  @Prop()
  paidDate?: Date;

  @Prop()
  payrollTransactionId?: string;

  @Prop()
  note?: string;

  @Prop({
    required: true,
    enum: ['scheduled', 'disbursed', 'failed', 'cancelled'],
    default: 'scheduled',
  })
  status!: SigningBonusInstallmentStatus;
}

export const SigningBonusInstallmentSchema = SchemaFactory.createForClass(SigningBonusInstallment);

@Schema({ _id: false })
export class SigningBonusApprovalRecord {
  @Prop({
    required: true,
    enum: ['talent_acquisition', 'hr_operations', 'finance_controller'],
  })
  stage!: SigningBonusApprovalStage;

  @Prop({ required: true })
  approverId!: string;

  @Prop({
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  decision!: SigningBonusApprovalDecision;

  @Prop()
  decidedAt?: Date;

  @Prop()
  comment?: string;
}

export const SigningBonusApprovalRecordSchema =
  SchemaFactory.createForClass(SigningBonusApprovalRecord);

@Schema({ timestamps: true, collection: 'signing_bonus_payouts' })
export class SigningBonus {
  @Prop({ required: true })
  payrollRunId!: string;

  @Prop({ required: true })
  employeeId!: string;

  @Prop()
  employeeNumber?: string;

  @Prop()
  offerId?: string;

  @Prop()
  hiringManagerId?: string;

  @Prop({ required: true, min: 0 })
  totalAmount!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop()
  eligibilityReason?: string;

  @Prop({ default: false })
  taxable!: boolean;

  @Prop()
  targetPayoutDate?: Date;

  @Prop()
  disbursedAt?: Date;

  @Prop()
  disbursedBy?: string;

  @Prop({
    required: true,
    enum: ['draft', 'pending_approval', 'approved', 'scheduled', 'disbursed', 'cancelled', 'failed'],
    default: 'draft',
  })
  status!: SigningBonusStatus;

  @Prop()
  failureReason?: string;

  @Prop({ default: false })
  flaggedForReview!: boolean;

  @Prop({ type: [SigningBonusInstallmentSchema], default: [] })
  installments!: SigningBonusInstallment[];

  @Prop({ type: [SigningBonusApprovalRecordSchema], default: [] })
  approvals!: SigningBonusApprovalRecord[];

  @Prop({ type: [String], default: [] })
  notes!: string[];

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;
}

export type SigningBonusDocument = HydratedDocument<SigningBonus>;
export const SigningBonusSchema = SchemaFactory.createForClass(SigningBonus);
