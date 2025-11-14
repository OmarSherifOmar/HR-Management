import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'pay_types' })
export class PayType extends Document {
  @Prop({ unique: true, required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: true })
  taxable: boolean;
}

export const PayTypeSchema = SchemaFactory.createForClass(PayType);