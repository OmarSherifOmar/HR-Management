import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Employee } from './employee.schema';
export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true, versionKey: false })
export class AuditLog {
  @Prop({ required: true })
  entityType: string; // e.g. 'Employee', 'ChangeRequest', 'AppraisalForm'

  @Prop({ type: Types.ObjectId, required: false })
  entityId?: Types.ObjectId;

  @Prop({ required: true })
  action: string; // e.g. 'CREATE', 'UPDATE', 'REQUEST_CHANGE', 'APPROVE_CHANGE', 'MANAGER_VIEW', 'UPDATE_MANAGER'

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: false })
  actor?: Types.ObjectId; // who performed the action (user/employee id)

  @Prop({ required: false })
  actorType?: string; // 'User' | 'System' | 'Scheduler' etc
  
  @Prop()
  details?: Record<string, any>; 

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: false })
  notificationsSent?: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'Notification', default: [] })
  notificationIds?: Types.ObjectId[];
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);


export const AUDIT_MODEL = 'AuditLog';
