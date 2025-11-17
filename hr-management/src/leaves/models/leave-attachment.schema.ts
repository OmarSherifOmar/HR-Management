import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { LeaveRequest, LeaveRequestDocument } from './leave-request.schema';

export type LeaveAttachmentDocument = HydratedDocument<LeaveAttachment>;

@Schema({ timestamps: true })
export class LeaveAttachment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest', required: true, index: true })
  leaveRequestId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  documentType: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ required: true })
  mimeType: string;

  @Prop()
  description: string;

  // HR verification
  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  verifiedBy: mongoose.Types.ObjectId;


  
  @Prop()
  verifiedAt: Date;

  @Prop()
  verificationNotes: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  uploadedBy: mongoose.Types.ObjectId;
}

export const LeaveAttachmentSchema = SchemaFactory.createForClass(LeaveAttachment);

LeaveAttachmentSchema.index({ leaveRequestId: 1 });
