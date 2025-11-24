import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ProfileChangeStatus } from '../enums/employee-profile.enums';
import { EmployeeProfile } from './employee-profile.schema';

@Schema({ collection: 'employee_profile_change_requests', timestamps: true })
export class EmployeeProfileChangeRequest {
  @Prop({ type: String, required: true, unique: true })
  requestId: string;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  employeeProfileId: Types.ObjectId;

  @Prop({ type: String, required: true })
  requestDescription: string;

  @Prop({ type: String })
  reason?: string;

  @Prop({
    type: String,
    enum: Object.values(ProfileChangeStatus),
    default: ProfileChangeStatus.PENDING,
  })
  status: ProfileChangeStatus;

  @Prop({ type: Date, default: () => new Date() })
  submittedAt: Date;

  @Prop({ type: Date })
  processedAt?: Date;
}

export const EmployeeProfileChangeRequestSchema = SchemaFactory.createForClass(
  EmployeeProfileChangeRequest,
);
