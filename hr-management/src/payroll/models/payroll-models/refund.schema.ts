import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefundType = 'CORRECTION' | 'REIMBURSEMENT';
export type RefundStatus = 'PENDING' | 'PAID';

@Schema({ timestamps: true, collection: 'refunds' })
export class Refund extends Document {
  @Prop({ type: Types.ObjectId, ref: 'HrEmployee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Claim' })
  relatedClaimId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PayrollException' })
  relatedDisputeId?: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({
    required: true,
    enum: ['CORRECTION', 'REIMBURSEMENT'],
    default: 'REIMBURSEMENT',
  })
  type: RefundType;

  @Prop({ required: true, enum: ['PENDING', 'PAID'], default: 'PENDING' })
  status: RefundStatus;

  @Prop()
  executionDate?: Date;

  @Prop({ default: false })
  reflectedInNextPayrollCycle: boolean;

  @Prop()
  processedBy?: string;

  @Prop()
  notes?: string;

  @Prop([
    {
      filename: { type: String, required: true },
      url: { type: String, required: true },
      contentType: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    },
  ])
  attachments?: Array<{
    filename: string;
    url: string;
    contentType?: string;
    uploadedAt?: Date;
  }>;
}

export const RefundSchema = SchemaFactory.createForClass(Refund);
