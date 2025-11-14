import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaxRuleDocument = TaxRule & Document;

@Schema({ timestamps: true, collection: 'tax_rules' })
export class TaxRule {
  @Prop({ required: true })
  country: string;

  @Prop({
    required: true,
    enum: ['Income', 'SocialSecurity', 'VAT', 'LocalTax'],
  })
  taxType: 'Income' | 'SocialSecurity' | 'VAT' | 'LocalTax';

  @Prop({
    required: true,
    enum: ['Percentage', 'FixedAmount', 'ProgressiveBracket'],
  })
  rateType: 'Percentage' | 'FixedAmount' | 'ProgressiveBracket';

  @Prop()
  rateValue?: number; // null for brackets

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

export const TaxRuleSchema = SchemaFactory.createForClass(TaxRule);
