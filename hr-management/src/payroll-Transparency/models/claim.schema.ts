import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

@Schema({ timestamps: true, collection: 'claims' })
export class Claim extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  type: string; // e.g. 'TRANSPORTATION', 'MEAL', 'WORK_EXPENSE'

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop([
    {
      filename: { type: String, required: true },
      url: { type: String, required: true },
      contentType: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    },
  ])
  attachments?: Array<{
    filename: string;
    url: string;
    contentType?: string;
    uploadedAt?: Date;
  }>;

  @Prop([
    {
      role: { type: String, required: true },
      approverId: { type: Types.ObjectId, ref: 'Employee' },
      status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
      },
      decidedAt: { type: Date },
      note: { type: String },
    },
  ])
  approvalChain?: Array<{
    role: string;
    approverId?: Types.ObjectId;
    status?: ClaimStatus;
    decidedAt?: Date;
    note?: string;
  }>;

  @Prop({
    required: true,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  })
  status: ClaimStatus;

  @Prop()
  submittedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Employee' })
  submittedBy?: Types.ObjectId;

  @Prop()
  notes?: string;
}

export const ClaimSchema = SchemaFactory.createForClass(Claim);
