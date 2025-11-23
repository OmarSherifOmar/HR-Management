import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { DraftEntry } from './draft-entry.schema';
import { PayrollException } from './payroll-exception.schema';
import { PayrollApprovalWorkflow } from './payroll-approval-workflow.schema';
import { Payslip } from './payslip.schema';

export type PayrollRunDocument = HydratedDocument<PayrollRun>;

@Schema()
export class PayrollRun {
  @Prop({ required: true })
  periodStart: Date;

  @Prop({ required: true })
  periodEnd: Date;

  @Prop({ default: 'pending' })
  status: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'DraftEntry' }] })
  draftEntries?: DraftEntry[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'PayrollException' }] })
  exceptions?: PayrollException[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'PayrollApprovalWorkflow' }] })
  approvals?: PayrollApprovalWorkflow[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Payslip' }] })
  payslips?: Payslip[];
}

export const PayrollRunSchema = SchemaFactory.createForClass(PayrollRun);

