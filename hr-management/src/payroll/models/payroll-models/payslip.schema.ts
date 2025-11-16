import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PayslipStatus = 'PROCESSED' | 'PENDING' | 'DISPUTED';

@Schema({ timestamps: true, collection: 'payslips' })
export class Payslip extends Document {
  @Prop({ type: Types.ObjectId, ref: 'HrEmployee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  periodStart: Date;

  @Prop({ required: true })
  periodEnd: Date;

  @Prop()
  payDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'PayGrade' })
  payGradeId?: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  basicSalary: number;

  @Prop({ required: true, min: 0 })
  grossSalary: number;

  @Prop({ required: true, min: 0 })
  netSalary: number;

  @Prop([
    {
      name: { type: String, required: true },
      code: { type: String },
      amount: { type: Number, required: true, min: 0 },
      taxable: { type: Boolean, default: false },
      note: { type: String },
    },
  ])
  allowances: Array<{
    name: string;
    code?: string;
    amount: number;
    taxable?: boolean;
    note?: string;
  }>;

  @Prop([
    {
      name: { type: String, required: true },
      code: { type: String },
      amount: { type: Number, required: true, min: 0 },
      type: { type: String },
      note: { type: String },
    },
  ])
  deductions: Array<{
    name: string;
    code?: string;
    amount: number;
    type?: string;
    note?: string;
  }>;

  @Prop({
    required: true,
    enum: ['PROCESSED', 'PENDING', 'DISPUTED'],
    default: 'PENDING',
  })
  status: PayslipStatus;

  @Prop([
    {
      filename: { type: String, required: true },
      url: { type: String, required: true },
      contentType: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    },
  ])
  attachments: Array<{
    filename: string;
    url: string;
    contentType?: string;
    uploadedAt?: Date;
  }>;

  @Prop({ type: [Types.ObjectId], ref: 'Claim' })
  claimRefs?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'PayrollException' })
  disputeRefs?: Types.ObjectId[];

  @Prop()
  processedBy?: string;

  @Prop()
  processedAt?: Date;
}

export const PayslipSchema = SchemaFactory.createForClass(Payslip);
