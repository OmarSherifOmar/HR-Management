import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { GraduationType } from '../enums/employee-profile.enums';
import { EmployeeProfile } from './employee-profile.schema';

@Schema({ collection: 'employee_qualifications', timestamps: true })
export class EmployeeQualification {
  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  employeeProfileId: Types.ObjectId;

  @Prop({ type: String, required: true })
  establishmentName: string;

  @Prop({
    type: String,
    enum: Object.values(GraduationType),
    required: true,
  })
  graduationType: GraduationType;
}

export const EmployeeQualificationSchema = SchemaFactory.createForClass(
  EmployeeQualification,
);
