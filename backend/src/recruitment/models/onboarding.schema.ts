import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OnboardingTaskStatus } from '../enums/onboarding-task-status.enum';

@Schema({ timestamps: true })
export class Onboarding {

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Contract', required: true })
  contractId: Types.ObjectId;

  @Prop([
    {
      name: String, // Task name: “Upload ID”, “Set up Email”
      department: String, // HR, IT, Admin
      status: { type: String, enum: Object.values(OnboardingTaskStatus), default: OnboardingTaskStatus.PENDING },
      deadline: Date,
      completedAt: Date,
      documentId: { type: Types.ObjectId, ref: 'Document' },
      notes: String,
    }
  ])
  tasks: any[];

  @Prop({ default: false })
  completed: boolean;

  @Prop()
  completedAt?: Date;
}

export type OnboardingDocument = HydratedDocument<Onboarding>;
export const OnboardingSchema = SchemaFactory.createForClass(Onboarding);