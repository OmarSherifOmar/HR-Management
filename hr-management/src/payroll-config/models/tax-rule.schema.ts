import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'tax_rules' })
export class TaxRule extends Document {
  @Prop({ required: true })
  taxRate: number;

  @Prop({ required: true })
  exemptionAmount: number;

  @Prop({ required: true })
  threshold: number;

  @Prop({ required: true, enum: ['draft', 'published'], default: 'draft' })
  status: 'draft' | 'published';

  @Prop({
    required: true,
    enum: ['payroll_manager', 'hr_manager'],
    default: 'payroll_manager',
  })
  needsApprovalBy: 'payroll_manager' | 'hr_manager';

  @Prop({ default: false })
  approved: boolean;

  @Prop({ type: Date, default: null })
  approvedAt: Date | null;
}

export const TaxRuleSchema = SchemaFactory.createForClass(TaxRule);
