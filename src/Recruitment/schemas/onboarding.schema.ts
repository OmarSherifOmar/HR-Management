import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OnboardingDocument = HydratedDocument<Onboarding>;

@Schema({ timestamps: true })
export class Onboarding {
  @Prop({ required: true })
  candidateName: string;

  @Prop({ required: true })
  candidateEmail: string;

  @Prop({ type: [String], default: [] })
  taskChecklist: string[];

  @Prop({ type: [String], default: [] })
  documentsCollected: string[];

  @Prop({ default: false })
  accessProvisioned: boolean;

  @Prop({ default: false })
  resourcesAssigned: boolean;

  @Prop({ default: false })
  payrollInitiated: boolean;

  @Prop({ default: false })
  benefitsInitiated: boolean;

  @Prop({ default: false })
  readyForDayOne: boolean;
}

export const OnboardingSchema = SchemaFactory.createForClass(Onboarding);