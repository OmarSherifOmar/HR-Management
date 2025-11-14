import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'legal_deduction_rules' })
export class LegalDeductionRule extends Document {
  @Prop({ required: true })
  deductionName: string;

  @Prop({
    required: true,
    enum: ['Penalty', 'UnpaidLeave', 'StatutoryFee'],
  })
  deductionType: 'Penalty' | 'UnpaidLeave' | 'StatutoryFee';

  @Prop({
    required: true,
    enum: ['PercentageOfBasic', 'PercentageOfGross', 'FixedAmount'],
  })
  calculationMethod:
    | 'PercentageOfBasic'
    | 'PercentageOfGross'
    | 'FixedAmount';

  @Prop({ required: true })
  value: number;

  @Prop({
    required: true,
    enum: ['AllEmployees', 'SpecificContractTypes'],
  })
  appliesTo: 'AllEmployees' | 'SpecificContractTypes';

  @Prop({ required: true })
  effectiveFrom: Date;

  @Prop()
  effectiveTo?: Date;

  @Prop({ required: true })
  createdBy: string;

  @Prop({
    required: true,
    enum: ['Draft', 'PendingApproval', 'Active', 'Archived'],
    default: 'Draft',
  })
  status: 'Draft' | 'PendingApproval' | 'Active' | 'Archived';
}

export const LegalDeductionRuleSchema =
  SchemaFactory.createForClass(LegalDeductionRule);
