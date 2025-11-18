import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Employee } from '../../employee-organization-performancesubsystem/employee/models/employee.schema';
import { Payslip } from '../../payroll-processing/models/payslip.schema';
@Schema({ timestamps: true, collection: 'salary_history' })
export class SalaryHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  month: number;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, min: 0 })
  grossSalary: number;

  @Prop({ required: true, min: 0 })
  netSalary: number;

  @Prop({ type: Types.ObjectId, ref: 'Payslip' })
  payslipId?: Types.ObjectId;
}

export const SalaryHistorySchema = SchemaFactory.createForClass(SalaryHistory);
