import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PayrollPeriodDocument = HydratedDocument<PayrollPeriod>;

export enum PayrollPeriodStatus {
  PENDING = 'pending',            
  APPROVED = 'approved',          
  REJECTED = 'rejected',          
  LOCKED = 'locked',              
  UNLOCKED = 'unlocked',   
  CLOSED = 'closed',              
}

@Schema({ timestamps: true })
export class PayrollPeriod {
  @Prop({ required: true })
  month: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;


  @Prop({ 
    type: String, 
    enum: PayrollPeriodStatus, 
    default: PayrollPeriodStatus.PENDING 
  })
  status: PayrollPeriodStatus;

  @Prop()
  rejectionReason?: string;


  @Prop({ type: Types.ObjectId, ref: 'Employee', required: false })
  approvedBy?: Types.ObjectId;


  @Prop({ default: false })
  isLocked: boolean;

  @Prop({ default: false })
  isClosed: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: false })
  lockedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: false })
  unlockedBy?: Types.ObjectId;

}

export const PayrollPeriodSchema = SchemaFactory.createForClass(PayrollPeriod);
