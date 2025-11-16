import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'insurance_brackets' })
export class InsuranceBracket extends Document {
  @Prop({ required: true })
  salaryFrom: number;

  @Prop({ required: true })
  salaryTo: number;

  @Prop({ required: true })
  employerPercentage: number;

  @Prop({ required: true })
  employeePercentage: number;

  @Prop({ required: true, enum: ['draft', 'published'], default: 'draft' })
  status: 'draft' | 'published';

  @Prop({
    required: true,
    enum: ['payroll_manager', 'hr_manager'],
    default: 'hr_manager',
  })
  needsApprovalBy: 'payroll_manager' | 'hr_manager';

  @Prop({ default: false })
  approved: boolean;

  @Prop({ type: Date, default: null })
  approvedAt: Date | null;
}

export const InsuranceBracketSchema =
  SchemaFactory.createForClass(InsuranceBracket);
