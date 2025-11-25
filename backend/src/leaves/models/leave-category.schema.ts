import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LeaveCategoryDocument = HydratedDocument<LeaveCategory>;

@Schema({ timestamps: true })
export class LeaveCategory {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;
}

export const LeaveCategorySchema = SchemaFactory.createForClass(LeaveCategory);
