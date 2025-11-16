import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true, versionKey: false })
export class AuditLog {
  @Prop({ required: true })
  entityType: string; 

  @Prop({ type: Types.ObjectId })
  entityId?: Types.ObjectId;

  @Prop({ required: true })
  action: string; 

  @Prop({ type: Types.ObjectId, ref: 'Employee' })
  actor?: Types.ObjectId; 

  @Prop()
  details?: Record<string, any>;// free-form metadata (old/new values etc)

  @Prop({ default: Date.now })
  createdAt?: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
export const AUDIT_MODEL = 'AuditLog';
