import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type PayrollFreezeDocument = HydratedDocument<PayrollFreeze>;

@Schema({ timestamps: true })
export class PayrollFreeze {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun', required: true })
  runId: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: ['freeze', 'unfreeze'] })
  action: 'freeze' | 'unfreeze';

  @Prop({ required: true })
  performedBy: string;

  @Prop()
  reason: string;

  @Prop({ default: Date.now })
  actionAt: Date;
}

export const PayrollFreezeSchema = SchemaFactory.createForClass(PayrollFreeze);
