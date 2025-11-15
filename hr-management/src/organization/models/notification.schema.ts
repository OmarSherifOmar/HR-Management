import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  /** User receiving the notification */
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  user: Types.ObjectId;

  /** Notification message content */
  @Prop({ type: String, required: true })
  message: string;

  /** Notification category (Approval, Request, StructureChange, etc.) */
  @Prop({ type: String, default: null })
  type?: string | null;

  /** Optional link to a change request */
  @Prop({ type: Types.ObjectId, ref: 'ChangeRequest', default: null })
  relatedRequest?: Types.ObjectId | null;

}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
