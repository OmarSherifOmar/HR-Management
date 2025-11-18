import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
// Input dependency: Onboarding (Contract details / bonus eligibility flags) 

export enum BonusStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
}

@Schema({ timestamps: true, collection: 'bonuses' })
export class Bonus extends Document {
  @Prop({ unique: true, required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ 
    required: true, 
    enum: Object.values(BonusStatus),
    default: BonusStatus.DRAFT 
  })
  status: BonusStatus;
  
  @Prop ({ type: mongoose.Schema.Types.ObjectId, ref: 'Onboarding', required: true })
  onboardingId: mongoose.Types.ObjectId;
}

export const BonusSchema = SchemaFactory.createForClass(Bonus); 