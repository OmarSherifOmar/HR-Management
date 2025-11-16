import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ScheduleDocument = HydratedDocument<Schedule>;

@Schema({ timestamps: true })
export class Schedule {

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Shift', required: true })
  shiftId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop({ type: [Number], default: [1, 2, 3, 4, 5] }) // 1–7
  workingDays: number[];

  @Prop({ type: [Number] }) 
  restDays: number[];

  @Prop({ default: false })
  isRotational: boolean;

  // basically biweekly or monthly
  @Prop()
  rotationPattern?: string;

  @Prop({
    type: String,
    enum: ['Active', 'Expired'],
    default: 'Active',
  })
  status: string;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
