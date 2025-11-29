import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export interface HolidayPeriod {
  from: Date;
  to: Date;
  reason: string;
}

export interface BlockedPeriod {
  from: Date;
  to: Date;
  reason: string;
}

export type CalendarDocument = HydratedDocument<Calendar>;

@Schema({ timestamps: true })
export class Calendar {
  @Prop({ required: true })
  year: number;

  @Prop({
    type: [{ from: Date, to: Date, reason: String }],
    default: [],
  })
  holidays: HolidayPeriod[];
  
  @Prop({
    type: [{ from: Date, to: Date, reason: String }],
    default: [],
  })
  blockedPeriods: BlockedPeriod[];
}

export const CalendarSchema = SchemaFactory.createForClass(Calendar);
