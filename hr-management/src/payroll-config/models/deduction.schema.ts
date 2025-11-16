import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// Inputs from other subsystems: None (N/A) at configuration time

export enum DeductionCalcType {
  FIXED = 'FIXED',
  PERCENT = 'PERCENT',
}

@Schema({ timestamps: true, collection: 'deductions' })
export class Deduction extends Document {
  @Prop({ unique: true, required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: Object.values(DeductionCalcType) })
  calcType: DeductionCalcType;

  @Prop({ required: true, min: 0 })
  value: number;
}

export const DeductionSchema = SchemaFactory.createForClass(Deduction);
