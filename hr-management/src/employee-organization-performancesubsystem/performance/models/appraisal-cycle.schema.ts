import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AppraisalCycleDocument = AppraisalCycle & Document;

@Schema({ timestamps: true })
export class AppraisalCycle {
  @Prop({ required: true }) 
   name: string; 
  @Prop({ required: true }) 
   key: string;  // "annual-2025"
  @Prop({ required: true })
   type: string; // "annual"|"semi-annual"|"probationary" 
  @Prop({ required: true })
   startsAt: Date;
  @Prop({ required: true })
   endsAt: Date;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'AppraisalTemplate' }] })
  templates: Types.ObjectId[]; 
  @Prop({ default: true }) 
  isActive?: boolean; 
  @Prop({ default: false }) 
  generated?: boolean; // forms generated for cycle
}

export const AppraisalCycleSchema = SchemaFactory.createForClass(AppraisalCycle);
AppraisalCycleSchema.index({ startsAt: 1, endsAt: 1 });
