import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CandidateStatus } from '../enums/employee-profile.enums';
import { Department } from '../../organization-structure/models/department.schema';
import { Position } from '../../organization-structure/models/position.schema';
import { UserProfileBase } from './user-schema';

export type CandidateDocument = HydratedDocument<Candidate>;

@Schema({ collection: 'candidates', timestamps: true })
export class Candidate extends UserProfileBase {
  @Prop({ type: String, required: true, unique: true })
  candidateNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Position' })
  positionId?: Types.ObjectId;

  @Prop({ type: Date })
  applicationDate?: Date;

  @Prop({
    type: String,
    enum: Object.values(CandidateStatus),
    default: CandidateStatus.APPLIED,
  })
  status: CandidateStatus;

  @Prop({ type: String })
  resumeUrl?: string;

  @Prop({ type: String })
  notes?: string;
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate);
