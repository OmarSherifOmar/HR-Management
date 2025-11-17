import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// Inputs from other subsystems: None (N/A) 

export enum AllowanceCalcType {
  FIXED = 'FIXED',
  PERCENT = 'PERCENT',
}

export enum AllowanceStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
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

  @Prop({ 
    required: true, 
    enum: Object.values(AllowanceStatus),
    default: AllowanceStatus.DRAFT 
  })
  status: AllowanceStatus;
}

export const AllowanceSchema = SchemaFactory.createForClass(Allowance);