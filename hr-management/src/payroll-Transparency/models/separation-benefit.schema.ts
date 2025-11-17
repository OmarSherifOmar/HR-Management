import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// Input dependency: Offboarding (Severance rules/terms, legal formulas) 

export enum SeparationFormula {
  FIXED = 'FIXED',
  PER_YEAR = 'PER_YEAR',
}

@Schema({ timestamps: true, collection: 'separation_benefits' })
export class SeparationBenefit extends Document {
  @Prop({ unique: true, required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['FIXED', 'PER_YEAR'] })
  formula: 'FIXED' | 'PER_YEAR';

  @Prop({ required: true, min: 0 })
  value: number;
}

export const SeparationBenefitSchema = SchemaFactory.createForClass(SeparationBenefit);