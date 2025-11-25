import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CalendarDocument = HydratedDocument<Calendar>;

@Schema({ timestamps: true })
export class Calendar {
  @Prop({ required: true })
  year: number;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Holiday' }],
    default: [],
  })
  holidays: Types.ObjectId[];

  @Prop({
    type: [{ from: Date, to: Date, reason: String }],
    default: [],
  })
  blockedPeriods: { from: Date; to: Date; reason: string }[];
}

export const CalendarSchema = SchemaFactory.createForClass(Calendar);
