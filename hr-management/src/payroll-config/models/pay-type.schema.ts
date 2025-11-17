import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// Inputs from other subsystems: None (N/A) 

export enum PayTypeStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
}

@Schema({ timestamps: true, collection: 'pay_types' })
export class PayType extends Document {
  @Prop({ unique: true, required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: true })
  taxable: boolean;

  @Prop({ 
    required: true, 
    enum: Object.values(PayTypeStatus),
    default: PayTypeStatus.DRAFT 
  })
  status: PayTypeStatus;
}

export const PayTypeSchema = SchemaFactory.createForClass(PayType);