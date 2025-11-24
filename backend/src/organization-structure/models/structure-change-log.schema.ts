import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ChangeLogAction } from '../enums/organization-structure.enums';
import { EmployeeProfile } from '../../employee-profile/models/employee-profile.schema';

export type StructureChangeLogDocument = HydratedDocument<StructureChangeLog>;

@Schema({ collection: 'structure_change_logs', timestamps: true })
export class StructureChangeLog {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(ChangeLogAction), required: true })
  action: ChangeLogAction;

  @Prop({ type: String, required: true })
  entityType: string; // Department, Position

  @Prop({ type: Types.ObjectId, required: true })
  entityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile' })
  performedByEmployeeId?: Types.ObjectId;

  @Prop({ type: String })
  summary?: string;

  @Prop({ type: Object })
  beforeSnapshot?: Record<string, unknown>;

  @Prop({ type: Object })
  afterSnapshot?: Record<string, unknown>;
}

export const StructureChangeLogSchema =
  SchemaFactory.createForClass(StructureChangeLog);
