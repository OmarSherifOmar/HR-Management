import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApprovalStatus } from '../enums/approval-status.enum';

@Schema({ timestamps: true })
export class ClearanceChecklist {

  @Prop({ type: Types.ObjectId, ref: 'TerminationRequest', required: true })
  terminationId: Types.ObjectId;

  /**
   * Department approvals: IT, Finance, Facilities, HR, Admin
   */
  @Prop([
    {
      department: String,
      status: { type: String, enum: ApprovalStatus, default: ApprovalStatus.PENDING },
      comments: String,
      updatedBy: { type: Types.ObjectId, ref: 'User' },
      updatedAt: Date,
    }
  ])
  items: any[];

  /**
   * Equipment returned (Laptop, Monitor, Keys, Phone, etc.)
   */
  @Prop([
    {
      equipmentId: Types.ObjectId,
      name: String,
      returned: Boolean,
      condition: String,
    }
  ])
  equipmentList: any[];

  /**
   * Access card return
   */
  @Prop({ default: false })
  cardReturned: boolean;
}

export type ClearanceChecklistDocument = HydratedDocument<ClearanceChecklist>;
export const ClearanceChecklistSchema =
  SchemaFactory.createForClass(ClearanceChecklist);
