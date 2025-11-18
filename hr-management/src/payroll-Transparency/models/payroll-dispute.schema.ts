import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Employee } from '../../employee-organization-performancesubsystem/employee/models/employee.schema';
import { Payslip } from './payslip.schema';
export type DisputeStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESOLVED';

@Schema({ timestamps: true, collection: 'payroll_disputes' })
export class PayrollDispute extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payslip', required: true })
  payslipId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['DEDUCTION_ERROR', 'ALLOWANCE_ERROR', 'TAX_ERROR', 'NET_SALARY_ERROR', 'OTHER'],
  })
  disputeType: string;

  @Prop({ required: true })
  description: string;

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

  @Prop({
    required: true,
    enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESOLVED'],
    default: 'PENDING',
  })
  status: DisputeStatus;

  @Prop()
  specialistComment?: string;

  @Prop()
  managerDecision?: string;

  @Prop()
  resolvedAt?: Date;
}

export const PayrollDisputeSchema = SchemaFactory.createForClass(PayrollDispute);
