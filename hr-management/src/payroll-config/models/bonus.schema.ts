import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// Input dependency: Onboarding (Contract details / bonus eligibility flags)

@Schema({ timestamps: true, collection: 'bonuses' })
export class Bonus extends Document {
  @Prop({ unique: true, required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 0 })
  amount: number;
}

export const BonusSchema = SchemaFactory.createForClass(Bonus); 