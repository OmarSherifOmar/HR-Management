import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// Inputs from other subsystems: None (N/A) at configuration time 

export enum DeductionCalcType {
  FIXED = 'FIXED',
  PERCENT = 'PERCENT',
}

export enum DeductionStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
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

  @Prop({ 
    required: true, 
    enum: Object.values(DeductionStatus),
    default: DeductionStatus.DRAFT 
  })
  status: DeductionStatus;
}

export const DeductionSchema = SchemaFactory.createForClass(Deduction);
 
