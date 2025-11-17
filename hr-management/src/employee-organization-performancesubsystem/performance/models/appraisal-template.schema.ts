import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RatingScale } from './rating-scale.schema';

export type AppraisalTemplateDocument = AppraisalTemplate & Document;

@Schema({ timestamps: true })
export class AppraisalTemplate {
  @Prop({ required: true, unique: true })
   key: string; 
  @Prop({ required: true })
   name: string;
  @Prop()
   description?: string;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'RatingScale' }] }) 
   ratingScales?: Types.ObjectId[];
  @Prop({ default: true })
   isActive?: boolean;
   @Prop([{
  title: String,
  items: [{
    id: String,
    label: String,
    guidance: String,
    ratingScale: { type: Types.ObjectId, ref: 'RatingScale' },

    allowComments: { type: Boolean, default: true },
    allowExamples: { type: Boolean, default: true },
    allowDevelopmentRecs: { type: Boolean, default: true }
  }]
}])
sections: any[];
}

export const AppraisalTemplateSchema = SchemaFactory.createForClass(AppraisalTemplate);
