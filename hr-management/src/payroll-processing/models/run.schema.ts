import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { PayrollDraftEntry } from './draft-entry.schema';
import { PayrollException } from './exception.schema';
import { PayrollApproval } from './approval.schema';
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

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'PayrollDraftEntry' }] })
  draftEntries?: any[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'PayrollException' }] })
  exceptions?: PayrollException[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'PayrollApproval' }] })
  approvals?: PayrollApproval[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Payslip' }] })
  payslips?: Payslip[];
}

export const PayrollRunSchema = SchemaFactory.createForClass(PayrollRun);

