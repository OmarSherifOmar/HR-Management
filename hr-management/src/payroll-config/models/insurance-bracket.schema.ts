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
// Phase 5
   @Prop({ enum: ['draft', 'approved', 'rejected'], default: 'draft' })
  approvalStatus: 'draft' | 'approved' | 'rejected';

  @Prop({ type: String, default: null })
  hrReviewComment: string | null;

  @Prop({ type: String, default: null })
  approvedBy: string | null;

  @Prop({ type: Date, default: null })
  rejectedAt: Date | null;

  @Prop({ type: String, default: null })
  updatedBy: string | null;
}

export const InsuranceBracketSchema =
  SchemaFactory.createForClass(InsuranceBracket);
