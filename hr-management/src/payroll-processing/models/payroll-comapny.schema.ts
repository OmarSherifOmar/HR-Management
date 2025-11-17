import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type PayrollCompanyDocument = HydratedDocument<PayrollCompany>;

@Schema({ timestamps: true })
export class PayrollCompany {

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  code: string;

 
  @Prop({ default: 'monthly' })
  payrollCycle: 'monthly' | 'weekly';

  @Prop({ default: 25 })
  defaultPayDay: number;

  @Prop({ default: 'EGP' })
  currency: string;
}

export const PayrollCompanySchema = SchemaFactory.createForClass(PayrollCompany);
