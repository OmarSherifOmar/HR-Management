import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MSchema } from 'mongoose';
import { PayrollRun } from './run.entity';
import { Employee } from './employee.entity';

export type PayslipDocument = HydratedDocument<Payslip>;

@Schema()
export class Payslip {
  @Prop({ type: MSchema.Types.ObjectId, ref: 'PayrollRun', required: true })
  payrollRun: PayrollRun | MSchema.Types.ObjectId;

  @Prop({ type: MSchema.Types.ObjectId, ref: 'Employee', required: true })
  employee: Employee | MSchema.Types.ObjectId;

  @Prop({ required: true })
  netSalary: number;

  @Prop({ default: Date.now })
  generatedAt: Date;
}

export const PayslipSchema = SchemaFactory.createForClass(Payslip);