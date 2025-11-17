import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ResignationStatus = 'pending' | 'scheduled' | 'processed' | 'cancelled' | 'failed';

@Schema({ timestamps: true, collection: 'resignations' })
export class Resignation {
  @Prop({ required: true })
  payrollRunId!: string;

  @Prop({ required: true })
  employeeId!: string;

  @Prop()
  employeeNumber?: string;

  @Prop()
  resignationDate?: Date;

  @Prop()
  lastWorkingDate?: Date;

  @Prop({ default: 0 })
  noticePeriodDays!: number;

  @Prop({ default: false })
  noticeWaived!: boolean;

  @Prop({ default: 0 })
  pendingVacationPayout!: number;

  @Prop({ default: 0 })
  gratuityAmount!: number;

  @Prop({ default: 0 })
  recoveryAmount!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({ required: true, enum: ['pending', 'scheduled', 'processed', 'cancelled', 'failed'], default: 'pending' })
  status!: ResignationStatus;

  @Prop()
  processedAt?: Date;

  @Prop()
  processedBy?: string;

  @Prop({ type: [String], default: [] })
  notes!: string[];

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;
}

export type ResignationDocument = HydratedDocument<Resignation>;
export const ResignationSchema = SchemaFactory.createForClass(Resignation);
