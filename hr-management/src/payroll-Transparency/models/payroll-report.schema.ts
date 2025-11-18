import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Department } from 'src/employee-organization-performancesubsystem/organization/models/department.schema';

@Schema({ timestamps: true, collection: 'payroll_reports' })
export class PayrollReport extends Document {
  @Prop({ required: true })
  periodMonth: number;

  @Prop({ required: true })
  periodYear: number;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId?: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  totalSalaries: number;

  @Prop({ required: true, min: 0 })
  totalTaxes: number;

  @Prop({ required: true, min: 0 })
  totalInsurance: number;

  @Prop({ required: true, min: 0 })
  totalAllowances: number;

  @Prop({ required: true, min: 0 })
  totalDeductions: number;

  @Prop({ required: true })
  generatedBy: string;
}

export const PayrollReportSchema = SchemaFactory.createForClass(PayrollReport);
