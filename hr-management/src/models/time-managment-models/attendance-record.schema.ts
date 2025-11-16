import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AttendanceRecordDocument = HydratedDocument<AttendanceRecord>;

@Schema({ timestamps: true })
export class AttendanceRecord {

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop()
  clockIn?: Date;

  @Prop()
  clockOut?: Date;

  @Prop()
  workedHours?: number;

  @Prop({ default: 0 })
  overtimeHours: number;

  @Prop({ default: 0 })
  penalties: number;

  @Prop({
    type: String,
    enum: ['Present', 'Late', 'Absent', 'OnLeave', 'MissingPunch'],
    default: 'Present',
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  validatedBy?: Types.ObjectId;

  @Prop()
  notes?: string;
}

export const AttendanceRecordSchema = SchemaFactory.createForClass(AttendanceRecord);
