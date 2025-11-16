import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({ timestamps: true })
export class Permission {
  @Prop({ required: true, unique: true }) key: string; // e.g. 'employee.view'
  @Prop() name?: string;
  @Prop() description?: string;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
export const PERMISSION_MODEL = 'Permission';
