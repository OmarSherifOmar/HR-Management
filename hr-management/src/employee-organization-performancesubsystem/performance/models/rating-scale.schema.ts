import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RatingScaleDocument = RatingScale & Document;

@Schema({ timestamps: true })
export class RatingScale {
  @Prop({ required: true, unique: true })
   key: string; 
  @Prop({ required: true })
   name: string;
  @Prop()
  description?: string;
  
  @Prop({ default: true }) 
  isActive?: boolean;
}

export const RatingScaleSchema = SchemaFactory.createForClass(RatingScale);
