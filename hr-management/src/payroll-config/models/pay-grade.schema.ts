import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// Input dependency: Organizational Structure (Job Grade/Band) 

export enum PayGradeStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
}

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

  @Prop({ 
    required: true, 
    enum: Object.values(PayGradeStatus),
    default: PayGradeStatus.DRAFT 
  })
  status: PayGradeStatus;
}

export const PayGradeSchema = SchemaFactory.createForClass(PayGrade);