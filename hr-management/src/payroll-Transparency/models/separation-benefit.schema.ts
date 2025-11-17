import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// Input dependency: Offboarding (Severance rules/terms, legal formulas) 

export enum SeparationFormula {
  FIXED = 'FIXED',
  PER_YEAR = 'PER_YEAR',
}

export enum SeparationBenefitStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
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

  @Prop({ 
    required: true, 
    enum: Object.values(SeparationBenefitStatus),
    default: SeparationBenefitStatus.DRAFT 
  })
  status: SeparationBenefitStatus;
}

export const SeparationBenefitSchema = SchemaFactory.createForClass(SeparationBenefit);