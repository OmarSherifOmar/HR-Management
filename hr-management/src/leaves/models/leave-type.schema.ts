import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import { Employee } from '../../employee-organization-performancesubsystem/employee/models/employee.schema';

export type LeaveTypeDocument = HydratedDocument<LeaveType>;

export enum LeaveCategory {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  SICK = 'SICK',
  ANNUAL = 'ANNUAL',
  MATERNITY = 'MATERNITY',
  MARRIAGE = 'MARRIAGE',
  STUDY = 'STUDY',
  OTHER = 'OTHER',
}

export enum AccrualFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
  NONE = 'NONE',
}

@Schema({ timestamps: true })
export class LeaveType {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true, enum: LeaveCategory })
  category: LeaveCategory;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  requiresDocumentation: boolean;

  @Prop()
  documentationRequiredAfterDays: number;

  @Prop({required: true, default: false })
  deductFromAnnualBalance: boolean;

  @Prop({required: true, default: true })
  isPaidLeave: boolean;

  @Prop({required: true, enum: AccrualFrequency, default: AccrualFrequency.NONE })
  accrualFrequency: AccrualFrequency;

  @Prop()
  accrualRate: number;

  @Prop()
  maxCarryOver: number;

  @Prop()
  maxDaysPerYear: number;

  @Prop()
  minDaysNotice: number;

  @Prop()
  maxConsecutiveDays: number;

  @Prop({ default: true })
  excludeWeekends: boolean;

  @Prop({ default: true })
  excludeHolidays: boolean;

  @Prop()
  payrollPayCode: string;

  @Prop({type: mongoose.Schema.Types.ObjectId, required: true, ref : 'Employee'})
  createdBy: mongoose.Types.ObjectId;

  @Prop({type: mongoose.Schema.Types.ObjectId, required: true, ref : 'Employee'})
  updatedBy: mongoose.Types.ObjectId;
}

export const LeaveTypeSchema = SchemaFactory.createForClass(LeaveType);
