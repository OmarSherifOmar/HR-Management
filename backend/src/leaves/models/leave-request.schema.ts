// schemas/leave-request.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { LeaveStatus } from '../enums/leave-status.enum';

export type LeaveRequestDocument = HydratedDocument<LeaveRequest>;

@Schema({ timestamps: true })
export class LeaveRequest {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'LeaveType', required: true })
  leaveTypeId: Types.ObjectId;

  @Prop({
    type: { from: Date, to: Date },
    required: true,
  })
  dates: { from: Date; to: Date };

  @Prop({ required: true })
  durationDays: number;

  @Prop()
  justification?: string;

  @Prop({ type: Types.ObjectId, ref: 'Attachment' })
  attachmentId?: Types.ObjectId;

  @Prop({
    type: [
      {
        role: String,
        status: String,
        decidedBy: { type: Types.ObjectId, ref: 'Employee' },
        decidedAt: Date,
      },
    ],
    default: [],
  })
  approvalFlow: {
    role: string;
    status: string;
    decidedBy?: Types.ObjectId;
    decidedAt?: Date;
  }[];

  @Prop({
    enum: LeaveStatus,
    default: LeaveStatus.PENDING,
  })
  status: LeaveStatus;

  @Prop({ default: false })
  irregularPatternFlag: boolean;
}

export const LeaveRequestSchema =
  SchemaFactory.createForClass(LeaveRequest);
