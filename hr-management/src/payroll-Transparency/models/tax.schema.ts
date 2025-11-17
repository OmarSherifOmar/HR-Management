import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'tax_records' })
export class TaxRecord extends Document {
  @Prop({ type: Types.ObjectId, ref: 'HrEmployee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, min: 0 })
  taxAmount: number;

  @Prop([
    {
      name: { type: String, required: true },
      amount: { type: Number, required: true, min: 0 },
      note: { type: String },
    },
  ])
  insuranceContributions: Array<{
    name: string;
    amount: number;
    note?: string;
  }>;
}

export const TaxRecordSchema = SchemaFactory.createForClass(TaxRecord);
