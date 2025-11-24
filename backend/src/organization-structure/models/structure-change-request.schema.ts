import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  StructureRequestStatus,
  StructureRequestType,
} from '../enums/organization-structure.enums';
import { EmployeeProfile } from '../../employee-profile/models/employee-profile.schema';

export type StructureChangeRequestDocument =
  HydratedDocument<StructureChangeRequest>;

@Schema({ collection: 'structure_change_requests', timestamps: true })
export class StructureChangeRequest {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  requestNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  requestedByEmployeeId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(StructureRequestType),
    required: true,
  })
  requestType: StructureRequestType;

  @Prop({ type: Types.ObjectId })
  targetDepartmentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  targetPositionId?: Types.ObjectId;

  @Prop({ type: String })
  details?: string;

  @Prop({ type: String })
  reason?: string;

  @Prop({
    type: String,
    enum: Object.values(StructureRequestStatus),
    default: StructureRequestStatus.DRAFT,
  })
  status: StructureRequestStatus;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile' })
  submittedByEmployeeId?: Types.ObjectId;

  @Prop({ type: Date })
  submittedAt?: Date;
}

export const StructureChangeRequestSchema = SchemaFactory.createForClass(
  StructureChangeRequest,
);
