// src/shift/shift.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ShiftType {
  NORMAL = 'normal',
  SPLIT = 'split',
  OVERNIGHT = 'overnight',
  ROTATIONAL = 'rotational',
}

@Schema({ timestamps: true })
export class Shift extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: Object.values(ShiftType) })
  type: ShiftType;

  // Dependency note:
  // startTime + endTime WILL BE USED BY Attendance module
  // to validate lateness, overtime, and punch alignment
  
  @Prop()
  startTime?: string;

  @Prop()
  endTime?: string;

  // Dependency note:
  // For SPLIT shifts, Attendance must read these segments
  // when calculating hours and validating punch times

  @Prop({
    type: [
      {
        startTime: String,
        endTime: String,
      },
    ],
    default: [],
  })
  splitSegments?: { startTime: string; endTime: string }[];

  // Dependency note:
  // Rotational shifts require Schedule module to check
  // which shift applies on which date before attendance is processed

  @Prop({
    type: [
      {
        shiftId: { type: String },
        days: { type: Number },
      },
    ],
    default: [],
  })
  rotationPattern?: { shiftId: string; days: number }[];

  // Dependency note:
  // gracePeriodMinutes must be used by AttendancePolicy
  // to ignore lateness if within allowed threshold

  @Prop({ required: true })
  gracePeriodMinutes: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ShiftSchema = SchemaFactory.createForClass(Shift);

