import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum HolidayType {
  PUBLIC = 'public',
  COMPANY = 'company',
  REST_DAY = 'rest-day',
}

@Schema({ timestamps: true })
export class HolidayCalendar extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  year: number;

  // Dependency note:
  // Attendance must check this array BEFORE calculating
  // lateness, absence, overtime, penalties.
  // Leaves module also uses this to exclude holidays from leave duration.

  @Prop({
    type: [
      {
        date: Date,
        name: String,
        type: { type: String, enum: Object.values(HolidayType) },
      },
    ],
    default: [],
  })
  holidays: {
    date: Date;
    name: string;
    type: HolidayType;
  }[];

  // Dependency note:
  // weeklyRestDays must be synced with Shift + Attendance
  // to avoid false absence or lateness.
  
  @Prop({ type: [Number], default: [] })
  weeklyRestDays: number[];
}

export const HolidayCalendarSchema = SchemaFactory.createForClass(HolidayCalendar);