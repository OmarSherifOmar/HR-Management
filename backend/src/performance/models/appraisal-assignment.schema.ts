import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AppraisalAssignmentStatus } from '../enums/performance.enums';
import { Department } from '../../organization-structure/models/department.schema';
import { Position } from '../../organization-structure/models/position.schema';
import { EmployeeProfile } from '../../employee-profile/models/employee-profile.schema';
import { AppraisalCycle } from './appraisal-cycle.schema';
import { AppraisalTemplate } from './appraisal-template.schema';

export type AppraisalAssignmentDocument = HydratedDocument<AppraisalAssignment>;

@Schema({ collection: 'appraisal_assignments', timestamps: true })
export class AppraisalAssignment {
  @Prop({ type: Types.ObjectId, ref: 'AppraisalCycle', required: true })
  cycleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AppraisalTemplate', required: true })
  templateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  employeeProfileId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  managerProfileId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  departmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Position' })
  positionId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(AppraisalAssignmentStatus),
    default: AppraisalAssignmentStatus.NOT_STARTED,
  })
  status: AppraisalAssignmentStatus;

  @Prop({ type: Date, default: () => new Date() })
  assignedAt: Date;

  @Prop({ type: Date })
  dueDate?: Date;

  @Prop({ type: Date })
  submittedAt?: Date;

  @Prop({ type: Date })
  publishedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'AppraisalRecord' })
  latestAppraisalId?: Types.ObjectId;
}

export const AppraisalAssignmentSchema =
  SchemaFactory.createForClass(AppraisalAssignment);
