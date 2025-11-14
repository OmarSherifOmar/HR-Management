import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


@Schema({ timestamps: true, collection: 'compliance_changes' })
export class ComplianceChangeLog extends Document {
  @Prop({
    required: true,
    enum: ['TaxRule', 'InsuranceBracket', 'LegalDeductionRule'],
  })
  entityType: 'TaxRule' | 'InsuranceBracket' | 'LegalDeductionRule';

  @Prop({ required: true })
  entityId: string;

  @Prop({
    required: true,
    enum: ['Create', 'Update', 'Delete'],
  })
  action: 'Create' | 'Update' | 'Delete';

  @Prop({ required: true })
  changedBy: string;

  @Prop({ type: Object })
  oldValue?: Record<string, any>;

  @Prop({ type: Object })
  newValue?: Record<string, any>;
}

export const ComplianceChangeLogSchema =
  SchemaFactory.createForClass(ComplianceChangeLog);
