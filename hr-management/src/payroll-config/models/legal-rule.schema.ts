import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'legal_rules' })
export class LegalRule extends Document {
  @Prop({ required: true })
  lawTitle: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  effectiveDate: Date;

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

export const LegalRuleSchema = SchemaFactory.createForClass(LegalRule);
