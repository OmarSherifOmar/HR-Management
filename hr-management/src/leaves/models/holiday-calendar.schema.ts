import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';

export type HolidayCalendarDocument = HydratedDocument<HolidayCalendar>;

export enum HolidayType {
  PUBLIC_HOLIDAY = 'PUBLIC_HOLIDAY',
  COMPANY_HOLIDAY = 'COMPANY_HOLIDAY',
  REGIONAL_HOLIDAY = 'REGIONAL_HOLIDAY',
}

@Schema({ timestamps: true })
export class HolidayCalendar {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, enum: HolidayType })
  type: HolidayType;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, default: false })
  isRecurring: boolean;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  createdBy: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  updatedBy: mongoose.Types.ObjectId;
}

export const HolidayCalendarSchema = SchemaFactory.createForClass(HolidayCalendar);
