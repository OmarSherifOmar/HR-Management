   import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
    import { Document, Types } from 'mongoose';

   @Schema({ timestamps: true, collection: 'insurance_brackets' })
export class InsuranceBracket extends Document {
  @Prop({
    required: true,
    enum: ['Health', 'SocialSecurity', 'Pension', 'Unemployment'],
  })
  insuranceType:
    | 'Health'
    | 'SocialSecurity'
    | 'Pension'
    | 'Unemployment';

  @Prop({ required: true })
  minSalary: number;

  @Prop({ required: true })
  maxSalary: number;

  @Prop({ required: true })
  employeeContributionPercent: number;

  @Prop({ required: true })
  employerContributionPercent: number;

  @Prop({ required: true })
  effectiveFrom: Date;

  @Prop()
  effectiveTo?: Date;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop({
    required: true,
    enum: ['Draft', 'PendingApproval', 'Active', 'Archived'],
    default: 'Draft',
  })
  status: 'Draft' | 'PendingApproval' | 'Active' | 'Archived';
}

export const InsuranceBracketSchema = SchemaFactory.createForClass(
  InsuranceBracket,
);
