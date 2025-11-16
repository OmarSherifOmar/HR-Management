import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// Inputs from other subsystems: None (N/A)

export enum AllowanceCalcType {
  FIXED = 'FIXED',
  PERCENT = 'PERCENT',
}

@Schema({ timestamps: true, collection: 'allowances' })
export class Allowance extends Document {
  @Prop({ unique: true, required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: Object.values(AllowanceCalcType) })
  calcType: AllowanceCalcType;

  @Prop({ required: true, min: 0 })
  value: number;

  @Prop({ required: true })
  taxable: boolean;
}

export const AllowanceSchema = SchemaFactory.createForClass(Allowance);
