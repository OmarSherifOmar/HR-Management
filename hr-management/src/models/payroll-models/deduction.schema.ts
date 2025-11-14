import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'deductions' })
export class Deduction extends Document {
  @Prop({ unique: true, required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['FIXED', 'PERCENT'] })
  calcType: 'FIXED' | 'PERCENT';

  @Prop({ required: true, min: 0 })
  value: number;
}

export const DeductionSchema = SchemaFactory.createForClass(Deduction);