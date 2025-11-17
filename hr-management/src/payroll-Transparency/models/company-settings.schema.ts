import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// Inputs from other subsystems: None (N/A)

export enum CompanySettingsStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true, collection: 'company_settings' })
export class CompanySettings extends Document {
  @Prop({ required: true })
  payDate: number;

  @Prop({ required: true })
  timeZone: string;

  @Prop({ required: true })
  currency: string;

  @Prop({
    required: true,
    enum: Object.values(CompanySettingsStatus),
    default: CompanySettingsStatus.DRAFT,
  })
  status: CompanySettingsStatus;

  @Prop({ required: true })
  createdBy: string;

  @Prop()
  updatedBy?: string;
}

export const CompanySettingsSchema = SchemaFactory.createForClass(CompanySettings);
