import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationType } from './notification-types.enum';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    default: null,
  })
  type?: NotificationType | null;

  @Prop({ type: Types.ObjectId, ref: 'ChangeRequest', default: null })
  relatedRequest?: Types.ObjectId | null;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
