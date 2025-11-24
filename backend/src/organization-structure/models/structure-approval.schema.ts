import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApprovalDecision } from '../enums/organization-structure.enums';
import { EmployeeProfile } from '../../employee-profile/models/employee-profile.schema';
import { StructureChangeRequest } from './structure-change-request.schema';

export type StructureApprovalDocument = HydratedDocument<StructureApproval>;

@Schema({ collection: 'structure_approvals', timestamps: true })
export class StructureApproval {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'StructureChangeRequest',
    required: true,
  })
  changeRequestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  approverEmployeeId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ApprovalDecision),
    default: ApprovalDecision.PENDING,
  })
  decision: ApprovalDecision;

  @Prop({ type: Date })
  decidedAt?: Date;

  @Prop({ type: String })
  comments?: string;
}

export const StructureApprovalSchema =
  SchemaFactory.createForClass(StructureApproval);
