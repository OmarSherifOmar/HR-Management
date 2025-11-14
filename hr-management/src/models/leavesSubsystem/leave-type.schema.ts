import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LeaveTypeDocument = HydratedDocument<LeaveType>;

export enum LeaveCategory {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  SICK = 'SICK',
  ANNUAL = 'ANNUAL',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  MISSION = 'MISSION',
  MARRIAGE = 'MARRIAGE',
  COMPASSIONATE = 'COMPASSIONATE',
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

  @Prop({ default: false })
  deductFromAnnualBalance: boolean;

  @Prop({ default: true })
  isPaidLeave: boolean;

  @Prop({ enum: AccrualFrequency, default: AccrualFrequency.NONE })
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

  @Prop({ default: false })
  excludeWeekends: boolean;

  @Prop({ default: false })
  excludePublicHolidays: boolean;

  @Prop()
  payrollPayCode: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const LeaveTypeSchema = SchemaFactory.createForClass(LeaveType);
