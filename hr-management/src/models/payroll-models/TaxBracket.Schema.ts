import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


@Schema({ timestamps: true, collection: 'tax_brackets' })
export class TaxBracket extends Document {
  @Prop({ type: Types.ObjectId, ref: 'TaxRule', required: true })
  taxRuleId: string;

  @Prop({ required: true })
  minIncome: number;

  @Prop({ required: true })
  maxIncome: number;

  @Prop({ required: true })
  ratePercent: number;
}

export const TaxBracketSchema = SchemaFactory.createForClass(TaxBracket);
