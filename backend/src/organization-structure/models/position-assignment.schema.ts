import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EmployeeProfile } from '../../employee-profile/models/employee-profile.schema';
import { Department } from './department.schema';
import { Position } from './position.schema';
import { StructureChangeRequest } from './structure-change-request.schema';

export type PositionAssignmentDocument = HydratedDocument<PositionAssignment>;

@Schema({ collection: 'position_assignments', timestamps: true })
export class PositionAssignment {
  @Prop({ type: Types.ObjectId, ref: EmployeeProfile.name, required: true })
  employeeProfileId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Position', required: true })
  positionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  departmentId: Types.ObjectId; // snapshot of owning department at assignment time

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'StructureChangeRequest' })
  changeRequestId?: Types.ObjectId;

  @Prop({ type: String })
  reason?: string;

  @Prop({ type: String })
  notes?: string;
}

export const PositionAssignmentSchema =
  SchemaFactory.createForClass(PositionAssignment);
