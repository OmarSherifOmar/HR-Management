import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApprovalStatus } from '../enums/approval-status.enum';
import { Department } from '../enums/department.enum';

export class DepartmentSignoff {
  @Prop({ type: String, enum: Department, required: true })
  department: Department;

  @Prop({
    type: String,
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Prop()
  comments?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  signedOffBy?: Types.ObjectId;

  @Prop()
  signedOffAt?: Date;
}

export class AssetItem {
  @Prop({ required: true })
  assetId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string; // IT Asset, ID Card, Keys, etc.

  @Prop({ default: false })
  returned: boolean;

  @Prop()
  condition?: string;

  @Prop()
  returnedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  returnedTo?: Types.ObjectId;
}

@Schema({ timestamps: true })
export class ClearanceChecklist {
  @Prop({ type: Types.ObjectId, ref: 'OffboardingProcess', required: true })
  offboardingProcessId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  employeeId: Types.ObjectId;

  /**
   * Multi-department sign-offs: IT, Finance, Facilities, Line Manager
   */
  @Prop({ type: [DepartmentSignoff], default: [] })
  departmentSignoffs: DepartmentSignoff[];

  /**
   * Equipment/Asset recovery list
   */
  @Prop({ type: [AssetItem], default: [] })
  assets: AssetItem[];

  @Prop({ default: false })
  allAssetsReturned: boolean;

  @Prop({ default: false })
  allSignoffsCompleted: boolean;

  @Prop()
  completedAt?: Date;
}

export type ClearanceChecklistDocument = HydratedDocument<ClearanceChecklist>;
export const ClearanceChecklistSchema =
  SchemaFactory.createForClass(ClearanceChecklist);
