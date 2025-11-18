import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Employee } from '../../employee-organization-performancesubsystem/employee/models/employee.schema';
import { LeaveRequest } from '../../leaves/models/leave-request.schema';
export type AttendanceRecordDocument = HydratedDocument<AttendanceRecord>;

@Schema({ timestamps: true })
export class AttendanceRecord {
// References Employee Profile Module
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

  // HR/Admin/Manager who approved or validated the attendanc
  @Prop({ type: Types.ObjectId, ref: 'Employee' })
  validatedBy?: Types.ObjectId;

  // Reference to associated leave request if status is 'OnLeave'
  @Prop({ type: Types.ObjectId, ref: 'LeaveRequest' })
leaveRequestId?: Types.ObjectId;

  @Prop()
  notes?: string;
}

export const AttendanceRecordSchema = SchemaFactory.createForClass(AttendanceRecord);
