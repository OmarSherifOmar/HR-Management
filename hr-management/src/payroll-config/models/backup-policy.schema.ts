import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// Inputs from other subsystems: None (N/A)

export enum BackupFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum BackupPolicyStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true, collection: 'backup_policies' })
export class BackupPolicy extends Document {
  @Prop({ required: true, enum: Object.values(BackupFrequency) })
  frequency: BackupFrequency;

  @Prop({ required: true, min: 1 })
  retentionDays: number;

  @Prop({
    required: true,
    enum: Object.values(BackupPolicyStatus),
    default: BackupPolicyStatus.DRAFT,
  })
  status: BackupPolicyStatus;

  @Prop({ required: true })
  createdBy: string;

  @Prop()
  updatedBy?: string;
}

export const BackupPolicySchema = SchemaFactory.createForClass(BackupPolicy);
