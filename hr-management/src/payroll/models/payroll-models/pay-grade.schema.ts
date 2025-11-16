import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'pay_grades' })
export class PayGrade extends Document {
  @Prop({ unique: true, required: true })
  code: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, min: 0 })
  grossMonthly: number;

  @Prop({ required: true, type: [String] })
  allowedPayTypes: string[];
}

export const PayGradeSchema = SchemaFactory.createForClass(PayGrade);
