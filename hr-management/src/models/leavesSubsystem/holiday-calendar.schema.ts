import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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

  @Prop({ default: false })
  isRecurring: boolean;

  @Prop()
  recurringPattern: string;

  @Prop({ type: [String] })
  applicableRegions: string[];

  @Prop({ type: [String] })
  applicableDepartments: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const HolidayCalendarSchema = SchemaFactory.createForClass(HolidayCalendar);
